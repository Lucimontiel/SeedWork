from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

<<<<<<< HEAD
=======
# --- CAMBIA ESTOS DATOS POR LOS TUYOS ---
# IMPORTANTE: El "*" se reemplaza por %2A para que la URL no se rompa
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:3217361186Vila@localhost/seedwork"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()