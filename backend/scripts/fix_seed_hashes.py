"""
Reemplaza todos los 'ARGON2_HASH_AQUI' de la BD por un hash real
de la contraseña que le pases.

Uso:
    python scripts/fix_seed_hashes.py Password123!
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from database import engine
from security import hash_password


def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/fix_seed_hashes.py <contraseña>")
        sys.exit(1)

    password = sys.argv[1]
    print(f"Generando hash argon2 para '{password}'...")
    nuevo_hash = hash_password(password)
    print(f"Hash: {nuevo_hash[:50]}...")

    with engine.begin() as conn:
        result = conn.execute(
            text("UPDATE Usuario SET Contrasena = :h WHERE Contrasena = 'ARGON2_HASH_AQUI'"),
            {"h": nuevo_hash},
        )
        print(f"[OK] {result.rowcount} usuarios actualizados.")

        # Verificación
        pendientes = conn.execute(
            text("SELECT COUNT(*) FROM Usuario WHERE Contrasena = 'ARGON2_HASH_AQUI'")
        ).scalar()
        if pendientes == 0:
            print("[OK] Todos los hashes quedaron reemplazados.")
        else:
            print(f"[AVISO] Quedan {pendientes} usuarios con el placeholder.")


if __name__ == "__main__":
    main()