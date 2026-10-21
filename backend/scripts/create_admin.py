"""
Crea un administrador real con 2FA obligatorio.

Uso:
    python scripts/create_admin.py

Requisitos:
    - La base de datos debe existir con el esquema nuevo (seedwork_full.sql).
    - Variables de entorno cargadas (.env).
"""
import sys
import os
import getpass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pyotp
import qrcode

from database import SessionLocal
from models import Usuario, Rol, EstadoUsuario, Administrador, CodigoRespaldo
from security import hash_password, generar_codigos_respaldo


def pedir_password():
    """Pide contraseña dos veces y valida longitud."""
    while True:
        p1 = getpass.getpass("Contraseña: ")
        p2 = getpass.getpass("Confirmar contraseña: ")

        if p1 != p2:
            print("❌ Las contraseñas no coinciden. Intenta de nuevo.\n")
            continue

        if len(p1) < 8:
            print("❌ La contraseña debe tener al menos 8 caracteres.\n")
            continue

        return p1


def imprimir_qr_en_terminal(uri: str):
    """Genera un QR ASCII para la terminal."""
    qr = qrcode.QRCode(border=1)
    qr.add_data(uri)
    qr.make(fit=True)
    qr.print_ascii(invert=True)


def main():
    print("=" * 60)
    print("  Crear Administrador - SeedWork")
    print("=" * 60)

    correo = input("Correo del administrador: ").strip().lower()
    nombres = input("Nombres: ").strip()
    apellidos = input("Apellidos: ").strip()
    documento = input("Documento (opcional): ").strip() or None
    telefono = input("Teléfono (opcional): ").strip() or None

    print()
    contrasena = pedir_password()

    db = SessionLocal()
    try:
        # Validaciones
        if db.query(Usuario).filter(Usuario.Correo == correo).first():
            print(f"\n❌ Ya existe un usuario con el correo {correo}")
            return

        rol = db.query(Rol).filter(Rol.Nombre == "Administrador").first()
        if not rol:
            print("\n❌ No existe el rol 'Administrador'. Corre primero el SQL de seed.")
            return

        estado = db.query(EstadoUsuario).filter(EstadoUsuario.Nombre == "Activo").first()
        if not estado:
            print("\n❌ No existe el estado 'Activo'. Corre primero el SQL de seed.")
            return

        # Generar secreto TOTP
        secreto_totp = pyotp.random_base32()
        uri = pyotp.totp.TOTP(secreto_totp).provisioning_uri(
            name=correo,
            issuer_name="SeedWork",
        )

        print("\n" + "=" * 60)
        print("  Escanea este QR con Google Authenticator / Authy / 1Password")
        print("=" * 60 + "\n")
        imprimir_qr_en_terminal(uri)

        print(f"\nO ingresa este código manualmente:\n  {secreto_totp}\n")

        # Pedir primer código para verificar
        codigo = input("Ingresa el código de 6 dígitos que muestra la app: ").strip()
        totp = pyotp.TOTP(secreto_totp)
        if not totp.verify(codigo, valid_window=1):
            print("\n❌ Código incorrecto. Abortando. Vuelve a ejecutar el script.")
            return

        print("\n✅ 2FA verificado correctamente.")

        # Crear usuario
        usuario = Usuario(
            IdRol=rol.IdRol,
            IdEstadoUsuario=estado.IdEstadoUsuario,
            Correo=correo,
            Contrasena=hash_password(contrasena),
            TotpSecret=secreto_totp,
            TotpHabilitado=True,
        )
        db.add(usuario)
        db.flush()

        admin = Administrador(
            IdUsuario=usuario.IdUsuario,
            Nombres=nombres,
            Apellidos=apellidos,
            Documento=documento,
            Telefono=telefono,
        )
        db.add(admin)
        db.flush()

        # Generar códigos de respaldo
        codigos_planos, codigos_hash = generar_codigos_respaldo(cantidad=10)

        for ch in codigos_hash:
            db.add(CodigoRespaldo(IdUsuario=usuario.IdUsuario, CodigoHash=ch))

        db.commit()

        print("\n" + "=" * 60)
        print("  ⚠️  GUARDA ESTOS CÓDIGOS DE RESPALDO EN UN LUGAR SEGURO")
        print("      Solo se muestran UNA vez. Cada uno sirve una sola vez.")
        print("=" * 60)
        for i, c in enumerate(codigos_planos, 1):
            print(f"  {i:2}. {c}")
        print("=" * 60)

        print(f"\n✅ Administrador '{correo}' creado exitosamente.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    main()