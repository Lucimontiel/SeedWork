"""
auth.py - Endpoints de autenticación con JWT + refresh tokens + 2FA.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, BackgroundTasks

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from jose import JWTError # ⬅️ NUEVO: Necesario para el challenge
import qrcode
import io
import base64

from database import get_db
from models import (
    Usuario, Candidato, Empresa, Administrador,
    RefreshToken, CodigoRespaldo, EstadoUsuario, Rol,
)

from schemas import (
    LoginTokenIn, AdminLoginIn, AdminLogin2FAIn,
    AdminLoginChallengeOut,
    TokenOut, MeOut, Setup2FAOut,
    Enable2FAIn, Enable2FAOut, Disable2FAIn, RegenerateBackupOut,
)

from security import (
    verify_and_update,
    verify_password,     # necesario para el timing fix
    hash_password,       # necesario para _DUMMY_HASH y para cambiar_contrasena
    crear_access_token,
    generar_refresh_token,
    hashear_refresh_token,
    duracion_refresh,
    _duracion_access_minutos,
    verificar_codigo_totp,
    generar_secreto_totp,
    uri_totp,
    generar_codigos_respaldo,
    verificar_codigo_respaldo,
    crear_challenge_token,     # ⬅️ NUEVO
    decodificar_challenge_token # ⬅️ NUEVO
)
from dependencies import (
    COOKIE_ACCESS_TOKEN,
    get_current_user,
    require_role,
)
from audit import (
    registrar_evento,
    EVENTO_LOGIN_EXITOSO,
    EVENTO_LOGIN_FALLIDO,
    EVENTO_LOGIN_BLOQUEADO,
    EVENTO_CUENTA_BLOQUEADA,
    EVENTO_LOGOUT,
    EVENTO_REFRESH,
    EVENTO_REFRESH_REUSO,
    EVENTO_2FA_REQUERIDO,
    EVENTO_2FA_EXITOSO,
    EVENTO_2FA_FALLIDO,
    EVENTO_2FA_SETUP,
)
from rate_limit import (
    limiter,
    LIMIT_LOGIN, LIMIT_REFRESH, LIMIT_2FA,
)

import hashlib
import secrets
from models import PasswordResetToken, EmailVerificationToken
from email_service import enviar_correo_recuperacion, enviar_correo_verificacion
from schemas import OlvidePasswordIn, RestablecerPasswordIn

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# ============================================================
# TIMING ATTACK PROTECTION
# Hash precomputado para consumir el mismo tiempo de argon2
# cuando el correo NO existe (evita user enumeration)
# ============================================================
_DUMMY_HASH = hash_password("dummy_password_for_timing_protection")

# ============================================================
# CONFIGURACIÓN DE COOKIES
# ============================================================
COOKIE_REFRESH_TOKEN = "sw_refresh_token"

ENV = os.getenv("ENV", "dev").lower()
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", "") or None
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()

MAX_INTENTOS_FALLIDOS = int(os.getenv("MAX_INTENTOS_FALLIDOS", "5"))
BLOQUEO_MINUTOS = int(os.getenv("BLOQUEO_MINUTOS", "15"))

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ============================================================
# HELPERS
# ============================================================
def _set_cookies(response: Response, access_token: str, refresh_token: str, rol: str):
    response.set_cookie(
        key=COOKIE_ACCESS_TOKEN,
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        max_age=_duracion_access_minutos(rol) * 60,
        path="/",
    )
    expira = duracion_refresh(rol)
    response.set_cookie(
        key=COOKIE_REFRESH_TOKEN,
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        max_age=int(expira.total_seconds()),
        path="/api/auth",
    )

def _clear_cookies(response: Response):
    response.delete_cookie(COOKIE_ACCESS_TOKEN, path="/")
    response.delete_cookie(COOKIE_REFRESH_TOKEN, path="/api/auth")

def _guardar_refresh_token(db: Session, id_usuario: int, token_plano: str, expira: timedelta, request: Request) -> RefreshToken:
    token_hash = hashear_refresh_token(token_plano)
    expira_en = datetime.now(timezone.utc) + expira
    ua = request.headers.get("user-agent", "")[:255] if request else None
    ip = request.client.host if request and request.client else None
    rt = RefreshToken(
        IdUsuario=id_usuario,
        TokenHash=token_hash,
        ExpiraEn=expira_en.replace(tzinfo=None),
        UserAgent=ua,
        IP=ip,
    )
    db.add(rt)
    db.flush()
    return rt

def _tipo_de_rol(rol_nombre: str) -> str:
    r = rol_nombre.lower()
    if r == "administrador": return "administrador"
    if r == "empresa": return "empresa"
    return "candidato"

def _construir_me_out(usuario: Usuario) -> MeOut:
    rol_nombre = usuario.rol.Nombre if usuario.rol else ""
    tipo = _tipo_de_rol(rol_nombre)
    return MeOut(
        idUsuario=usuario.IdUsuario,
        correo=usuario.Correo,
        rol=rol_nombre,
        tipo=tipo,
        idCandidato=usuario.candidato.IdCandidato if usuario.candidato else None,
        idEmpresa=usuario.empresa.IdEmpresa if usuario.empresa else None,
        idAdministrador=usuario.administrador.IdAdministrador if usuario.administrador else None,
        totpHabilitado=bool(usuario.TotpHabilitado),
        emailVerificado=bool(usuario.EmailVerificado),
    )

# ============================================================
# LOGIN (candidato / empresa)
# ============================================================
@router.post("/login", response_model=AdminLoginChallengeOut | TokenOut)
@limiter.limit(LIMIT_LOGIN)
async def login(request: Request, response: Response, body: LoginTokenIn, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.Correo == body.correo).first()

    if usuario and usuario.BloqueadoHasta:
        ahora = datetime.now(timezone.utc).replace(tzinfo=None)
        if usuario.BloqueadoHasta > ahora:
            restante = int((usuario.BloqueadoHasta - ahora).total_seconds() / 60) + 1
            registrar_evento(db, evento=EVENTO_LOGIN_BLOQUEADO, exito=False, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles=f"Bloqueado por {restante} minutos más")
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=f"Cuenta bloqueada temporalmente. Intenta en {restante} minutos.")

    # Precomputar un hash dummy una sola vez al cargar el módulo
    valido = False
    nuevo_hash = None
    if usuario:
        valido, nuevo_hash = verify_and_update(body.contrasena, usuario.Contrasena)
    else:
        # FIX: consumir el mismo tiempo de argon2 aunque el usuario no exista
        verify_password(body.contrasena, _DUMMY_HASH)
        valido = False
        nuevo_hash = None

    if not usuario or not valido:
        if usuario:
            usuario.IntentosFallidos = (usuario.IntentosFallidos or 0) + 1
            if usuario.IntentosFallidos >= MAX_INTENTOS_FALLIDOS:
                usuario.BloqueadoHasta = (datetime.now(timezone.utc) + timedelta(minutes=BLOQUEO_MINUTOS)).replace(tzinfo=None)
                registrar_evento(db, evento=EVENTO_CUENTA_BLOQUEADA, exito=False, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles=f"Bloqueado por {BLOQUEO_MINUTOS} min tras {usuario.IntentosFallidos} intentos")
            db.commit()
        registrar_evento(db, evento=EVENTO_LOGIN_FALLIDO, exito=False, id_usuario=usuario.IdUsuario if usuario else None, correo_intentado=body.correo, request=request, detalles=f"tipo={body.tipo}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña incorrectos.")

    usuario.IntentosFallidos = 0
    usuario.BloqueadoHasta = None
    if nuevo_hash: usuario.Contrasena = nuevo_hash
    usuario.UltimoLogin = datetime.now(timezone.utc).replace(tzinfo=None)
    if request.client: usuario.UltimoLoginIP = request.client.host

    rol_nombre = usuario.rol.Nombre if usuario.rol else ""
    tipo_esperado = _tipo_de_rol(rol_nombre)
    if tipo_esperado != body.tipo:
        db.commit()
        registrar_evento(db, evento=EVENTO_LOGIN_FALLIDO, exito=False, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles=f"Tipo solicitado={body.tipo}, tipo real={tipo_esperado}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Esta cuenta no es de tipo {body.tipo}.")

    if usuario.estado and usuario.estado.Nombre != "Activo":
        db.commit()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Cuenta {usuario.estado.Nombre.lower()}. Contacta a soporte.")

        # ==========================================
    # NUEVO: Verificar si el usuario tiene 2FA activo
    # ==========================================
    if usuario.TotpHabilitado and usuario.TotpSecret:
        registrar_evento(db, evento=EVENTO_2FA_REQUERIDO, exito=True, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, commit=True)
        challenge = crear_challenge_token(usuario.IdUsuario)
        return AdminLoginChallengeOut(
            dos_fa_requerido=True, 
            challenge_token=challenge, 
            message="Ingresa el código de tu app de autenticación."
        )

    # Si no tiene 2FA, continúa con el login normal:
    access_token = crear_access_token(usuario.IdUsuario, rol_nombre)
    refresh_token_plano = generar_refresh_token()
    expira_refresh = duracion_refresh(rol_nombre)
    _guardar_refresh_token(db, usuario.IdUsuario, refresh_token_plano, expira_refresh, request)

    registrar_evento(db, evento=EVENTO_LOGIN_EXITOSO, exito=True, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles=f"tipo={body.tipo}", commit=False)
    db.commit()
    _set_cookies(response, access_token, refresh_token_plano, rol_nombre)
    return TokenOut(access_token=access_token, expires_in=_duracion_access_minutos(rol_nombre) * 60)

# ============================================================
# LOGIN 2FA (paso 2 para candidatos / empresas)
# ============================================================
@router.post("/login/2fa", response_model=TokenOut)
@limiter.limit(LIMIT_2FA)
async def login_2fa(
    request: Request,
    response: Response,
    body: AdminLogin2FAIn,
    db: Session = Depends(get_db),
):
    try:
        id_usuario = decodificar_challenge_token(body.challenge_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El tiempo para ingresar el código ha expirado. Vuelve a iniciar sesión.",
        )

    usuario = db.query(Usuario).filter(Usuario.IdUsuario == id_usuario).first()
    if not usuario or not usuario.TotpHabilitado or not usuario.TotpSecret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas.")

    # Verificar bloqueo
    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    if usuario.BloqueadoHasta and usuario.BloqueadoHasta > ahora:
        restante = int((usuario.BloqueadoHasta - ahora).total_seconds() / 60) + 1
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=f"Cuenta bloqueada. Intenta en {restante} minutos.")

    codigo = body.codigo.strip()
    
    # 1. Validar código TOTP
    valido = verificar_codigo_totp(usuario.TotpSecret, codigo)

    # 2. Si no es TOTP, validar como backup code
    if not valido:
        codigos = db.query(CodigoRespaldo).filter(
            CodigoRespaldo.IdUsuario == usuario.IdUsuario, 
            CodigoRespaldo.Usado == False
        ).all()
        for cr in codigos:
            if verificar_codigo_respaldo(codigo, cr.CodigoHash):
                cr.Usado = True
                cr.UsadoEn = ahora
                valido = True
                break

    if not valido:
        registrar_evento(db, evento=EVENTO_2FA_FALLIDO, exito=False, id_usuario=usuario.IdUsuario, request=request)
        usuario.IntentosFallidos = (usuario.IntentosFallidos or 0) + 1
        if usuario.IntentosFallidos >= MAX_INTENTOS_FALLIDOS:
            usuario.BloqueadoHasta = (datetime.now(timezone.utc) + timedelta(minutes=BLOQUEO_MINUTOS)).replace(tzinfo=None)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Código inválido.")

    # Si es válido, generar sesión
    rol_nombre = usuario.rol.Nombre if usuario.rol else ""
    
    access_token = crear_access_token(usuario.IdUsuario, rol_nombre)
    refresh_plano = generar_refresh_token()
    _guardar_refresh_token(db, usuario.IdUsuario, refresh_plano, duracion_refresh(rol_nombre), request)
    
    usuario.UltimoLogin = datetime.now(timezone.utc).replace(tzinfo=None)
    usuario.IntentosFallidos = 0
    usuario.BloqueadoHasta = None
    
    registrar_evento(db, evento=EVENTO_2FA_EXITOSO, exito=True, id_usuario=usuario.IdUsuario, request=request, commit=False)
    db.commit()
    
    _set_cookies(response, access_token, refresh_plano, rol_nombre)
    return TokenOut(access_token=access_token, expires_in=_duracion_access_minutos(rol_nombre) * 60)

# ============================================================
# REFRESH
# ============================================================
@router.post("/refresh", response_model=TokenOut)
@limiter.limit(LIMIT_REFRESH)
async def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token_plano = request.cookies.get(COOKIE_REFRESH_TOKEN)
    if not token_plano:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No hay refresh token.")

    token_hash = hashear_refresh_token(token_plano)
    rt = db.query(RefreshToken).filter(RefreshToken.TokenHash == token_hash).first()

    if not rt:
        _clear_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido.")

    if rt.Revocado:
        db.query(RefreshToken).filter(RefreshToken.IdUsuario == rt.IdUsuario, RefreshToken.Revocado == False).update({"Revocado": True, "RevocadoEn": datetime.now(timezone.utc).replace(tzinfo=None)})
        registrar_evento(db, evento=EVENTO_REFRESH_REUSO, exito=False, id_usuario=rt.IdUsuario, request=request, detalles=f"RefreshToken Id={rt.IdRefreshToken} reusado")
        db.commit()
        _clear_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión comprometida. Vuelve a iniciar sesión.")

    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    if rt.ExpiraEn < ahora:
        rt.Revocado = True
        rt.RevocadoEn = ahora
        db.commit()
        _clear_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expirado.")

    usuario = db.query(Usuario).filter(Usuario.IdUsuario == rt.IdUsuario).first()
    if not usuario:
        _clear_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado.")

    if usuario.estado and usuario.estado.Nombre != "Activo":
        _clear_cookies(response)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Cuenta {usuario.estado.Nombre.lower()}.")

    rol_nombre = usuario.rol.Nombre if usuario.rol else ""
    rt.Revocado = True
    rt.RevocadoEn = ahora

    nuevo_refresh_plano = generar_refresh_token()
    nuevo_rt = _guardar_refresh_token(db, usuario.IdUsuario, nuevo_refresh_plano, duracion_refresh(rol_nombre), request)
    rt.ReemplazadoPor = nuevo_rt.IdRefreshToken

    nuevo_access = crear_access_token(usuario.IdUsuario, rol_nombre)
    registrar_evento(db, evento=EVENTO_REFRESH, exito=True, id_usuario=usuario.IdUsuario, request=request, commit=False)
    db.commit()
    _set_cookies(response, nuevo_access, nuevo_refresh_plano, rol_nombre)
    return TokenOut(access_token=nuevo_access, expires_in=_duracion_access_minutos(rol_nombre) * 60)

# ============================================================
# LOGOUT
# ============================================================
@router.post("/logout")
async def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token_plano = request.cookies.get(COOKIE_REFRESH_TOKEN)
    if token_plano:
        token_hash = hashear_refresh_token(token_plano)
        rt = db.query(RefreshToken).filter(RefreshToken.TokenHash == token_hash).first()
        if rt and not rt.Revocado:
            rt.Revocado = True
            rt.RevocadoEn = datetime.now(timezone.utc).replace(tzinfo=None)
            registrar_evento(db, evento=EVENTO_LOGOUT, exito=True, id_usuario=rt.IdUsuario, request=request, commit=False)
            db.commit()
    _clear_cookies(response)
    return {"message": "Sesión cerrada."}

# ============================================================
# ME
# ============================================================
@router.get("/me", response_model=MeOut)
async def me(usuario: Usuario = Depends(get_current_user)):
    return _construir_me_out(usuario)

# ============================================================
# ADMIN LOGIN (paso 1)
# ============================================================
@router.post("/admin/login", response_model=AdminLoginChallengeOut | TokenOut)
@limiter.limit(LIMIT_LOGIN)
async def admin_login(request: Request, response: Response, body: AdminLoginIn, db: Session = Depends(get_db)):
    # ⬇️ ESTA LÍNEA ES VITAL. SI FALTA, DA EL ERROR.
    usuario = db.query(Usuario).filter(Usuario.Correo == body.correo).first()

    if usuario and usuario.BloqueadoHasta:
        ahora = datetime.now(timezone.utc).replace(tzinfo=None)
        if usuario.BloqueadoHasta > ahora:
            registrar_evento(db, evento=EVENTO_LOGIN_BLOQUEADO, exito=False, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request)
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Credenciales incorrectas.")

    valido = False
    if usuario:
        valido, _ = verify_and_update(body.contrasena, usuario.Contrasena)
    else:
        # FIX: mismo patrón que en login para evitar timing attacks
        verify_password(body.contrasena, _DUMMY_HASH)
        valido = False

    if not usuario or not valido:
        if usuario:
            usuario.IntentosFallidos = (usuario.IntentosFallidos or 0) + 1
            if usuario.IntentosFallidos >= MAX_INTENTOS_FALLIDOS:
                usuario.BloqueadoHasta = (datetime.now(timezone.utc) + timedelta(minutes=BLOQUEO_MINUTOS)).replace(tzinfo=None)
            db.commit()
        registrar_evento(db, evento=EVENTO_LOGIN_FALLIDO, exito=False, id_usuario=usuario.IdUsuario if usuario else None, correo_intentado=body.correo, request=request, detalles="admin_login paso 1")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas.")

    rol_nombre = usuario.rol.Nombre if usuario.rol else ""
    if rol_nombre.lower() != "administrador":
        registrar_evento(db, evento=EVENTO_LOGIN_FALLIDO, exito=False, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles="Intento de login admin con cuenta no-admin")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas.")

    usuario.IntentosFallidos = 0
    usuario.BloqueadoHasta = None
    db.commit()

    if usuario.TotpHabilitado and usuario.TotpSecret:
        registrar_evento(db, evento=EVENTO_2FA_REQUERIDO, exito=True, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request)
        challenge = crear_challenge_token(usuario.IdUsuario)
        return AdminLoginChallengeOut(dos_fa_requerido=True, challenge_token=challenge, message="Ingresa el código de tu app de autenticación.")

    access_token = crear_access_token(usuario.IdUsuario, rol_nombre)
    refresh_plano = generar_refresh_token()
    _guardar_refresh_token(db, usuario.IdUsuario, refresh_plano, duracion_refresh(rol_nombre), request)
    usuario.UltimoLogin = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    _set_cookies(response, access_token, refresh_plano, rol_nombre)
    return TokenOut(access_token=access_token, expires_in=_duracion_access_minutos(rol_nombre) * 60)

# ============================================================
# ADMIN LOGIN (paso 2)
# ============================================================
@router.post("/admin/login/2fa", response_model=TokenOut)
@limiter.limit(LIMIT_2FA)
async def admin_login_2fa(request: Request, response: Response, body: AdminLogin2FAIn, db: Session = Depends(get_db)):
    try:
        id_usuario = decodificar_challenge_token(body.challenge_token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="El tiempo para ingresar el código ha expirado o el token es inválido. Vuelve a iniciar sesión.")

    # ⬇️ VITAL: Buscar al usuario ANTES de leer sus propiedades.
    usuario = db.query(Usuario).filter(Usuario.IdUsuario == id_usuario).first()
    if not usuario or not usuario.TotpHabilitado or not usuario.TotpSecret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas.")

    # ⬇️ FIX: verificar bloqueo (esto ya puede leer `usuario` sin problemas)
    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    if usuario.BloqueadoHasta and usuario.BloqueadoHasta > ahora:
        restante = int((usuario.BloqueadoHasta - ahora).total_seconds() / 60) + 1
        registrar_evento(
            db,
            evento=EVENTO_LOGIN_BLOQUEADO,
            exito=False,
            id_usuario=usuario.IdUsuario,
            request=request,
            detalles=f"2FA bloqueado por {restante} minutos más",
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Cuenta bloqueada temporalmente. Intenta en {restante} minutos.",
        )

    rol_nombre = usuario.rol.Nombre if usuario.rol else ""
    if rol_nombre.lower() != "administrador":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas.")

    codigo = body.codigo.strip()
    valido = verificar_codigo_totp(usuario.TotpSecret, codigo)

    if not valido:
        codigos = db.query(CodigoRespaldo).filter(CodigoRespaldo.IdUsuario == usuario.IdUsuario, CodigoRespaldo.Usado == False).all()
        for cr in codigos:
            if verificar_codigo_respaldo(codigo, cr.CodigoHash):
                cr.Usado = True
                cr.UsadoEn = datetime.now(timezone.utc).replace(tzinfo=None)
                valido = True
                break

    if not valido:
        registrar_evento(db, evento=EVENTO_2FA_FALLIDO, exito=False, id_usuario=usuario.IdUsuario, request=request)
        usuario.IntentosFallidos = (usuario.IntentosFallidos or 0) + 1
        if usuario.IntentosFallidos >= MAX_INTENTOS_FALLIDOS:
            usuario.BloqueadoHasta = (datetime.now(timezone.utc) + timedelta(minutes=BLOQUEO_MINUTOS)).replace(tzinfo=None)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Código inválido.")

    access_token = crear_access_token(usuario.IdUsuario, rol_nombre)
    refresh_plano = generar_refresh_token()
    _guardar_refresh_token(db, usuario.IdUsuario, refresh_plano, duracion_refresh(rol_nombre), request)
    usuario.UltimoLogin = datetime.now(timezone.utc).replace(tzinfo=None)
    usuario.IntentosFallidos = 0
    usuario.BloqueadoHasta = None
    
    registrar_evento(db, evento=EVENTO_2FA_EXITOSO, exito=True, id_usuario=usuario.IdUsuario, request=request, commit=False)
    db.commit()
    _set_cookies(response, access_token, refresh_plano, rol_nombre)
    return TokenOut(access_token=access_token, expires_in=_duracion_access_minutos(rol_nombre) * 60)

# ============================================================
# 2FA - SETUP (paso 1: generar secreto + QR)
# ============================================================
@router.post("/2fa/setup", response_model=Setup2FAOut)
@limiter.limit("5/minute")
async def setup_2fa(
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    if usuario.TotpHabilitado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El 2FA ya está activado en esta cuenta. Desactívalo primero si quieres regenerarlo.",
        )

    secreto = generar_secreto_totp()
    uri = uri_totp(secreto, usuario.Correo)

    # Generar el QR en memoria y convertirlo a Base64
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    usuario.TotpSecret = secreto
    usuario.TotpHabilitado = False
    db.commit()

    registrar_evento(
        db,
        evento="2FA_SETUP_INICIADO",
        exito=True,
        id_usuario=usuario.IdUsuario,
        request=request,
        commit=False,
    )

    return Setup2FAOut(secreto=secreto, qr_uri=uri, qr_base64=qr_base64)

# ============================================================
# 2FA - ENABLE (paso 2: confirmar código y activar)
# ============================================================
@router.post("/2fa/enable", response_model=Enable2FAOut)
@limiter.limit("5/minute")
async def enable_2fa(
    request: Request,
    body: Enable2FAIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """
    Activa 2FA si el usuario tiene un secreto pendiente y el código es válido.
    Devuelve 10 códigos de respaldo (solo se muestran UNA vez).
    """
    if usuario.TotpHabilitado:
        raise HTTPException(400, "El 2FA ya está activado.")
    if not usuario.TotpSecret:
        raise HTTPException(
            400,
            "No hay secreto pendiente. Primero llama a /api/auth/2fa/setup.",
        )

    # Verificar el código TOTP contra el secreto guardado
    if not verificar_codigo_totp(usuario.TotpSecret, body.codigo):
        registrar_evento(
            db, evento="2FA_SETUP_FALLIDO", exito=False,
            id_usuario=usuario.IdUsuario, request=request,
        )
        raise HTTPException(400, "Código incorrecto. Verifica la hora de tu dispositivo e inténtalo de nuevo.")

    # Generar 10 códigos de respaldo
    codigos_planos, codigos_hash = generar_codigos_respaldo(cantidad=10)

    # Invalidar códigos viejos (por si acaso)
    db.query(CodigoRespaldo).filter(CodigoRespaldo.IdUsuario == usuario.IdUsuario).delete()

    # Guardar los nuevos hasheados
    for ch in codigos_hash:
        db.add(CodigoRespaldo(IdUsuario=usuario.IdUsuario, CodigoHash=ch))

    # Activar 2FA
    usuario.TotpHabilitado = True
    db.commit()

    registrar_evento(
        db, evento="2FA_SETUP_EXITOSO", exito=True,
        id_usuario=usuario.IdUsuario, request=request, commit=False,
    )

    return Enable2FAOut(
        message="2FA activado correctamente. Guarda los códigos de respaldo en un lugar seguro — no se volverán a mostrar.",
        backup_codes=codigos_planos,
    )

# ============================================================
# 2FA - DISABLE (requiere password + código)
# ============================================================
@router.post("/2fa/disable")
@limiter.limit("5/minute")
async def disable_2fa(
    request: Request,
    body: Disable2FAIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """
    Desactiva 2FA. Requiere password actual + código TOTP (o backup code).
    """
    if not usuario.TotpHabilitado:
        raise HTTPException(400, "El 2FA no está activado.")
    if not usuario.TotpSecret:
        raise HTTPException(400, "Secreto 2FA no encontrado.")

    # 1. Verificar contraseña actual
    valido, _ = verify_and_update(body.contrasena, usuario.Contrasena)
    if not valido:
        raise HTTPException(401, "Contraseña incorrecta.")

    # 2. Verificar código (TOTP o backup code)
    codigo = body.codigo.strip()
    es_valido = verificar_codigo_totp(usuario.TotpSecret, codigo)

    if not es_valido:
        # Intentar como backup code
        codigos = (
            db.query(CodigoRespaldo)
            .filter(CodigoRespaldo.IdUsuario == usuario.IdUsuario, CodigoRespaldo.Usado == False)
            .all()
        )
        for cr in codigos:
            if verificar_codigo_respaldo(codigo, cr.CodigoHash):
                cr.Usado = True
                cr.UsadoEn = datetime.now(timezone.utc).replace(tzinfo=None)
                es_valido = True
                break

    if not es_valido:
        raise HTTPException(401, "Código incorrecto.")

    # 3. Desactivar 2FA y borrar secretos + códigos
    usuario.TotpHabilitado = False
    usuario.TotpSecret = None
    db.query(CodigoRespaldo).filter(CodigoRespaldo.IdUsuario == usuario.IdUsuario).delete()

    registrar_evento(
        db, evento="2FA_DESHABILITADO", exito=True,
        id_usuario=usuario.IdUsuario, request=request, commit=False,
    )
    db.commit()

    return {"message": "2FA desactivado correctamente."}

# ============================================================
# 2FA - REGENERAR CÓDIGOS DE RESPALDO (requiere código TOTP)
# ============================================================
@router.post("/2fa/regenerate-backup", response_model=RegenerateBackupOut)
@limiter.limit("3/minute")
async def regenerate_backup_codes(
    request: Request,
    body: Enable2FAIn,   # reutilizamos el schema: { codigo: 6 dígitos }
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """
    Regenera los códigos de respaldo. Requiere el 2FA activo y un código TOTP válido.
    Los códigos viejos se invalidan.
    """
    if not usuario.TotpHabilitado or not usuario.TotpSecret:
        raise HTTPException(400, "El 2FA no está activado.")

    if not verificar_codigo_totp(usuario.TotpSecret, body.codigo):
        raise HTTPException(401, "Código incorrecto.")

    # Borrar viejos
    db.query(CodigoRespaldo).filter(CodigoRespaldo.IdUsuario == usuario.IdUsuario).delete()

    # Generar nuevos
    codigos_planos, codigos_hash = generar_codigos_respaldo(cantidad=10)
    for ch in codigos_hash:
        db.add(CodigoRespaldo(IdUsuario=usuario.IdUsuario, CodigoHash=ch))

    registrar_evento(
        db, evento="2FA_BACKUP_REGENERADOS", exito=True,
        id_usuario=usuario.IdUsuario, request=request, commit=False,
    )
    db.commit()

    return RegenerateBackupOut(
        message="Nuevos códigos de respaldo generados. Los anteriores ya no funcionan.",
        backup_codes=codigos_planos,
    )

# ============================================================
# CAMBIAR CONTRASEÑA (Para usuarios logueados)
# ============================================================
@router.put("/cambiar-contrasena")
async def cambiar_contrasena(
    request: Request,
    body: dict,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user), # ⬅️ SEGURIDAD: Identifica al usuario por su sesión
):
    contrasena_actual = body.get("contrasenaActual")
    contrasena_nueva = body.get("contrasenaNueva")

    if not contrasena_actual or not contrasena_nueva:
        raise HTTPException(400, "Faltan datos obligatorios.")

    if not verify_password(contrasena_actual, usuario.Contrasena):
        raise HTTPException(400, "La contraseña actual es incorrecta.")

    if len(contrasena_nueva) < 8:
        raise HTTPException(400, "La nueva contraseña debe tener al menos 8 caracteres.")

    if contrasena_actual == contrasena_nueva:
        raise HTTPException(400, "La nueva contraseña debe ser diferente a la actual.")

    usuario.Contrasena = hash_password(contrasena_nueva)
    
    # Por seguridad, cerramos todas las sesiones activas
    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    db.query(RefreshToken).filter(RefreshToken.IdUsuario == usuario.IdUsuario).update({"Revocado": True, "RevocadoEn": ahora})
    
    db.commit()
    return {"message": "Contraseña actualizada correctamente. Por favor, vuelve a iniciar sesión."}

# ============================================================
# OLVIDÉ MI CONTRASEÑA
# ============================================================
@router.post("/olvide-password")
@limiter.limit("3/minute")
async def olvide_password(
    request: Request,
    background_tasks: BackgroundTasks, 
    body: OlvidePasswordIn,
    db: Session = Depends(get_db),
):
    """
    Siempre devuelve 200 con mensaje genérico para no filtrar
    si el correo existe o no (anti-enumeración).
    """
    usuario = db.query(Usuario).filter(Usuario.Correo == body.correo).first()
    mensaje = {"message": "Si el correo está registrado, recibirás un enlace en breve."}

    if not usuario:
        # Registrar el intento (auditoría) y salir
        registrar_evento(
            db, evento="PASSWORD_RESET_SOLICITADO", exito=False,
            correo_intentado=body.correo, request=request,
            detalles="Correo no registrado",
        )
        return mensaje

    # Invalidar tokens previos no usados
    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.IdUsuario == usuario.IdUsuario,
        PasswordResetToken.Usado == False,  # noqa: E712
    ).update({"Usado": True, "UsadoEn": ahora})

    # Crear nuevo token
    token_plano = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token_plano.encode("utf-8")).hexdigest()

    nuevo_token = PasswordResetToken(
        IdUsuario=usuario.IdUsuario,
        TokenHash=token_hash,
        ExpiraEn=(datetime.now(timezone.utc) + timedelta(minutes=15)).replace(tzinfo=None),
        IP=request.client.host if request.client else None,
        FechaCreacion=ahora,
    )
    db.add(nuevo_token)

    registrar_evento(
        db, evento="PASSWORD_RESET_SOLICITADO", exito=True,
        id_usuario=usuario.IdUsuario, correo_intentado=body.correo,
        request=request, commit=False,
    )
    db.commit()

    # Email best-effort
    enlace = f"{FRONTEND_URL}/restablecer-password?token={token_plano}"
    background_tasks.add_task(enviar_correo_recuperacion, usuario.Correo, enlace)

    return mensaje


# ============================================================
# RESTABLECER CONTRASEÑA
# ============================================================
@router.post("/restablecer-password")
@limiter.limit("5/minute")
async def restablecer_password(
    request: Request,
    body: RestablecerPasswordIn,
    db: Session = Depends(get_db),
):
    token_hash = hashlib.sha256(body.token.encode("utf-8")).hexdigest()

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.TokenHash == token_hash,
        PasswordResetToken.Usado == False,  # noqa: E712
    ).first()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enlace inválido o ya usado. Solicita uno nuevo.",
        )

    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    if reset_token.ExpiraEn < ahora:
        reset_token.Usado = True
        reset_token.UsadoEn = ahora
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace expiró. Solicita uno nuevo.",
        )

    usuario = db.query(Usuario).filter(Usuario.IdUsuario == reset_token.IdUsuario).first()
    if not usuario:
        raise HTTPException(status_code=400, detail="Usuario no encontrado.")

    # Actualizar contraseña y resetear bloqueos
    usuario.Contrasena = hash_password(body.contrasena)
    usuario.IntentosFallidos = 0
    usuario.BloqueadoHasta = None

    # Marcar token usado
    reset_token.Usado = True
    reset_token.UsadoEn = ahora

    # Seguridad: cerrar TODAS las sesiones activas
    db.query(RefreshToken).filter(
        RefreshToken.IdUsuario == usuario.IdUsuario,
        RefreshToken.Revocado == False,  # noqa: E712
    ).update({"Revocado": True, "RevocadoEn": ahora})

    registrar_evento(
        db, evento="PASSWORD_RESET_COMPLETADO", exito=True,
        id_usuario=usuario.IdUsuario, request=request, commit=False,
    )
    db.commit()

    return {"message": "Contraseña actualizada. Ya puedes iniciar sesión."}


# ============================================================
# VERIFICAR CORREO
# ============================================================
@router.post("/verificar-correo")
async def verificar_correo(
    request: Request,
    body: dict,
    db: Session = Depends(get_db),
):
    token_plano = body.get("token", "").strip()
    if not token_plano:
        raise HTTPException(status_code=400, detail="Token requerido.")

    token_hash = hashlib.sha256(token_plano.encode("utf-8")).hexdigest()

    evt = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.TokenHash == token_hash,
        EmailVerificationToken.Usado == False,  # noqa: E712
    ).first()

    if not evt:
        raise HTTPException(status_code=400, detail="Enlace inválido o ya usado.")

    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    if evt.ExpiraEn < ahora:
        evt.Usado = True
        db.commit()
        raise HTTPException(status_code=400, detail="El enlace expiró.")

    usuario = db.query(Usuario).filter(Usuario.IdUsuario == evt.IdUsuario).first()
    if not usuario:
        raise HTTPException(status_code=400, detail="Usuario no encontrado.")

    usuario.EmailVerificado = True
    evt.Usado = True

    registrar_evento(
        db, evento="EMAIL_VERIFICADO", exito=True,
        id_usuario=usuario.IdUsuario, request=request, commit=False,
    )
    db.commit()

    return {"message": "¡Correo verificado! Ya puedes usar todas las funciones."}


# ============================================================
# REENVIAR VERIFICACIÓN
# ============================================================
@router.post("/reenviar-verificacion")
@limiter.limit("3/minute")
async def reenviar_verificacion(
    request: Request,
    background_tasks: BackgroundTasks, 
    body: dict,
    db: Session = Depends(get_db),
):
    correo = body.get("correo", "").strip()
    mensaje = {"message": "Si el correo existe y no está verificado, recibirás un enlace."}

    if not correo:
        return mensaje

    usuario = db.query(Usuario).filter(Usuario.Correo == correo).first()
    if not usuario or usuario.EmailVerificado:
        return mensaje

    # Invalidar tokens previos
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.IdUsuario == usuario.IdUsuario,
        EmailVerificationToken.Usado == False,  # noqa: E712
    ).update({"Usado": True})

    # Nuevo token
    token_plano = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token_plano.encode("utf-8")).hexdigest()

    nuevo_token = EmailVerificationToken(
        IdUsuario=usuario.IdUsuario,
        TokenHash=token_hash,
        ExpiraEn=(datetime.now(timezone.utc) + timedelta(hours=24)).replace(tzinfo=None),
        FechaCreacion=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db.add(nuevo_token)
    db.commit()

    enlace = f"{FRONTEND_URL}/verificar-correo?token={token_plano}"
    background_tasks.add_task(enviar_correo_verificacion, usuario.Correo, enlace)

    return mensaje