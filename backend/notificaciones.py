"""
notificaciones.py - Helper para crear notificaciones automáticas.

Uso:
    from notificaciones import crear_notificacion

    crear_notificacion(
        db,
        id_empresa=empresa.IdEmpresa,
        titulo="Nueva postulación",
        mensaje="Andrea Pérez se postuló a Desarrollador de Software",
        tipo="Nueva Postulación",
    )

Notas:
  - `tipo` debe coincidir con un Nombre en la tabla TipoNotificacion.
  - El commit lo hace el endpoint que llama al helper.
"""
from typing import Optional
from sqlalchemy.orm import Session

from models import Notificacion, TipoNotificacion


# Tipos estándar (coinciden con el seed de la BD)
TIPO_NUEVA_OFERTA = "Nueva Oferta"
TIPO_NUEVA_POSTULACION = "Nueva Postulación"
TIPO_ENTREVISTA = "Entrevista"
TIPO_IA = "IA"
TIPO_SISTEMA = "Sistema"
TIPO_REPORTE = "Reporte"


def _obtener_id_tipo(db: Session, nombre: str) -> Optional[int]:
    tipo = db.query(TipoNotificacion).filter(TipoNotificacion.Nombre == nombre).first()
    return tipo.IdTipoNotificacion if tipo else None


def crear_notificacion(
    db: Session,
    *,
    titulo: str,
    mensaje: str,
    tipo: str = TIPO_SISTEMA,
    id_empresa: Optional[int] = None,
    id_candidato: Optional[int] = None,
    id_administrador: Optional[int] = None,
) -> Optional[Notificacion]:
    """
    Crea una notificación en la BD.

    No hace commit: el que llama debe hacerlo.
    Devuelve el objeto Notificacion creado, o None si el tipo no existe.
    """
    id_tipo = _obtener_id_tipo(db, tipo)
    if not id_tipo:
        print(f"[notificaciones] Tipo '{tipo}' no encontrado. Se omite.")
        return None

    noti = Notificacion(
        IdTipoNotificacion=id_tipo,
        IdEmpresa=id_empresa,
        IdCandidato=id_candidato,
        IdAdministrador=id_administrador,
        Titulo=titulo,
        Mensaje=mensaje,
        Leida=False,
    )
    db.add(noti)
    return noti