"""
dependencies.py - Dependencias de FastAPI para autenticación y autorización.

Provee:
  - get_current_user: lee el access token de la cookie httpOnly,
    lo valida, y devuelve el usuario de la BD.
  - require_role: factory para exigir un rol específico.
  - get_current_candidato / get_current_empresa / get_current_admin:
    atajos que además devuelven la entidad relacionada.

Uso en un endpoint:

    from dependencies import get_current_user, require_role
    from models import Usuario

    @app.get("/api/perfil")
    def mi_perfil(user: Usuario = Depends(get_current_user)):
        return {"correo": user.Correo}

    @app.get("/api/admin/vacantes")
    def admin_vacantes(user: Usuario = Depends(require_role("Administrador"))):
        ...
"""
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario, Candidato, Empresa, Administrador
from security import decodificar_access_token


# Nombre de la cookie donde vive el access token
COOKIE_ACCESS_TOKEN = "sw_access_token"


def _extraer_access_token(request: Request) -> Optional[str]:
    """
    Extrae el access token de:
      1. Cookie httpOnly (modo normal del frontend).
      2. Header Authorization: Bearer <token> (útil para testing y clientes móviles).
    """
    # 1. Cookie
    token = request.cookies.get(COOKIE_ACCESS_TOKEN)
    if token:
        return token

    # 2. Header Authorization
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth[7:].strip()

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Devuelve el Usuario autenticado o lanza 401.

    Flujo:
      1. Extrae el token de la cookie o del header.
      2. Verifica firma y expiración.
      3. Carga el usuario de la BD.
      4. Verifica que la cuenta esté activa.
    """
    token = _extraer_access_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decodificar_access_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    id_usuario = payload.get("sub")
    if not id_usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )

    usuario = db.query(Usuario).filter(Usuario.IdUsuario == int(id_usuario)).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
        )

    # Verifica que la cuenta esté activa
    if usuario.estado and usuario.estado.Nombre != "Activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cuenta {usuario.estado.Nombre.lower()}. Contacta a soporte.",
        )

    return usuario


def require_role(*roles_permitidos: str):
    """
    Factory: devuelve una dependencia que exige que el usuario
    tenga uno de los roles dados.

    Uso:
        @app.get("/api/admin/x")
        def endpoint(user: Usuario = Depends(require_role("Administrador"))):
            ...
    """
    roles_lower = {r.lower() for r in roles_permitidos}

    def _checker(user: Usuario = Depends(get_current_user)) -> Usuario:
        rol_usuario = (user.rol.Nombre if user.rol else "").lower()
        if rol_usuario not in roles_lower:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para esta acción.",
            )
        return user

    return _checker


# ============================================================
# Atajos: usuario + entidad relacionada
# ============================================================

def get_current_candidato(
    user: Usuario = Depends(require_role("Candidato")),
) -> tuple[Usuario, Candidato]:
    if not user.candidato:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta cuenta no tiene perfil de candidato.",
        )
    return user, user.candidato


def get_current_empresa(
    user: Usuario = Depends(require_role("Empresa")),
) -> tuple[Usuario, Empresa]:
    if not user.empresa:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta cuenta no tiene perfil de empresa.",
        )
    return user, user.empresa


def get_current_admin(
    user: Usuario = Depends(require_role("Administrador")),
) -> tuple[Usuario, Administrador]:
    if not user.administrador:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta cuenta no tiene perfil de administrador.",
        )
    return user, user.administrador