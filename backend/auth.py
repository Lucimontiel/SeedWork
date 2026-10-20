"""
auth.py - Endpoints de autenticación con JWT + refresh tokens + 2FA.
"""
import os
import secrets
import hashlib

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from jose import JWTError

from database import get_db
from models import (
    Usuario, Candidato, Empresa, Administrador,
    RefreshToken, CodigoRespaldo, EstadoUsuario, Rol,
    PasswordResetToken, EmailVerificationToken, # ⬅️ Añadido EmailVerificationToken
)
from schemas import (
    LoginTokenIn, AdminLoginIn, AdminLogin2FAIn,
    AdminLoginChallengeOut,
    TokenOut, MeOut, Setup2FAOut, OlvidePasswordIn, RestablecerPasswordIn,
)
from security import (
    verify_and_update,
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
    crear_challenge_token,
    decodificar_challenge_token,
    hash_password,
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

from email_service import enviar_correo_recuperacion

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
    )

# ============================================================
# LOGIN (candidato / empresa)
# ============================================================
@router.post("/login", response_model=TokenOut)
@limiter.limit(LIMIT_LOGIN)
async def login(request: Request, response: Response, body: LoginTokenIn, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.Correo == body.correo).first()

    if usuario and usuario.BloqueadoHasta:
        ahora = datetime.now(timezone.utc).replace(tzinfo=None)
        if usuario.BloqueadoHasta > ahora:
            restante = int((usuario.BloqueadoHasta - ahora).total_seconds() / 60) + 1
            registrar_evento(db, evento=EVENTO_LOGIN_BLOQUEADO, exito=False, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles=f"Bloqueado por {restante} minutos más")
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=f"Cuenta bloqueada temporalmente. Intenta en {restante} minutos.")

    valido = False
    nuevo_hash = None
    if usuario:
        valido, nuevo_hash = verify_and_update(body.contrasena, usuario.Contrasena)

    if not usuario or not valido:
        if usuario:
            usuario.IntentosFallidos = (usuario.IntentosFallidos or 0) + 1
            if usuario.IntentosFallidos >= MAX_INTENTOS_FALLIDOS:
                usuario.BloqueadoHasta = (datetime.now(timezone.utc) + timedelta(minutes=BLOQUEO_MINUTOS)).replace(tzinfo=None)
                registrar_evento(db, evento=EVENTO_CUENTA_BLOQUEADA, exito=False, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles=f"Bloqueado por {BLOQUEO_MINUTOS} min tras {usuario.IntentosFallidos} intentos")
            db.commit()
        registrar_evento(db, evento=EVENTO_LOGIN_FALLIDO, exito=False, id_usuario=usuario.IdUsuario if usuario else None, correo_intentado=body.correo, request=request, detalles=f"tipo={body.tipo}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña incorrectos.")

    # ⬅️ NUEVO: Validar que el correo esté verificado
    if not usuario.EmailVerificado:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada."
        )

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

    access_token = crear_access_token(usuario.IdUsuario, rol_nombre)
    refresh_token_plano = generar_refresh_token()
    expira_refresh = duracion_refresh(rol_nombre)
    _guardar_refresh_token(db, usuario.IdUsuario, refresh_token_plano, expira_refresh, request)

    registrar_evento(db, evento=EVENTO_LOGIN_EXITOSO, exito=True, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles=f"tipo={body.tipo}", commit=False)
    db.commit()
    _set_cookies(response, access_token, refresh_token_plano, rol_nombre)
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
    usuario = db.query(Usuario).filter(Usuario.Correo == body.correo).first()

    if usuario and usuario.BloqueadoHasta:
        ahora = datetime.now(timezone.utc).replace(tzinfo=None)
        if usuario.BloqueadoHasta > ahora:
            registrar_evento(db, evento=EVENTO_LOGIN_BLOQUEADO, exito=False, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request)
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Credenciales incorrectas.")

    valido = False
    if usuario:
        valido, _ = verify_and_update(body.contrasena, usuario.Contrasena)

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

    usuario = db.query(Usuario).filter(Usuario.IdUsuario == id_usuario).first()
    if not usuario or not usuario.TotpHabilitado or not usuario.TotpSecret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas.")

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
# RECUPERACIÓN DE CONTRASEÑA
# ============================================================
@router.post("/olvide-password")
@limiter.limit("3/minute")
async def olvide_password(request: Request, body: OlvidePasswordIn, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.Correo == body.correo).first()
    
    mensaje_generico = {"message": "Si el correo está registrado, recibirás un enlace de recuperación."}
    
    if not usuario:
        return mensaje_generico

    db.query(PasswordResetToken).filter(
        PasswordResetToken.IdUsuario == usuario.IdUsuario,
        PasswordResetToken.Usado == False
    ).update({"Usado": True, "UsadoEn": datetime.now(timezone.utc).replace(tzinfo=None)})

    token_plano = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token_plano.encode("utf-8")).hexdigest()
    expira_en = datetime.now(timezone.utc) + timedelta(minutes=15)

    nuevo_token = PasswordResetToken(
        IdUsuario=usuario.IdUsuario,
        TokenHash=token_hash,
        ExpiraEn=expira_en.replace(tzinfo=None),
        IP=request.client.host if request.client else None,
        FechaCreacion=datetime.now(timezone.utc).replace(tzinfo=None)
    )
    db.add(nuevo_token)
    
    registrar_evento(db, evento="PASSWORD_RESET_SOLICITADO", exito=True, id_usuario=usuario.IdUsuario, request=request, commit=False)
    db.commit()

    enlace = f"http://localhost:3000/restablecer-password?token={token_plano}"
    enviar_correo_recuperacion(usuario.Correo, enlace)

    return mensaje_generico


@router.post("/restablecer-password")
@limiter.limit("5/minute")
async def restablecer_password(request: Request, body: RestablecerPasswordIn, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(body.token.encode("utf-8")).hexdigest()
    reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.TokenHash == token_hash).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="El enlace es inválido o ya fue utilizado.")
    
    if reset_token.Usado:
        raise HTTPException(status_code=400, detail="Este enlace ya fue utilizado. Solicita uno nuevo.")

    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    if reset_token.ExpiraEn < ahora:
        raise HTTPException(status_code=400, detail="El enlace ha expirado. Por favor, solicita uno nuevo.")

    usuario = db.query(Usuario).filter(Usuario.IdUsuario == reset_token.IdUsuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    usuario.Contrasena = hash_password(body.contrasena)
    usuario.IntentosFallidos = 0
    usuario.BloqueadoHasta = None
    
    reset_token.Usado = True
    reset_token.UsadoEn = ahora

    db.query(RefreshToken).filter(RefreshToken.IdUsuario == usuario.IdUsuario).update({"Revocado": True, "RevocadoEn": ahora})

    registrar_evento(db, evento="PASSWORD_CAMBIADA", exito=True, id_usuario=usuario.IdUsuario, request=request, commit=False)
    db.commit()

    return {"message": "Contraseña actualizada correctamente. Ya puedes iniciar sesión."}

# ============================================================
# NUEVO: VERIFICACIÓN DE CORREO
# ============================================================
"""@router.get("/verificar-correo")
async def verificar_correo(token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    v_token = db.query(EmailVerificationToken).filter(EmailVerificationToken.TokenHash == token_hash).first()

    if not v_token:
        raise HTTPException(status_code=400, detail="El enlace es inválido.")
    
    if v_token.Usado:
        raise HTTPException(status_code=400, detail="Este enlace ya fue utilizado.")

    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    if v_token.ExpiraEn < ahora:
        raise HTTPException(status_code=400, detail="El enlace ha expirado. Por favor, regístrate de nuevo.")

    usuario = db.query(Usuario).filter(Usuario.IdUsuario == v_token.IdUsuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    usuario.EmailVerificado = True
    v_token.Usado = True
    
    db.commit()
    return {"message": "Correo verificado exitosamente."}"""