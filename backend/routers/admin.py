from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from dependencies import require_role
from models import Usuario, Oferta, Reporte, AuditLog, EstadoUsuario, EstadoOferta, Empresa, Candidato
from notificaciones import crear_notificacion, TIPO_SISTEMA

router = APIRouter(prefix="/api/admin", tags=["Administrador"])
ESTADOS_PERMITIDOS = {"Publicada", "Rechazada", "Pausada"}

@router.get("/vacantes")
def listar_vacantes_admin(page: int = 1, limit: int = 15, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    query = db.query(Oferta).options(joinedload(Oferta.empresa), joinedload(Oferta.modalidad), joinedload(Oferta.municipio), joinedload(Oferta.estado))
    total = query.count()
    ofertas = query.order_by(Oferta.FechaPublicacion.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"items": [{"idOferta": o.IdOferta, "titulo": o.Titulo, "empresa": o.empresa.NombreEmpresa, "ciudad": o.municipio.Nombre, "modalidad": o.modalidad.Nombre, "estado": o.estado.Nombre, "fechaPublicacion": o.FechaPublicacion} for o in ofertas], "total": total, "page": page, "pages": (total + limit - 1) // limit}

@router.patch("/vacantes/{id_oferta}/estado")
def cambiar_estado_vacante(id_oferta: int, body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    nuevo_estado_nombre = body.get("nuevoEstado")
    if nuevo_estado_nombre not in ESTADOS_PERMITIDOS: 
        raise HTTPException(400, f"Estado no permitido: {nuevo_estado_nombre}")
    
    oferta = db.query(Oferta).options(joinedload(Oferta.empresa)).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta: 
        raise HTTPException(404, "Vacante no encontrada")
    
    # CORREGIDO: Ahora busca en EstadoOferta, no en EstadoUsuario
    nuevo_estado = db.query(EstadoOferta).filter(EstadoOferta.Nombre == nuevo_estado_nombre).first()
    if not nuevo_estado:
        raise HTTPException(500, f"El estado '{nuevo_estado_nombre}' no existe en la BD")

    oferta.IdEstadoOferta = nuevo_estado.IdEstadoOferta
    
    verbo = {"Publicada": "aprobada", "Rechazada": "rechazada", "Pausada": "pausada"}.get(nuevo_estado_nombre, "actualizada")
    crear_notificacion(db, titulo=f"Oferta {verbo}", mensaje=f"Tu oferta fue {verbo}.", tipo=TIPO_SISTEMA, id_empresa=oferta.IdEmpresa)
    
    db.commit()
    return {"idOferta": oferta.IdOferta, "estado": nuevo_estado_nombre}

@router.get("/resumen")
def obtener_resumen_admin(db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    # CORREGIDO: Ahora las tablas Empresa y Candidato están importadas arriba
    return {
        "totalUsuarios": db.query(Usuario).filter(Usuario.IdRol != 1).count(), 
        "totalEmpresas": db.query(Empresa).count(), 
        "totalCandidatos": db.query(Candidato).count(), 
        "totalOfertas": db.query(Oferta).count(), 
        "reportesPendientes": db.query(Reporte).filter(Reporte.Estado == "Abierto").count()
    }

@router.get("/usuarios")
def listar_usuarios_admin(db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    usuarios = db.query(Usuario).filter(Usuario.IdRol != 1).all()
    return [{"idUsuario": u.IdUsuario, "nombre": f"{u.candidato.Nombres} {u.candidato.Apellidos}" if u.candidato else (u.empresa.NombreEmpresa if u.empresa else u.Correo), "correo": u.Correo, "tipo": "candidato" if u.candidato else "empresa", "estado": u.estado.Nombre if u.estado else "Activo"} for u in usuarios]

@router.patch("/usuarios/{id_usuario}/estado")
def cambiar_estado_usuario(id_usuario: int, body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    user = db.query(Usuario).filter(Usuario.IdUsuario == id_usuario).first()
    if not user: raise HTTPException(404, "Usuario no encontrado")
    if user.IdRol == 1 or user.IdUsuario == usuario.IdUsuario: raise HTTPException(403, "No permitido")
    estado = db.query(EstadoUsuario).filter(EstadoUsuario.Nombre == body.get("estado")).first()
    if not estado: raise HTTPException(400, "Estado no válido")
    user.IdEstadoUsuario = estado.IdEstadoUsuario
    db.commit()
    return {"message": "Estado actualizado"}

@router.get("/audit")
def listar_audit_log(page: int = 1, limit: int = 20, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    query = db.query(AuditLog)
    total = query.count()
    logs = query.order_by(AuditLog.Fecha.desc()).offset((page - 1) * limit).limit(limit).all()
    usuarios_dict = {u.IdUsuario: u.Correo for u in db.query(Usuario).all()}
    return {"items": [{"idAudit": l.IdAudit, "evento": l.Evento, "exito": l.Exito, "ip": l.IP, "fecha": l.Fecha, "usuario": usuarios_dict.get(l.IdUsuario, l.CorreoIntentado or "Desconocido"), "detalles": l.Detalles} for l in logs], "total": total, "page": page, "pages": (total + limit - 1) // limit}

# ==========================================
# NUEVOS ENDPOINTS: REPORTES
# ==========================================
@router.get("/reportes")
def listar_reportes_admin(db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    reportes = db.query(Reporte).order_by(Reporte.Fecha.desc()).all()
    return [{
        "idReporte": r.IdReporte,
        "reportadoPor": r.usuario.Correo if r.usuario else "Usuario Eliminado",
        "motivo": r.Motivo,
        "estado": r.Estado,
        "oferta": r.oferta.Titulo if r.oferta else "Oferta Eliminada"
    } for r in reportes]

@router.patch("/reportes/{id_reporte}/resolver")
def resolver_reporte(id_reporte: int, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    rep = db.query(Reporte).filter(Reporte.IdReporte == id_reporte).first()
    if not rep: raise HTTPException(404, "Reporte no encontrado")
    rep.Estado = "Cerrado"
    db.commit()
    return {"message": "Reporte cerrado exitosamente"}