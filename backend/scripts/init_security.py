"""
Verifica que la base de datos tiene todo el esquema de seguridad.

Uso:
    python scripts/init_security.py
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import inspect, text
from database import engine


def check(descripcion: str, condicion: bool) -> bool:
    icono = "OK " if condicion else "FALLA"
    print(f"[{icono}] {descripcion}")
    return condicion


def main():
    print("=" * 60)
    print("  Verificacion del esquema de seguridad - SeedWork")
    print("=" * 60)
    print()

    inspector = inspect(engine)

    # Normalizar a minusculas (Windows MySQL guarda todo en lowercase)
    tablas = {t.lower() for t in inspector.get_table_names()}

    # Info de conexion
    with engine.connect() as conn:
        db_name = conn.execute(text("SELECT DATABASE()")).scalar()
        print(f"Base de datos conectada: {db_name}")
        print()

    todo_ok = True

    # 1. Tablas nuevas
    print("Tablas de seguridad:")
    for tabla in ["refreshtoken", "codigorespaldo", "auditlog"]:
        todo_ok &= check(f"Tabla '{tabla}' existe", tabla in tablas)
    print()

    # 2. Columnas nuevas en Usuario
    print("Columnas en 'Usuario':")
    if "usuario" in tablas:
        cols = {c["name"].lower() for c in inspector.get_columns("Usuario")}
        for col in [
            "intentosfallidos", "bloqueadohasta", "totpsecret",
            "totphabilitado", "ultimologin", "ultimologinip",
        ]:
            todo_ok &= check(f"Columna '{col}' existe", col in cols)
    else:
        todo_ok &= check("Tabla 'Usuario' existe", False)
    print()

    # 3. Catalogos
    print("Catalogos basicos:")
    for tabla in ["rol", "estadousuario"]:
        todo_ok &= check(f"Tabla '{tabla}' existe", tabla in tablas)
    print()

    # 4. Datos de catalogo
    print("Datos de catalogo:")
    with engine.connect() as conn:
        try:
            n_roles = conn.execute(text("SELECT COUNT(*) FROM Rol")).scalar()
            n_estados = conn.execute(text("SELECT COUNT(*) FROM EstadoUsuario")).scalar()
            todo_ok &= check(f"Rol tiene datos ({n_roles} filas)", n_roles >= 3)
            todo_ok &= check(f"EstadoUsuario tiene datos ({n_estados} filas)", n_estados >= 1)
        except Exception as e:
            print(f"[FALLA] No se pudo consultar catalogos: {e}")
            todo_ok = False
    print()

    # 5. SalarioEsperado como VARCHAR
    print("Alineacion de tipos:")
    if "candidato" in tablas:
        cols = {c["name"].lower(): c for c in inspector.get_columns("Candidato")}
        if "salarioesperado" in cols:
            tipo = str(cols["salarioesperado"]["type"])
            todo_ok &= check(
                f"'SalarioEsperado' es VARCHAR ({tipo})",
                "VARCHAR" in tipo.upper() or "STRING" in tipo.upper(),
            )
    print()

    # 6. Hashes placeholder pendientes
    print("Estado de los hashes de prueba:")
    with engine.connect() as conn:
        pendientes = conn.execute(
            text("SELECT COUNT(*) FROM Usuario WHERE Contrasena = 'ARGON2_HASH_AQUI'")
        ).scalar()
        if pendientes == 0:
            print("[OK ] No hay placeholders sin reemplazar")
        else:
            print(f"[AVISO] Hay {pendientes} usuarios con 'ARGON2_HASH_AQUI'")
            print("        Corre: python scripts/fix_seed_hashes.py \"Password123!\"")
    print()

    print("=" * 60)
    if todo_ok:
        print("  TODO LISTO. El esquema de seguridad esta completo.")
    else:
        print("  HAY PROBLEMAS. Revisa el SQL de seed.")
    print("=" * 60)

    sys.exit(0 if todo_ok else 1)


if __name__ == "__main__":
    main()