"""Inserta los datos de catálogo mínimos en Aiven.
Se puede ejecutar varias veces sin duplicar datos."""

from database import SessionLocal
import models


def add_if_missing(db, Modelo, filtro, **valores):
    """Inserta una fila solo si no existe otra que cumpla el filtro."""
    existe = db.query(Modelo).filter_by(**filtro).first()
    if not existe:
        db.add(Modelo(**valores))


def seed():
    db = SessionLocal()
    try:
        # --- PAIS ---
        add_if_missing(db, models.Pais, {"IdPais": 1}, IdPais=1, Nombre="Colombia")
        db.commit()

        # --- DEPARTAMENTOS ---
        departamentos = [
            (1, "Antioquia"),
            (2, "Cundinamarca"),
            (3, "Valle del Cauca"),
            (4, "Atlántico"),
            (5, "Bolívar"),
            (6, "Santander"),
            (7, "Risaralda"),
            (8, "Caldas"),
            (9, "Tolima"),
            (10, "Nariño"),
        ]
        for id_dep, nombre in departamentos:
            add_if_missing(db, models.Departamento, {"IdDepartamento": id_dep},
                           IdDepartamento=id_dep, IdPais=1, Nombre=nombre)
        db.commit()

        # --- MUNICIPIOS ---
        municipios = [
            (1, 1, "Medellín"),
            (2, 1, "Bello"),
            (3, 1, "Envigado"),
            (4, 1, "Rionegro"),
            (5, 2, "Bogotá"),
            (6, 2, "Soacha"),
            (7, 2, "Chía"),
            (8, 3, "Cali"),
            (9, 3, "Palmira"),
            (10, 3, "Buenaventura"),
            (11, 4, "Barranquilla"),
            (12, 4, "Soledad"),
            (13, 5, "Cartagena"),
            (14, 6, "Bucaramanga"),
            (15, 6, "Floridablanca"),
            (16, 7, "Pereira"),
            (17, 8, "Manizales"),
            (18, 9, "Ibagué"),
            (19, 10, "Pasto"),
        ]
        for id_mun, id_dep, nombre in municipios:
            add_if_missing(db, models.Municipio, {"IdMunicipio": id_mun},
                           IdMunicipio=id_mun, IdDepartamento=id_dep, Nombre=nombre)
        db.commit()

        # --- ROLES ---
        for id_rol, nombre in [(1, "Candidato"), (2, "Empresa"), (3, "Administrador")]:
            add_if_missing(db, models.Rol, {"IdRol": id_rol}, IdRol=id_rol, Nombre=nombre)
        db.commit()

        # --- ESTADOS DE USUARIO ---
        for id_est, nombre in [(1, "Activo"), (2, "Inactivo")]:
            add_if_missing(db, models.EstadoUsuario, {"IdEstadoUsuario": id_est},
                           IdEstadoUsuario=id_est, Nombre=nombre)
        db.commit()

        # --- MODALIDAD ---
        for i, nombre in enumerate(["Presencial", "Híbrida", "Remota"], start=1):
            add_if_missing(db, models.Modalidad, {"IdModalidad": i},
                           IdModalidad=i, Nombre=nombre)
        db.commit()

        # --- DISPONIBILIDAD ---
        for i, nombre in enumerate(["Tiempo Completo", "Medio Tiempo", "Inmediata", "Fin de Semana"], start=1):
            add_if_missing(db, models.Disponibilidad, {"IdDisponibilidad": i},
                           IdDisponibilidad=i, Nombre=nombre)
        db.commit()

        # --- TIPO DE CONTRATO ---
        for i, nombre in enumerate(["Término Indefinido", "Término Fijo", "Obra o Labor",
                                     "Prestación de Servicios", "Aprendizaje"], start=1):
            add_if_missing(db, models.TipoContrato, {"IdTipoContrato": i},
                           IdTipoContrato=i, Nombre=nombre)
        db.commit()

        # --- JORNADA LABORAL ---
        for i, nombre in enumerate(["Tiempo Completo", "Medio Tiempo", "Por Horas"], start=1):
            add_if_missing(db, models.JornadaLaboral, {"IdJornada": i},
                           IdJornada=i, Nombre=nombre)
        db.commit()

        # --- ESTADO DE OFERTA ---
        estados_oferta = ["Publicada", "Por aprobar", "Pausada", "Cerrada", "Rechazada"]
        for i, nombre in enumerate(estados_oferta, start=1):
            add_if_missing(db, models.EstadoOferta, {"IdEstadoOferta": i},
                           IdEstadoOferta=i, Nombre=nombre)
        db.commit()

        # --- CATEGORÍA DE OFERTA ---
        categorias = ["Desarrollo de Software", "Diseño", "Marketing", "Ventas",
                      "Administración", "Recursos Humanos", "Finanzas"]
        for i, nombre in enumerate(categorias, start=1):
            add_if_missing(db, models.CategoriaOferta, {"IdCategoria": i},
                           IdCategoria=i, Nombre=nombre)
        db.commit()

        # --- ESTADO DE POSTULACIÓN ---
        estados_post = ["Postulado", "En revisión", "Preseleccionado", "Entrevista",
                        "Rechazado", "Contratado"]
        for i, nombre in enumerate(estados_post, start=1):
            add_if_missing(db, models.EstadoPostulacion, {"IdEstadoPostulacion": i},
                           IdEstadoPostulacion=i, Nombre=nombre)
        db.commit()

        # --- SECTOR EMPRESA ---
        sectores = ["Tecnología", "Salud", "Educación", "Financiero",
                    "Comercio", "Manufactura", "Servicios"]
        for i, nombre in enumerate(sectores, start=1):
            add_if_missing(db, models.SectorEmpresa, {"IdSectorEmpresa": i},
                           IdSectorEmpresa=i, Nombre=nombre)
        db.commit()

        # --- TAMAÑO EMPRESA ---
        tamanos = ["Micro", "Pequeña", "Mediana", "Grande"]
        for i, rango in enumerate(tamanos, start=1):
            add_if_missing(db, models.TamanoEmpresa, {"IdTamanoEmpresa": i},
                           IdTamanoEmpresa=i, Rango=rango)
        db.commit()

        # --- TIPO NOTIFICACIÓN ---
        tipos_notif = ["Postulación", "Mensaje", "Alerta"]
        for i, nombre in enumerate(tipos_notif, start=1):
            add_if_missing(db, models.TipoNotificacion, {"IdTipoNotificacion": i},
                           IdTipoNotificacion=i, Nombre=nombre)
        db.commit()

        print("✅ Datos de catálogo insertados correctamente")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()