from passlib.context import CryptContext

# Configuración del contexto de hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Genera un hash seguro de la contraseña"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que la contraseña en texto plano coincida con el hash"""
    return pwd_context.verify(plain_password, hashed_password)
