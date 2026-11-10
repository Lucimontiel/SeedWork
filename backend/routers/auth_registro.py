import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Usuario, Rol, EstadoUsuario, Candidato, Empresa, SectorEmpresa, EmailVerificationToken
from schemas import RegistroCandidatoIn, RegistroEmpresaIn, CandidatoOut, EmpresaOut
from security import hash_password
from rate_limit import limiter, LIMIT_REGISTRO
from audit import registrar_evento, EVENTO_REGISTRO
from email_service import enviar_correo_verificacion
from utils import _buscar_municipio, _dividir_nombre
from notificaciones import crear_notificacion, TIPO_SISTEMA

router = APIRouter(prefix="/api/auth/registro", tags=["Registro"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

@router.post("/candidato", response_model=CandidatoOut)
@limiter.limit(LIMIT_REGISTRO)
def registrar_candidato(
    body: RegistroCandidatoIn, request: Request, 
    background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.Correo == body.correo).first():
        raise HTTPException(400, "Ya existe una cuenta con ese correo")

    municipio = _buscar_municipio(db, body.ciudad)
    rol_candidato = db.query(Rol).filter(Rol.Nombre == "Candidato").first()
    estado_activo = db.query(EstadoUsuario).filter(EstadoUsuario.Nombre == "Activo").first()

    usuario = Usuario(IdRol=rol_candidato.IdRol, IdEstadoUsuario=estado_activo.IdEstadoUsuario, Correo=body.correo, Contrasena=hash_password(body.contrasena))
    db.add(usuario)
    db.flush()

    nombres, apellidos = _dividir_nombre(body.nombreCompleto)
    candidato = Candidato(IdUsuario=usuario.IdUsuario, IdMunicipio=municipio.IdMunicipio, Nombres=nombres, Apellidos=apellidos, Telefono=body.telefono)
    db.add(candidato)
    db.flush()
    
    crear_notificacion(db, titulo="¡Bienvenido/a a SeedWork!", mensaje="Verifica tu correo y completa tu perfil.", tipo=TIPO_SISTEMA, id_candidato=candidato.IdCandidato)

    token_plano = secrets.token_urlsafe(32)
    db.add(EmailVerificationToken(IdUsuario=usuario.IdUsuario, TokenHash=hashlib.sha256(token_plano.encode("utf-8")).hexdigest(), ExpiraEn=(datetime.now(timezone.utc) + timedelta(hours=24)).replace(tzinfo=None), FechaCreacion=datetime.now(timezone.utc).replace(tzinfo=None)))

    registrar_evento(db, EVENTO_REGISTRO, exito=True, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles="candidato", commit=False)
    db.commit()
    db.refresh(candidato)

    background_tasks.add_task(enviar_correo_verificacion, usuario.Correo, f"{FRONTEND_URL}/verificar-correo?token={token_plano}")
    return CandidatoOut(idCandidato=candidato.IdCandidato, idUsuario=usuario.IdUsuario, nombres=candidato.Nombres, apellidos=candidato.Apellidos, correo=usuario.Correo, ciudad=municipio.Nombre, telefono=candidato.Telefono)

@router.post("/empresa", response_model=EmpresaOut)
@limiter.limit(LIMIT_REGISTRO)
def registrar_empresa(body: RegistroEmpresaIn, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.Correo == body.correo).first():
        raise HTTPException(400, "Ya existe una cuenta con ese correo")
    if db.query(Empresa).filter(Empresa.NIT == body.nit).first():
        raise HTTPException(400, "Ya existe una empresa con ese NIT")

    municipio = _buscar_municipio(db, body.ciudad)
    sector = db.query(SectorEmpresa).filter(func.lower(SectorEmpresa.Nombre) == body.sector.strip().lower()).first()
    rol_empresa = db.query(Rol).filter(Rol.Nombre == "Empresa").first()
    estado_activo = db.query(EstadoUsuario).filter(EstadoUsuario.Nombre == "Activo").first()

    usuario = Usuario(IdRol=rol_empresa.IdRol, IdEstadoUsuario=estado_activo.IdEstadoUsuario, Correo=body.correo, Contrasena=hash_password(body.contrasena))
    db.add(usuario)
    db.flush()

    empresa = Empresa(IdUsuario=usuario.IdUsuario, IdMunicipio=municipio.IdMunicipio, IdSectorEmpresa=sector.IdSectorEmpresa, NombreEmpresa=body.nombreEmpresa, NIT=body.nit)
    db.add(empresa)
    db.flush()

    crear_notificacion(db, titulo="¡Bienvenido/a a SeedWork!", mensaje="Verifica tu correo y publica tu primera oferta.", tipo=TIPO_SISTEMA, id_empresa=empresa.IdEmpresa)

    token_plano = secrets.token_urlsafe(32)
    db.add(EmailVerificationToken(IdUsuario=usuario.IdUsuario, TokenHash=hashlib.sha256(token_plano.encode("utf-8")).hexdigest(), ExpiraEn=(datetime.now(timezone.utc) + timedelta(hours=24)).replace(tzinfo=None), FechaCreacion=datetime.now(timezone.utc).replace(tzinfo=None)))

    registrar_evento(db, EVENTO_REGISTRO, exito=True, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles="empresa", commit=False)
    db.commit()
    db.refresh(empresa)

    background_tasks.add_task(enviar_correo_verificacion, usuario.Correo, f"{FRONTEND_URL}/verificar-correo?token={token_plano}")
    return EmpresaOut(idEmpresa=empresa.IdEmpresa, idUsuario=usuario.IdUsuario, nombreEmpresa=empresa.NombreEmpresa, correo=usuario.Correo, nit=empresa.NIT, sector=sector.Nombre, ciudad=municipio.Nombre)