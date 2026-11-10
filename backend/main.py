"""
Backend de SeedWork (FastAPI) - Punto de entrada.
"""
import os
from sqlalchemy import text
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv()

from database import get_db
from rate_limit import limiter, rate_limit_exceeded_handler

# ⬇️ IMPORTAR LOS ROUTERS ⬇️
from auth import router as auth_router
from routers import auth_registro, candidato, empresa, admin, vacantes, simulador

app = FastAPI(title="SeedWork API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_METODOS_SEGUROS = {"GET", "HEAD", "OPTIONS"}

@app.middleware("http")
async def proteger_sesion(request: Request, call_next):
    if request.method not in _METODOS_SEGUROS:
        origin = request.headers.get("origin")
        mismo_host = f"{request.url.scheme}://{request.headers.get('host', '')}"
        if origin and origin not in ALLOWED_ORIGINS and origin != mismo_host:
            return JSONResponse(status_code=403, content={"detail": "Origen no permitido."})
    response = await call_next(request)
    if request.url.path.startswith("/api/auth"):
        response.headers["Cache-Control"] = "no-store"
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    return response

# ⬇️ CONECTAR LOS ROUTERS ⬇️
app.include_router(auth_router)
app.include_router(auth_registro.router)
app.include_router(candidato.router)
app.include_router(empresa.router)
app.include_router(admin.router)
app.include_router(vacantes.router)
app.include_router(simulador.router)

@app.get("/health", tags=["system"])
def healthcheck(db = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected", "version": "1.0.0"}
    except Exception:
        return JSONResponse(status_code=500, content={"detail": "Database connection failed"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)