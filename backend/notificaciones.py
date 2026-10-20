# notif_utils.py
from typing import Optional
from sqlalchemy.orm import Session
from models import Notificacion, TipoNotificacion

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