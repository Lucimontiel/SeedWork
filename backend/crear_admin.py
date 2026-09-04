"""
Script para crear un usuario Administrador desde la terminal.
Reutiliza la misma conexión, modelos y hash de contraseña que ya
usa el backend, así que el usuario que crea queda 100% compatible
con el login normal.

Uso:
    py crear_admin.py
"""
from database import SessionLocal
from models import Usuario, Administrador, Rol, EstadoUsuario
from security import hash_password

def main():
    correo = input("Correo del administrador: ").strip()
    contrasena = input("Contraseña: ").strip()
    nombres = input("Nombres: ").strip()
    apellidos = input("Apellidos: ").strip()

    db = SessionLocal()
    try:
        if db.query(Usuario).filter(Usuario.Correo == correo).first():
            print("Ya existe un usuario con ese correo.")
            return

        rol_admin = db.query(Rol).filter(Rol.Nombre == "Administrador").first()
        estado_activo = db.query(EstadoUsuario).filter(EstadoUsuario.Nombre == "Activo").first()

        usuario = Usuario(
            IdRol=rol_admin.IdRol,
            IdEstadoUsuario=estado_activo.IdEstadoUsuario,
            Correo=correo,
            Contrasena=hash_password(contrasena),
        )
        db.add(usuario)
        db.flush()

        admin = Administrador(
            IdUsuario=usuario.IdUsuario,
            Nombres=nombres,
            Apellidos=apellidos,
        )
        db.add(admin)
        db.commit()

        print(f"Administrador creado: {nombres} {apellidos} ({correo}) - IdUsuario {usuario.IdUsuario}")
    finally:
        db.close()

if __name__ == "__main__":
    main()