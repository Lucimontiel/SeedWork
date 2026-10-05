"""
audit.py - Registro de eventos de seguridad en la BD.

Uso típico dentro de un endpoint:

    from audit import registrar_evento

    registrar_evento(
        db,
        evento="LOGIN_EXITOSO",
        exito=True,
        id_usuario=usuario.IdUsuario,
        correo_intentado=body.correo,
        request=request,
    )
"""
from typing import Optional
from fastapi import Request
from sqlalchemy.orm import Session

from models import AuditLog


# Eventos estándar (para no escribirlos mal en cada lugar)
EVENTO_LOGIN_EXITOSO       = "LOGIN_EXITOSO"
EVENTO_LOGIN_FALLIDO       = "LOGIN_FALLIDO"
EVENTO_LOGIN_BLOQUEADO     = "LOGIN_BLOQUEADO"
EVENTO_CUENTA_BLOQUEADA    = "CUENTA_BLOQUEADA"
EVENTO_LOGOUT              = "LOGOUT"
EVENTO_REFRESH             = "REFRESH_TOKEN"
EVENTO_REFRESH_REUSO       = "REFRESH_REUSO_DETECTADO"
EVENTO_2FA_REQUERIDO       = "2FA_REQUERIDO"
EVENTO_2FA_EXITOSO         = "2FA_EXITOSO"
EVENTO_2FA_FALLIDO         = "2FA_FALLIDO"
EVENTO_2FA_SETUP           = "2FA_SETUP"
EVENTO_REGISTRO            = "REGISTRO"
EVENTO_PASSWORD_CAMBIADA   = "PASSWORD_CAMBIADA"
EVENTO_ACCESO_DENEGADO     = "ACCESO_DENEGADO"


def _ip_de_request(request: Optional[Request]) -> Optional[str]:
    """Extrae la IP del cliente, considerando proxies reversos."""
    if not request:
        return None
    # X-Forwarded-For: la primera IP es la del cliente real si hay proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    # Si no, la IP directa
    if request.client:
        return request.client.host
    return None


def _user_agent_de_request(request: Optional[Request]) -> Optional[str]:
    if not request:
        return None
    ua = request.headers.get("user-agent")
    return ua[:255] if ua else None


def registrar_evento(
    db: Session,
    evento: str,
    exito: bool,
    *,
    id_usuario: Optional[int] = None,
    correo_intentado: Optional[str] = None,
    request: Optional[Request] = None,
    detalles: Optional[str] = None,
    commit: bool = True,
) -> None:
    """
    Registra un evento de seguridad en la tabla AuditLog.

    Args:
        db: sesión de SQLAlchemy.
        evento: constante EVENTO_*.
        exito: True si la acción tuvo éxito.
        id_usuario: id del usuario involucrado (None si no se conoce).
        correo_intentado: correo que se intentó usar (útil cuando el usuario no existe).
        request: request de FastAPI (para IP y user-agent).
        detalles: texto libre para contexto extra.
        commit: si True, hace commit inmediato. Si estás dentro de una
                transacción más grande, pásale False.
    """
    log = AuditLog(
        IdUsuario=id_usuario,
        CorreoIntentado=correo_intentado,
        Evento=evento,
        Exito=exito,
        IP=_ip_de_request(request),
        UserAgent=_user_agent_de_request(request),
        Detalles=detalles,
    )
    db.add(log)
    if commit:
        try:
            db.commit()
        except Exception:
            db.rollback()