"""
Genera un hash argon2 para usar en el script SQL de seed.

Uso:
    python scripts/hash_password.py Password123!
"""
import sys
import os

# Agregar el directorio raíz al path para poder importar security
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from security import hash_password


def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/hash_password.py <contraseña>")
        sys.exit(1)

    password = sys.argv[1]
    hashed = hash_password(password)
    print(hashed)


if __name__ == "__main__":
    main()