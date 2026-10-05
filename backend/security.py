"""
security.py - Núcleo de seguridad de SeedWork.

Incluye:
  - Hashing de contraseñas (argon2, con soporte legacy bcrypt + rehash automático)
  - Creación y verificación de JWT (access tokens)
  - Generación y hashing de refresh tokens
  - Helpers de TOTP (2FA)
  - Generación de códigos de respaldo
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Carga SIEMPRE el .env que está en backend/, no el de otra carpeta
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path)

import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
import pyotp


# ============================================================
# CONFIGURACION (desde .env)
# ============================================================
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cambia-esto-en-produccion")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

ACCESS_MIN_CANDIDATO = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES_CANDIDATO", "30"))
ACCESS_MIN_EMPRESA   = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES_EMPRESA", "20"))
ACCESS_MIN_ADMIN     = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES_ADMIN", "10"))

REFRESH_DIAS_CANDIDATO = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS_CANDIDATO", "30"))
REFRESH_DIAS_EMPRESA   = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS_EMPRESA", "14"))
REFRESH_HORAS_ADMIN    = int(os.getenv("REFRESH_TOKEN_EXPIRE_HOURS_ADMIN", "8"))


# ============================================================
# HASHING DE CONTRASEÑAS
# argon2 primero (nuevo estándar), bcrypt como legacy.
# deprecated="auto" hace que passlib marque bcrypt como deprecado
# para que podamos detectarlo y rehashear.
# ============================================================
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto",
    argon2__time_cost=2,
    argon2__memory_cost=102400,  # ~100 MB
    argon2__parallelism=8,
)


def hash_password(password: str) -> str:
    """Genera un hash argon2 de la contraseña."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica la contraseña contra el hash (argon2 o bcrypt legacy)."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def verify_and_update(plain_password: str, hashed_password: str) -> tuple[bool, Optional[str]]:
    """
    Verifica la contraseña y, si el hash está deprecado (bcrypt),
    devuelve uno nuevo (argon2) para actualizarlo en la BD.

    Retorna:
        (es_valida, hash_nuevo_o_None)
    """
    try:
        valido, nuevo_hash = pwd_context.verify_and_update(plain_password, hashed_password)
        return valido, nuevo_hash
    except Exception:
        return False, None


# ============================================================
# JWT (access tokens)
# ============================================================
def _duracion_access_minutos(rol: str) -> int:
    rol = rol.lower()
    if rol == "administrador":
        return ACCESS_MIN_ADMIN
    if rol == "empresa":
        return ACCESS_MIN_EMPRESA
    return ACCESS_MIN_CANDIDATO


def crear_access_token(
    id_usuario: int,
    rol: str,
    extra: Optional[dict] = None,
) -> str:
    """
    Crea un JWT de acceso.
    Payload mínimo: sub (id_usuario), rol, exp, iat, tipo.
    """
    ahora = datetime.now(timezone.utc)
    expira = ahora + timedelta(minutes=_duracion_access_minutos(rol))

    payload = {
        "sub": str(id_usuario),
        "rol": rol,
        "tipo": "access",
        "iat": int(ahora.timestamp()),
        "exp": int(expira.timestamp()),
    }
    if extra:
        payload.update(extra)

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decodificar_access_token(token: str) -> dict:
    """
    Decodifica un JWT y valida firma + expiración.
    Lanza JWTError si es inválido.
    """
    payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    if payload.get("tipo") != "access":
        raise JWTError("Token no es de tipo access")
    return payload


# ============================================================
# REFRESH TOKENS
# No son JWT: son strings aleatorios largos. Se guardan
# hasheados en la BD (nunca el valor plano).
# ============================================================
def generar_refresh_token() -> str:
    """Genera un refresh token aleatorio (valor plano)."""
    return secrets.token_urlsafe(64)


def hashear_refresh_token(token: str) -> str:
    """
    Hash SHA-256 del refresh token para guardarlo en BD.
    No usamos argon2 aquí porque el token ya es aleatorio
    de 64 bytes (512 bits); SHA-256 es suficiente y más rápido.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def duracion_refresh(rol: str) -> timedelta:
    rol = rol.lower()
    if rol == "administrador":
        return timedelta(hours=REFRESH_HORAS_ADMIN)
    if rol == "empresa":
        return timedelta(days=REFRESH_DIAS_EMPRESA)
    return timedelta(days=REFRESH_DIAS_CANDIDATO)


# ============================================================
# TOTP (2FA)
# ============================================================
def generar_secreto_totp() -> str:
    """Genera un secreto base32 para TOTP."""
    return pyotp.random_base32()


def uri_totp(secreto: str, correo: str, issuer: str = "SeedWork") -> str:
    """Genera la URI otpauth:// para el QR."""
    return pyotp.totp.TOTP(secreto).provisioning_uri(name=correo, issuer_name=issuer)


def verificar_codigo_totp(secreto: str, codigo: str, ventana: int = 1) -> bool:
    """
    Verifica un código TOTP de 6 dígitos.
    ventana=1 permite ±30s de tolerancia de reloj.
    """
    if not secreto or not codigo:
        return False
    try:
        return pyotp.TOTP(secreto).verify(codigo.strip(), valid_window=ventana)
    except Exception:
        return False


# ============================================================
# CODIGOS DE RESPALDO (para 2FA)
# ============================================================
def _formatear_codigo_respaldo() -> str:
    """Genera un código con formato XXXX-XXXX-XXXX (12 chars)."""
    partes = [secrets.token_hex(2).upper() for _ in range(3)]
    return "-".join(partes)


def generar_codigos_respaldo(cantidad: int = 10) -> tuple[list[str], list[str]]:
    """
    Genera códigos de respaldo.

    Retorna:
        (codigos_planos, codigos_hash)
        - codigos_planos: para mostrar al usuario UNA vez.
        - codigos_hash: para guardar en la BD.
    """
    planos = [_formatear_codigo_respaldo() for _ in range(cantidad)]
    hashes = [hash_password(c) for c in planos]
    return planos, hashes


def verificar_codigo_respaldo(codigo_plano: str, codigo_hash: str) -> bool:
    """Verifica un código de respaldo contra su hash."""
    try:
        return pwd_context.verify(codigo_plano.strip().upper(), codigo_hash)
    except Exception:
        return False
