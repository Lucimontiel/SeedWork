import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 1. Cargar variables del .env explícitamente desde la carpeta backend
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# 2. Intentar leer DATABASE_URL (la forma recomendada por el repo)
DATABASE_URL = os.getenv("DATABASE_URL")

# 3. Si no existe DATABASE_URL, la construimos con las variables sueltas (tu forma anterior)
if not DATABASE_URL:
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = os.getenv("DB_NAME")

    if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]):
        raise RuntimeError(
            "Falta DATABASE_URL o las variables de conexión (DB_USER, DB_PASSWORD, etc.) en el archivo .env."
        )

    DATABASE_URL = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    )

# 4. Configurar SSL para Aiven si el archivo ca.pem existe en la carpeta
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CA_PATH = os.path.join(BASE_DIR, "ca.pem")

connect_args = {}
if os.path.exists(CA_PATH):
    connect_args = {"ssl": {"ca": CA_PATH}}

# 5. Crear el motor (una sola vez)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,        # evita errores por conexiones caídas
    pool_recycle=280,          # Aiven cierra conexiones inactivas ~5 min
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() # 👈 Restauramos el cierre de conexión que faltaba en el repo