"""Configuración centralizada del backend (lee variables del .env)."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar el .env desde la misma carpeta que este archivo
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    # Entorno
    ENV: str = os.getenv("ENV", "dev")

    # Base de datos
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

    # Duraciones de tokens (por rol)
    ACCESS_TOKEN_EXPIRE_MINUTES_CANDIDATO: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES_CANDIDATO", "30"))
    ACCESS_TOKEN_EXPIRE_MINUTES_EMPRESA: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES_EMPRESA", "20"))
    ACCESS_TOKEN_EXPIRE_MINUTES_ADMIN: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES_ADMIN", "10"))

    REFRESH_TOKEN_EXPIRE_DAYS_CANDIDATO: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS_CANDIDATO", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS_EMPRESA: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS_EMPRESA", "14"))
    REFRESH_TOKEN_EXPIRE_HOURS_ADMIN: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_HOURS_ADMIN", "8"))

    # Cookies
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_DOMAIN: str = os.getenv("COOKIE_DOMAIN", "")
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    # CORS
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()
    ]

    # Rate limiting
    RATE_LIMIT_LOGIN: str = os.getenv("RATE_LIMIT_LOGIN", "10/minute")
    RATE_LIMIT_REGISTRO: str = os.getenv("RATE_LIMIT_REGISTRO", "5/minute")
    RATE_LIMIT_REFRESH: str = os.getenv("RATE_LIMIT_REFRESH", "30/minute")

    # Bloqueo por intentos fallidos
    MAX_INTENTOS_FALLIDOS: int = int(os.getenv("MAX_INTENTOS_FALLIDOS", "5"))
    BLOQUEO_MINUTOS: int = int(os.getenv("BLOQUEO_MINUTOS", "15"))


settings = Settings()