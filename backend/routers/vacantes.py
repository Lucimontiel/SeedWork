from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from database import get_db
from dependencies import get_current_user, require_role
from models import Usuario, Oferta, EstadoOferta, Modalidad, CategoriaOferta, Municipio, Empresa, Postulacion, EstadoPostulacion, TipoContrato, JornadaLaboral, Reporte, CategoriaOferta, Municipio, Rol
from schemas import OfertaOut
from utils import _verificar_ownership_empresa, _buscar_municipio
from rate_limit import limiter
from notificaciones import crear_notificacion, TIPO_NUEVA_POSTULACION

router = APIRouter(prefix="/api", tags=["Vacantes y Ofertas"])

@router.get("/vacantes")
def listar_vacantes(page: int = 1, limit: int = 10, q: str | None = None, modalidad: str | None = None, ciudad: str | None = None, categoria: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Oferta).join(EstadoOferta).join(Empresa).options(joinedload(Oferta.empresa), joinedload(Oferta.modalidad), joinedload(Oferta.municipio), joinedload(Oferta.categoria), joinedload(Oferta.tipo_contrato)).filter(EstadoOferta.Nombre == "Publicada")
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Oferta.Titulo.ilike(like), Empresa.NombreEmpresa.ilike(like)))
    if modalidad: query = query.join(Modalidad).filter(Modalidad.Nombre == modalidad)
    if ciudad: query = query.join(Municipio).filter(Municipio.Nombre == ciudad)
    if categoria: query = query.join(CategoriaOferta).filter(CategoriaOferta.Nombre == categoria)
    total = query.count()
    ofertas = query.order_by(Oferta.FechaPublicacion.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"items": [OfertaOut(idOferta=o.IdOferta, idEmpresa=o.empresa.IdEmpresa, titulo=o.Titulo, empresa=o.empresa.NombreEmpresa, ciudad=o.municipio.Nombre, modalidad=o.modalidad.Nombre, categoria=o.categoria.Nombre, tipoContrato=o.tipo_contrato.Nombre, descripcion=o.Descripcion, experienciaMinima=o.ExperienciaMinima, fechaPublicacion=o.FechaPublicacion) for o in ofertas], "total": total, "page": page, "pages": (total + limit - 1) // limit}

@router.get("/ofertas/{id_oferta}")
def obtener_oferta(id_oferta: int, db: Session = Depends(get_db)):
    oferta = db.query(Oferta).options(joinedload(Oferta.empresa), joinedload(Oferta.modalidad), joinedload(Oferta.municipio), joinedload(Oferta.categoria)).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta: raise HTTPException(404, "Oferta no encontrada")
    return {"idOferta": oferta.IdOferta, "titulo": oferta.Titulo, "descripcion": oferta.Descripcion, "ciudad": oferta.municipio.Nombre, "modalidad": oferta.modalidad.Nombre}

@router.post("/ofertas")
def crear_oferta(body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    if not usuario.empresa or not usuario.EmailVerificado: raise HTTPException(403, "Debes verificar tu correo y ser empresa.")
    modalidad = db.query(Modalidad).filter(func.lower(Modalidad.Nombre) == body.get("modalidad", "Presencial").strip().lower()).first()
    categoria = db.query(CategoriaOferta).filter(func.lower(CategoriaOferta.Nombre) == body.get("categoria", "Desarrollo de Software").strip().lower()).first()
    tipo_contrato = db.query(TipoContrato).filter(func.lower(TipoContrato.Nombre) == body.get("tipoContrato", "Término Indefinido").strip().lower()).first()
    jornada = db.query(JornadaLaboral).filter(func.lower(JornadaLaboral.Nombre) == body.get("jornada", "Tiempo Completo").strip().lower()).first()
    municipio = _buscar_municipio(db, body.get("ciudad", "Medellín"))
    estado = db.query(EstadoOferta).filter(EstadoOferta.Nombre == "Por aprobar").first()
    oferta = Oferta(IdEmpresa=usuario.empresa.IdEmpresa, IdCategoria=categoria.IdCategoria, IdTipoContrato=tipo_contrato.IdTipoContrato, IdModalidad=modalidad.IdModalidad, IdJornada=jornada.IdJornada, IdEstadoOferta=estado.IdEstadoOferta, IdMunicipio=municipio.IdMunicipio, Titulo=body.get("titulo", ""), Descripcion=body.get("descripcion", ""), Vacantes=body.get("vacantes", 1), ExperienciaMinima=body.get("experienciaMinima", 0))
    db.add(oferta)
    db.commit()
    db.refresh(oferta)
    return {"idOferta": oferta.IdOferta, "titulo": oferta.Titulo, "ciudad": municipio.Nombre, "modalidad": modalidad.Nombre, "estado": estado.Nombre}

@router.post("/postulaciones")
def crear_postulacion(body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    if not usuario.candidato or not usuario.EmailVerificado: raise HTTPException(403, "Debes verificar tu correo y ser candidato.")
    id_oferta = body.get("idOferta")
    oferta = db.query(Oferta).options(joinedload(Oferta.empresa)).filter(Oferta.IdOferta == id_oferta).first()
    if db.query(Postulacion).filter(Postulacion.IdOferta == id_oferta, Postulacion.IdCandidato == usuario.candidato.IdCandidato).first(): raise HTTPException(400, "Ya te postulaste.")
    estado_inicial = db.query(EstadoPostulacion).filter(EstadoPostulacion.Nombre == "Postulado").first()
    postulacion = Postulacion(IdOferta=id_oferta, IdCandidato=usuario.candidato.IdCandidato, IdEstadoPostulacion=estado_inicial.IdEstadoPostulacion, Vista=False)
    db.add(postulacion)
    crear_notificacion(db, titulo="Nueva postulación", mensaje=f"{usuario.candidato.Nombres} se postuló a {oferta.Titulo}", tipo=TIPO_NUEVA_POSTULACION, id_empresa=oferta.IdEmpresa)
    db.commit()
    return {"idPostulacion": postulacion.IdPostulacion, "idOferta": id_oferta, "estado": estado_inicial.Nombre}

@router.delete("/postulaciones/{id_postulacion}")
def eliminar_postulacion(id_postulacion: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    postulacion = db.query(Postulacion).filter(Postulacion.IdPostulacion == id_postulacion).first()
    if not postulacion: raise HTTPException(404, "No encontrada")
    if not (usuario.rol.Nombre == "Administrador" or (usuario.candidato and usuario.candidato.IdCandidato == postulacion.IdCandidato)): raise HTTPException(403, "No permitido")
    db.delete(postulacion)
    db.commit()
    return {"message": "Eliminada"}

@router.post("/reportes")
@limiter.limit("3/hour")
def crear_reporte(request: Request, body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    db.add(Reporte(IdUsuario=usuario.IdUsuario, IdOferta=body.get("idOferta"), Motivo=body.get("motivo", "Reporte general")))
    db.commit()
    return {"message": "Reporte enviado"}

@router.get("/municipios/")
def obtener_municipios(db: Session = Depends(get_db)): return db.query(Municipio).all()

@router.get("/roles/")
def obtener_roles(db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))): return db.query(Rol).all()

@router.put("/ofertas/{id_oferta}")
def actualizar_oferta(id_oferta: int, body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    from utils import _verificar_ownership_empresa
    oferta = db.query(Oferta).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta: raise HTTPException(404, "Oferta no encontrada")
    _verificar_ownership_empresa(usuario, oferta.IdEmpresa)
    if body.get("titulo"): oferta.Titulo = body["titulo"]
    if body.get("descripcion"): oferta.Descripcion = body["descripcion"]
    if body.get("ciudad"): oferta.IdMunicipio = _buscar_municipio(db, body["ciudad"]).IdMunicipio
    if body.get("modalidad"):
        modalidad = db.query(Modalidad).filter(func.lower(Modalidad.Nombre) == body["modalidad"].strip().lower()).first()
        if modalidad: oferta.IdModalidad = modalidad.IdModalidad
    db.commit()
    db.refresh(oferta)
    return {"message": "Oferta actualizada correctamente"}