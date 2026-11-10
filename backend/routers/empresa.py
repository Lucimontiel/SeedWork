from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from database import get_db
from dependencies import get_current_user
from models import Usuario, Empresa, Oferta, Postulacion, Notificacion, EstadoOferta, EstadoPostulacion, Candidato, SectorEmpresa
from utils import _verificar_ownership_empresa, _buscar_municipio
from notificaciones import crear_notificacion, TIPO_SISTEMA
from schemas import EmpresaOut

router = APIRouter(prefix="/api/empresa", tags=["Empresa"])

@router.get("/{id_empresa}")
def obtener_empresa(id_empresa: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_empresa(usuario, id_empresa)
    empresa = db.query(Empresa).options(joinedload(Empresa.usuario), joinedload(Empresa.municipio), joinedload(Empresa.sector)).filter(Empresa.IdEmpresa == id_empresa).first()
    if not empresa: raise HTTPException(404, "Empresa no encontrada")
    return {"idEmpresa": empresa.IdEmpresa, "idUsuario": empresa.IdUsuario, "nombreEmpresa": empresa.NombreEmpresa, "correo": empresa.usuario.Correo, "nit": empresa.NIT, "sector": empresa.sector.Nombre if empresa.sector else None, "ciudad": empresa.municipio.Nombre, "telefono": empresa.Telefono, "descripcion": empresa.Descripcion, "direccion": empresa.Direccion, "sitioweb": empresa.SitioWeb, "correoCorporativo": empresa.CorreoCorporativo, "especialidades": empresa.Especialidades, "anioFundacion": empresa.AnioFundacion, "mision": empresa.Mision, "vision": empresa.Vision, "logoUrl": empresa.LogoUrl}

@router.put("/{id_empresa}")
def actualizar_empresa(id_empresa: int, body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_empresa(usuario, id_empresa)
    empresa = db.query(Empresa).filter(Empresa.IdEmpresa == id_empresa).first()
    if not empresa: raise HTTPException(404, "Empresa no encontrada")
    if "nombreEmpresa" in body and body["nombreEmpresa"] is not None: empresa.NombreEmpresa = body["nombreEmpresa"]
    if "nit" in body and body["nit"] is not None: empresa.NIT = body["nit"]
    if "ciudad" in body and body["ciudad"]: empresa.IdMunicipio = _buscar_municipio(db, body["ciudad"]).IdMunicipio
    if "sector" in body and body["sector"]:
        sector = db.query(SectorEmpresa).filter(func.lower(SectorEmpresa.Nombre) == body["sector"].strip().lower()).first()
        if sector: empresa.IdSectorEmpresa = sector.IdSectorEmpresa
    if "telefono" in body and body["telefono"] is not None: empresa.Telefono = body["telefono"]
    if "descripcion" in body and body["descripcion"] is not None: empresa.Descripcion = body["descripcion"]
    if "direccion" in body and body["direccion"] is not None: empresa.Direccion = body["direccion"]
    if "sitioweb" in body and body["sitioweb"] is not None: empresa.SitioWeb = body["sitioweb"]
    if "correoCorporativo" in body and body["correoCorporativo"] is not None: empresa.CorreoCorporativo = body["correoCorporativo"]
    if "especialidades" in body and body["especialidades"] is not None: empresa.Especialidades = body["especialidades"]
    if "anioFundacion" in body and body["anioFundacion"] is not None: empresa.AnioFundacion = int(body["anioFundacion"])
    if "mision" in body and body["mision"] is not None: empresa.Mision = body["mision"]
    if "vision" in body and body["vision"] is not None: empresa.Vision = body["vision"]
    if "logoUrl" in body and body["logoUrl"] is not None: empresa.LogoUrl = body["logoUrl"]
    db.commit()
    db.refresh(empresa)
    return {"message": "Empresa actualizada correctamente"}

@router.get("/{id_empresa}/candidatos")
def obtener_candidatos_empresa(id_empresa: int, page: int = 1, limit: int = 10, q: str = "", estado: str = "", db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_empresa(usuario, id_empresa)
    query = db.query(Postulacion).join(Oferta).join(Candidato).join(EstadoPostulacion).options(joinedload(Postulacion.candidato).joinedload(Candidato.usuario), joinedload(Postulacion.oferta), joinedload(Postulacion.estado)).filter(Oferta.IdEmpresa == id_empresa)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Candidato.Nombres.ilike(like), Candidato.Apellidos.ilike(like), Oferta.Titulo.ilike(like)))
    if estado: query = query.filter(EstadoPostulacion.Nombre == estado)
    total = query.count()
    postulaciones = query.order_by(Postulacion.FechaPostulacion.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"items": [{"idPostulacion": p.IdPostulacion, "idCandidato": p.candidato.IdCandidato, "nombres": p.candidato.Nombres, "apellidos": p.candidato.Apellidos, "correo": p.candidato.usuario.Correo, "telefono": p.candidato.Telefono, "fotoUrl": p.candidato.FotoUrl, "tituloOferta": p.oferta.Titulo, "estado": p.estado.Nombre, "fechaPostulacion": p.FechaPostulacion} for p in postulaciones], "total": total, "page": page, "pages": (total + limit - 1) // limit}

@router.get("/ofertas/{id_oferta}/candidatos")
def obtener_candidatos_de_oferta(id_oferta: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    oferta = db.query(Oferta).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta: raise HTTPException(404, "Oferta no encontrada")
    _verificar_ownership_empresa(usuario, oferta.IdEmpresa)
    postulaciones = db.query(Postulacion).options(joinedload(Postulacion.candidato).joinedload(Candidato.usuario), joinedload(Postulacion.estado)).filter(Postulacion.IdOferta == id_oferta).all()
    return [{"idPostulacion": p.IdPostulacion, "idCandidato": p.candidato.IdCandidato, "nombres": p.candidato.Nombres, "apellidos": p.candidato.Apellidos, "correo": p.candidato.usuario.Correo, "telefono": p.candidato.Telefono, "fotoUrl": p.candidato.FotoUrl, "estado": p.estado.Nombre, "fechaPostulacion": p.FechaPostulacion} for p in postulaciones]

@router.get("/{id_empresa}/ofertas/estados")
def contar_ofertas_por_estado(id_empresa: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_empresa(usuario, id_empresa)
    total = db.query(Oferta).filter(Oferta.IdEmpresa == id_empresa).count()
    estados = {e.Nombre: e.IdEstadoOferta for e in db.query(EstadoOferta).all()}
    def cuenta(nombre: str) -> int: return db.query(Oferta).filter(Oferta.IdEmpresa == id_empresa, Oferta.IdEstadoOferta == estados[nombre]).count()
    return {"total": total, "activas": cuenta("Publicada"), "en_revision": cuenta("Por aprobar"), "pausadas": cuenta("Pausada"), "cerradas": cuenta("Cerrada"), "rechazadas": cuenta("Rechazada")}

@router.patch("/ofertas/{id_oferta}/estado")
def cambiar_estado_oferta_empresa(id_oferta: int, body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    oferta = db.query(Oferta).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta: raise HTTPException(404, "Oferta no encontrada")
    _verificar_ownership_empresa(usuario, oferta.IdEmpresa)
    nuevo_estado_nombre = body.get("nuevoEstado")
    if not nuevo_estado_nombre: raise HTTPException(400, "Falta 'nuevoEstado'.")
    TRANSICIONES_EMPRESA = {"Publicada": {"Pausada", "Cerrada"}, "Pausada": {"Cerrada"}}
    permitidos = TRANSICIONES_EMPRESA.get(oferta.estado.Nombre if oferta.estado else None, set())
    if nuevo_estado_nombre not in permitidos: raise HTTPException(status_code=403, detail="No puedes cambiar a ese estado.")
    nuevo_estado = db.query(EstadoOferta).filter(EstadoOferta.Nombre == nuevo_estado_nombre).first()
    oferta.IdEstadoOferta = nuevo_estado.IdEstadoOferta
    db.commit()
    return {"idOferta": oferta.IdOferta, "estado": nuevo_estado_nombre}

@router.patch("/postulaciones/{id_postulacion}/estado")
def cambiar_estado_postulacion_empresa(id_postulacion: int, body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    if not usuario.empresa: raise HTTPException(403, "Solo empresas.")
    postulacion = db.query(Postulacion).options(joinedload(Postulacion.oferta).joinedload(Oferta.empresa), joinedload(Postulacion.candidato)).filter(Postulacion.IdPostulacion == id_postulacion).first()
    if not postulacion: raise HTTPException(404, "Postulación no encontrada.")
    if postulacion.oferta.IdEmpresa != usuario.empresa.IdEmpresa: raise HTTPException(403, "No tienes permiso.")
    nuevo_estado_nombre = body.get("nuevoEstado")
    nuevo_estado = db.query(EstadoPostulacion).filter(EstadoPostulacion.Nombre == nuevo_estado_nombre).first()
    if not nuevo_estado: raise HTTPException(400, "Estado no encontrado.")
    estado_anterior = postulacion.IdEstadoPostulacion
    postulacion.IdEstadoPostulacion = nuevo_estado.IdEstadoPostulacion
    if estado_anterior != nuevo_estado.IdEstadoPostulacion:
        crear_notificacion(db, titulo="Actualización de postulación", mensaje=f"Tu postulación a {postulacion.oferta.Titulo} cambió a: {nuevo_estado_nombre}", tipo=TIPO_SISTEMA, id_candidato=postulacion.IdCandidato)
    db.commit()
    return {"idPostulacion": postulacion.IdPostulacion, "estado": nuevo_estado_nombre}

@router.get("/{id_empresa}/ofertas")
def listar_ofertas_de_empresa(id_empresa: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_empresa(usuario, id_empresa)
    ofertas = db.query(Oferta).options(joinedload(Oferta.empresa), joinedload(Oferta.modalidad), joinedload(Oferta.municipio), joinedload(Oferta.categoria)).filter(Oferta.IdEmpresa == id_empresa).order_by(Oferta.FechaPublicacion.desc()).all()
    oferta_ids = [o.IdOferta for o in ofertas]
    conteo_map = {}
    if oferta_ids:
        filas = db.query(Postulacion.IdOferta, func.count(Postulacion.IdPostulacion)).filter(Postulacion.IdOferta.in_(oferta_ids)).group_by(Postulacion.IdOferta).all()
        conteo_map = {id_oferta: total for id_oferta, total in filas}
    return [{"idOferta": o.IdOferta, "titulo": o.Titulo, "empresa": o.empresa.NombreEmpresa, "ciudad": o.municipio.Nombre, "modalidad": o.modalidad.Nombre, "categoria": o.categoria.Nombre, "estado": o.estado.Nombre, "fechaPublicacion": o.FechaPublicacion, "totalPostulaciones": conteo_map.get(o.IdOferta, 0)} for o in ofertas]

@router.get("/{id_empresa}/notificaciones")
def obtener_notificaciones_empresa(id_empresa: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_empresa(usuario, id_empresa)
    notificaciones = db.query(Notificacion).filter((Notificacion.IdEmpresa == id_empresa) | (Notificacion.IdEmpresa == None)).order_by(Notificacion.Fecha.desc()).all()
    return [{"idNotificacion": n.IdNotificacion, "titulo": n.Titulo, "mensaje": n.Mensaje, "leida": n.Leida, "fecha": n.Fecha} for n in notificaciones]

@router.patch("/{id_empresa}/notificaciones/{id_notificacion}/leer")
def marcar_notificacion_leida(id_empresa: int, id_notificacion: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_empresa(usuario, id_empresa)
    noti = db.query(Notificacion).filter(Notificacion.IdNotificacion == id_notificacion, Notificacion.IdEmpresa == id_empresa).first()
    if not noti: raise HTTPException(404, "Notificación no encontrada.")
    noti.Leida = True
    db.commit()
    return {"idNotificacion": noti.IdNotificacion, "leida": True}

@router.patch("/{id_empresa}/notificaciones/leer-todas")
def marcar_todas_leidas(id_empresa: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_empresa(usuario, id_empresa)
    actualizadas = db.query(Notificacion).filter(Notificacion.IdEmpresa == id_empresa, Notificacion.Leida == False).update({"Leida": True})
    db.commit()
    return {"actualizadas": actualizadas}

@router.get("/{id_empresa}/resumen")
def obtener_resumen_empresa(id_empresa: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_empresa(usuario, id_empresa)
    ofertas = db.query(Oferta).filter(Oferta.IdEmpresa == id_empresa).all()
    oferta_ids = [o.IdOferta for o in ofertas]
    postulaciones = db.query(Postulacion).filter(Postulacion.IdOferta.in_(oferta_ids)).all()
    estados = db.query(EstadoPostulacion).all()
    estado_nombres = {e.IdEstadoPostulacion: e.Nombre for e in estados}
    return {"nuevosCandidatos": len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) == "Postulado"]), "candidatosRecomendados": len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) in ["En revisión", "Preseleccionado"]]), "entrevistas": len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) == "Entrevista"]), "vacantesPorVencer": len([o for o in ofertas if o.FechaCierre is not None]), "rendimiento": len([o for o in ofertas if o.IdEstadoOferta == 1])}