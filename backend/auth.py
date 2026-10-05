"""
auth.py - Endpoints de autenticación con JWT + refresh tokens + 2FA.

Rutas (todas bajo /api/auth):

  POST  /login                 → login candidato/empresa, devuelve tokens
  POST  /refresh               → renueva access token usando refresh cookie
  POST  /logout                → cierra sesión e invalida refresh token
  GET   /me                    → devuelve el usuario autenticado actual
  POST  /admin/login           → login admin (paso 1: correo + contraseña)
  POST  /admin/login/2fa       → login admin (paso 2: código TOTP)

Este router NO está registrado en main.py todavía.
Se registra en el Bloque 4.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Usuario, Candidato, Empresa, Administrador,
    RefreshToken, CodigoRespaldo, EstadoUsuario, Rol,
)
from schemas import (
    LoginTokenIn, AdminLoginIn, AdminLogin2FAIn,
    TokenOut, MeOut, Setup2FAOut,
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

# ============================================================
# CONFIGURACIÓN DE COOKIES
# ============================================================
COOKIE_REFRESH_TOKEN = "sw_refresh_token"

ENV = os.getenv("ENV", "dev").lower()
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", "") or None
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()

# Bloqueo por intentos fallidos
MAX_INTENTOS_FALLIDOS = int(os.getenv("MAX_INTENTOS_FALLIDOS", "5"))
BLOQUEO_MINUTOS = int(os.getenv("BLOQUEO_MINUTOS", "15"))

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ============================================================
# HELPERS
# ============================================================

def _set_cookies(response: Response, access_token: str, refresh_token: str, rol: str):
    """Setea las cookies httpOnly de access y refresh."""
    # Access token: cookie de sesión (expira cuando el navegador cierra)
    # También lo mandamos en el body para clientes móviles.
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

    # Refresh token: cookie de larga duración
    expira = duracion_refresh(rol)
    response.set_cookie(
        key=COOKIE_REFRESH_TOKEN,
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        max_age=int(expira.total_seconds()),
        path="/api/auth",  # Solo se envía a los endpoints de auth
    )


def _clear_cookies(response: Response):
    """Limpia las cookies de sesión."""
    response.delete_cookie(COOKIE_ACCESS_TOKEN, path="/")
    response.delete_cookie(COOKIE_REFRESH_TOKEN, path="/api/auth")


def _guardar_refresh_token(
    db: Session,
    id_usuario: int,
    token_plano: str,
    expira: timedelta,
    request: Request,
) -> RefreshToken:
    """Guarda el refresh token hasheado en la BD."""
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
    """Normaliza el nombre del rol para el frontend."""
    r = rol_nombre.lower()
    if r == "administrador":
        return "administrador"
    if r == "empresa":
        return "empresa"
    return "candidato"


def _construir_me_out(usuario: Usuario) -> MeOut:
    """Arma la respuesta /me con los datos del usuario."""
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
async def login(
    request: Request,
    response: Response,
    body: LoginTokenIn,
    db: Session = Depends(get_db),
):
    """
    Login de candidato o empresa.

    - Rate limited.
    - Bloqueo temporal tras N intentos fallidos.
    - Rehash automático bcrypt → argon2.
    - Setea cookies httpOnly y devuelve el access token en el body.
    """
    usuario = db.query(Usuario).filter(Usuario.Correo == body.correo).first()

    # Verificar bloqueo temporal
    if usuario and usuario.BloqueadoHasta:
        ahora = datetime.now(timezone.utc).replace(tzinfo=None)
        if usuario.BloqueadoHasta > ahora:
            restante = int((usuario.BloqueadoHasta - ahora).total_seconds() / 60) + 1
            registrar_evento(
                db,
                evento=EVENTO_LOGIN_BLOQUEADO,
                exito=False,
                id_usuario=usuario.IdUsuario,
                correo_intentado=body.correo,
                request=request,
                detalles=f"Bloqueado por {restante} minutos más",
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Cuenta bloqueada temporalmente. Intenta en {restante} minutos.",
            )

    # Verificar credenciales
    valido = False
    nuevo_hash = None
    if usuario:
        valido, nuevo_hash = verify_and_update(body.contrasena, usuario.Contrasena)

    if not usuario or not valido:
        # Credenciales inválidas
        if usuario:
            # Incrementar contador
            usuario.IntentosFallidos = (usuario.IntentosFallidos or 0) + 1
            if usuario.IntentosFallidos >= MAX_INTENTOS_FALLIDOS:
                usuario.BloqueadoHasta = (
                    datetime.now(timezone.utc) + timedelta(minutes=BLOQUEO_MINUTOS)
                ).replace(tzinfo=None)
                registrar_evento(
                    db,
                    evento=EVENTO_CUENTA_BLOQUEADA,
                    exito=False,
                    id_usuario=usuario.IdUsuario,
                    correo_intentado=body.correo,
                    request=request,
                    detalles=f"Bloqueado por {BLOQUEO_MINUTOS} min tras {usuario.IntentosFallidos} intentos",
                )
            db.commit()

        registrar_evento(
            db,
            evento=EVENTO_LOGIN_FALLIDO,
            exito=False,
            id_usuario=usuario.IdUsuario if usuario else None,
            correo_intentado=body.correo,
            request=request,
            detalles=f"tipo={body.tipo}",
        )
        # Respuesta genérica (no revelar si existe)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )

    # Login exitoso
    # Resetear contadores
    usuario.IntentosFallidos = 0
    usuario.BloqueadoHasta = None

    # Rehash si el hash era legacy (bcrypt)
    if nuevo_hash:
        usuario.Contrasena = nuevo_hash

    usuario.UltimoLogin = datetime.now(timezone.utc).replace(tzinfo=None)
    if request.client:
        usuario.UltimoLoginIP = request.client.host

    # Verificar que el tipo coincida con el rol
    rol_nombre = usuario.rol.Nombre if usuario.rol else ""
    tipo_esperado = _tipo_de_rol(rol_nombre)
    if tipo_esperado != body.tipo:
        # Credenciales válidas pero de otro tipo
        db.commit()
        registrar_evento(
            db,
            evento=EVENTO_LOGIN_FALLIDO,
            exito=False,
            id_usuario=usuario.IdUsuario,
            correo_intentado=body.correo,
            request=request,
            detalles=f"Tipo solicitado={body.tipo}, tipo real={tipo_esperado}",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Esta cuenta no es de tipo {body.tipo}.",
        )

    # Verificar estado activo
    if usuario.estado and usuario.estado.Nombre != "Activo":
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cuenta {usuario.estado.Nombre.lower()}. Contacta a soporte.",
        )

    # Generar tokens
    access_token = crear_access_token(usuario.IdUsuario, rol_nombre)
    refresh_token_plano = generar_refresh_token()
    expira_refresh = duracion_refresh(rol_nombre)

    _guardar_refresh_token(db, usuario.IdUsuario, refresh_token_plano, expira_refresh, request)

    registrar_evento(
        db,
        evento=EVENTO_LOGIN_EXITOSO,
        exito=True,
        id_usuario=usuario.IdUsuario,
        correo_intentado=body.correo,
        request=request,
        detalles=f"tipo={body.tipo}",
        commit=False,
    )

    db.commit()

    _set_cookies(response, access_token, refresh_token_plano, rol_nombre)

    return TokenOut(
        access_token=access_token,
        expires_in=_duracion_access_minutos(rol_nombre) * 60,
    )


# ============================================================
# REFRESH
# ============================================================
@router.post("/refresh", response_model=TokenOut)
@limiter.limit(LIMIT_REFRESH)
async def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Renueva el access token usando el refresh token de la cookie.

    Rotación: el refresh token usado se revoca y se emite uno nuevo.
    Si se detecta reuso de un token ya usado, se revocan TODOS
    los refresh tokens del usuario (cierre de sesión global).
    """
    token_plano = request.cookies.get(COOKIE_REFRESH_TOKEN)
    if not token_plano:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No hay refresh token.",
        )

    token_hash = hashear_refresh_token(token_plano)
    rt = db.query(RefreshToken).filter(RefreshToken.TokenHash == token_hash).first()

    if not rt:
        _clear_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido.",
        )

    # Detectar reuso
    if rt.Revocado:
        # ¡Alerta! Alguien usó un token ya revocado.
        # Revocamos TODOS los tokens del usuario.
        db.query(RefreshToken).filter(
            RefreshToken.IdUsuario == rt.IdUsuario,
            RefreshToken.Revocado == False,  # noqa: E712
        ).update({"Revocado": True, "RevocadoEn": datetime.now(timezone.utc).replace(tzinfo=None)})

        registrar_evento(
            db,
            evento=EVENTO_REFRESH_REUSO,
            exito=False,
            id_usuario=rt.IdUsuario,
            request=request,
            detalles=f"RefreshToken Id={rt.IdRefreshToken} reusado",
        )
        db.commit()
        _clear_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión comprometida. Vuelve a iniciar sesión.",
        )

    # Verificar expiración
    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    if rt.ExpiraEn < ahora:
        rt.Revocado = True
        rt.RevocadoEn = ahora
        db.commit()
        _clear_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expirado.",
        )

    # Cargar usuario
    usuario = db.query(Usuario).filter(Usuario.IdUsuario == rt.IdUsuario).first()
    if not usuario:
        _clear_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
        )

    if usuario.estado and usuario.estado.Nombre != "Activo":
        _clear_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cuenta {usuario.estado.Nombre.lower()}.",
        )

    rol_nombre = usuario.rol.Nombre if usuario.rol else ""

    # Rotación: revocar el viejo y emitir uno nuevo
    rt.Revocado = True
    rt.RevocadoEn = ahora

    nuevo_refresh_plano = generar_refresh_token()
    nuevo_rt = _guardar_refresh_token(
        db,
        usuario.IdUsuario,
        nuevo_refresh_plano,
        duracion_refresh(rol_nombre),
        request,
    )
    rt.ReemplazadoPor = nuevo_rt.IdRefreshToken

    nuevo_access = crear_access_token(usuario.IdUsuario, rol_nombre)

    registrar_evento(
        db,
        evento=EVENTO_REFRESH,
        exito=True,
        id_usuario=usuario.IdUsuario,
        request=request,
        commit=False,
    )

    db.commit()

    _set_cookies(response, nuevo_access, nuevo_refresh_plano, rol_nombre)

    return TokenOut(
        access_token=nuevo_access,
        expires_in=_duracion_access_minutos(rol_nombre) * 60,
    )


# ============================================================
# LOGOUT
# ============================================================
@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Cierra la sesión: revoca el refresh token y limpia cookies."""
    token_plano = request.cookies.get(COOKIE_REFRESH_TOKEN)
    if token_plano:
        token_hash = hashear_refresh_token(token_plano)
        rt = db.query(RefreshToken).filter(RefreshToken.TokenHash == token_hash).first()
        if rt and not rt.Revocado:
            rt.Revocado = True
            rt.RevocadoEn = datetime.now(timezone.utc).replace(tzinfo=None)

            registrar_evento(
                db,
                evento=EVENTO_LOGOUT,
                exito=True,
                id_usuario=rt.IdUsuario,
                request=request,
                commit=False,
            )
            db.commit()

    _clear_cookies(response)
    return {"message": "Sesión cerrada."}


# ============================================================
# ME
# ============================================================
@router.get("/me", response_model=MeOut)
async def me(usuario: Usuario = Depends(get_current_user)):
    """Devuelve los datos del usuario autenticado."""
    return _construir_me_out(usuario)


# ============================================================
# ADMIN LOGIN (paso 1: correo + contraseña)
# ============================================================
@router.post("/admin/login")
@limiter.limit(LIMIT_LOGIN)
async def admin_login(
    request: Request,
    response: Response,
    body: AdminLoginIn,
    db: Session = Depends(get_db),
):
    """
    Login de administrador (paso 1).

    Si las credenciales son válidas y el 2FA está activo,
    responde {"2fa_required": true} y espera el código.
    Si el 2FA NO está habilitado (no debería pasar en admin real),
    hace login directo igual que candidato/empresa.

    ⚠️ La respuesta es GENÉRICA para no revelar si un correo
    corresponde a un admin o no.
    """
    usuario = db.query(Usuario).filter(Usuario.Correo == body.correo).first()

    # Verificar bloqueo
    if usuario and usuario.BloqueadoHasta:
        ahora = datetime.now(timezone.utc).replace(tzinfo=None)
        if usuario.BloqueadoHasta > ahora:
            registrar_evento(
                db,
                evento=EVENTO_LOGIN_BLOQUEADO,
                exito=False,
                id_usuario=usuario.IdUsuario,
                correo_intentado=body.correo,
                request=request,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Credenciales incorrectas.",
            )

    # Validar credenciales
    valido = False
    if usuario:
        valido, _ = verify_and_update(body.contrasena, usuario.Contrasena)

    if not usuario or not valido:
        if usuario:
            usuario.IntentosFallidos = (usuario.IntentosFallidos or 0) + 1
            if usuario.IntentosFallidos >= MAX_INTENTOS_FALLIDOS:
                usuario.BloqueadoHasta = (
                    datetime.now(timezone.utc) + timedelta(minutes=BLOQUEO_MINUTOS)
                ).replace(tzinfo=None)
            db.commit()

        registrar_evento(
            db,
            evento=EVENTO_LOGIN_FALLIDO,
            exito=False,
            id_usuario=usuario.IdUsuario if usuario else None,
            correo_intentado=body.correo,
            request=request,
            detalles="admin_login paso 1",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
        )

    # Verificar que sea admin
    rol_nombre = usuario.rol.Nombre if usuario.rol else ""
    if rol_nombre.lower() != "administrador":
        # ⚠️ Respondemos lo mismo que credenciales incorrectas
        # para no revelar que el correo existe pero no es admin.
        registrar_evento(
            db,
            evento=EVENTO_LOGIN_FALLIDO,
            exito=False,
            id_usuario=usuario.IdUsuario,
            correo_intentado=body.correo,
            request=request,
            detalles="Intento de login admin con cuenta no-admin",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
        )

    # Reset contadores
    usuario.IntentosFallidos = 0
    usuario.BloqueadoHasta = None
    db.commit()

    # ¿Tiene 2FA?
    if usuario.TotpHabilitado and usuario.TotpSecret:
        registrar_evento(
            db,
            evento=EVENTO_2FA_REQUERIDO,
            exito=True,
            id_usuario=usuario.IdUsuario,
            correo_intentado=body.correo,
            request=request,
        )
        return {
            "2fa_required": True,
            "message": "Ingresa el código de tu app de autenticación.",
        }

    # Sin 2FA → login directo (no debería pasar con admin real)
    access_token = crear_access_token(usuario.IdUsuario, rol_nombre)
    refresh_plano = generar_refresh_token()
    _guardar_refresh_token(db, usuario.IdUsuario, refresh_plano, duracion_refresh(rol_nombre), request)

    usuario.UltimoLogin = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()

    _set_cookies(response, access_token, refresh_plano, rol_nombre)
    return TokenOut(
        access_token=access_token,
        expires_in=_duracion_access_minutos(rol_nombre) * 60,
    )


# ============================================================
# ADMIN LOGIN (paso 2: código TOTP)
# ============================================================
@router.post("/admin/login/2fa", response_model=TokenOut)
@limiter.limit(LIMIT_2FA)
async def admin_login_2fa(
    request: Request,
    response: Response,
    body: AdminLogin2FAIn,
    db: Session = Depends(get_db),
):
    """
    Login de administrador (paso 2): valida el código TOTP.
    Solo se llama después de que /admin/login devolvió 2fa_required=true.
    """
    usuario = db.query(Usuario).filter(Usuario.Correo == body.correo).first()
    if not usuario or not usuario.TotpHabilitado or not usuario.TotpSecret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
        )

    rol_nombre = usuario.rol.Nombre if usuario.rol else ""
    if rol_nombre.lower() != "administrador":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
        )

    codigo = body.codigo.strip()

    # 1. Intentar como código TOTP
    valido = verificar_codigo_totp(usuario.TotpSecret, codigo)

    # 2. Si no, intentar como código de respaldo
    if not valido:
        codigos = db.query(CodigoRespaldo).filter(
            CodigoRespaldo.IdUsuario == usuario.IdUsuario,
            CodigoRespaldo.Usado == False,  # noqa: E712
        ).all()

        for cr in codigos:
            if verificar_codigo_respaldo(codigo, cr.CodigoHash):
                cr.Usado = True
                cr.UsadoEn = datetime.now(timezone.utc).replace(tzinfo=None)
                valido = True
                break

    if not valido:
        registrar_evento(
            db,
            evento=EVENTO_2FA_FALLIDO,
            exito=False,
            id_usuario=usuario.IdUsuario,
            correo_intentado=body.correo,
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Código inválido.",
        )

    # Éxito
    access_token = crear_access_token(usuario.IdUsuario, rol_nombre)
    refresh_plano = generar_refresh_token()
    _guardar_refresh_token(db, usuario.IdUsuario, refresh_plano, duracion_refresh(rol_nombre), request)

    usuario.UltimoLogin = datetime.now(timezone.utc).replace(tzinfo=None)
    usuario.IntentosFallidos = 0

    registrar_evento(
        db,
        evento=EVENTO_2FA_EXITOSO,
        exito=True,
        id_usuario=usuario.IdUsuario,
        correo_intentado=body.correo,
        request=request,
        commit=False,
    )

    db.commit()

    _set_cookies(response, access_token, refresh_plano, rol_nombre)
    return TokenOut(
        access_token=access_token,
        expires_in=_duracion_access_minutos(rol_nombre) * 60,
    )