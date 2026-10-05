"""
rate_limit.py - Rate limiting con slowapi.

Configura un limiter global por IP. Se aplica por endpoint con
el decorador @limiter.limit("N/periodo").

Uso en main.py:

    from rate_limit import limiter, rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

Y en un endpoint:

    @app.post("/api/auth/login")
    @limiter.limit("10/minute")
    async def login(request: Request, body: LoginIn, db: Session = Depends(get_db)):
        ...
"""
import os

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse


def _key_por_ip(request: Request) -> str:
    """
    Clave para el limiter: IP del cliente.
    Considera X-Forwarded-For si hay proxy reverso.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_key_por_ip)


# Límites por defecto (configurables por .env)
LIMIT_LOGIN = os.getenv("RATE_LIMIT_LOGIN", "10/minute")
LIMIT_REGISTRO = os.getenv("RATE_LIMIT_REGISTRO", "5/minute")
LIMIT_REFRESH = os.getenv("RATE_LIMIT_REFRESH", "30/minute")
LIMIT_2FA = os.getenv("RATE_LIMIT_2FA", "10/minute")
LIMIT_GENERAL = os.getenv("RATE_LIMIT_GENERAL", "200/minute")


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Handler personalizado: devuelve JSON en español con headers útiles.
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Demasiadas solicitudes. Intenta de nuevo en un momento.",
            "retry_after": getattr(exc, "retry_after", None),
        },
        headers={"Retry-After": str(getattr(exc, "retry_after", 60))},
    )