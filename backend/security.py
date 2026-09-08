from passlib.context import CryptContext

# Configuración del proceso de hashing
# Cambiamos a pbkdf2_sha256 para evitar el límite de 72 bytes
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    # Si usas pbkdf2_sha256, no necesitas truncar, pero lo dejamos por seguridad
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
