"""
Backend de SeedWork (FastAPI).
"""
import os
import json
import secrets
import hashlib
import requests
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from groq import Groq 
from dotenv import load_dotenv

load_dotenv()

from database import get_db
from models import (
    Usuario, Rol, EstadoUsuario, Candidato, Empresa, Municipio, SectorEmpresa,
    Oferta, EstadoOferta, Modalidad, CategoriaOferta,
    Postulacion, EstadoPostulacion,
    TipoContrato, JornadaLaboral, Disponibilidad,
    CandidatoHabilidad, CandidatoEducacion, CandidatoProyecto, CandidatoIdioma,
    CandidatoReferencia, CandidatoSeccionCV,
    Notificacion, EmailVerificationToken, PasswordResetToken,  Reporte,
)
from schemas import (
    RegistroCandidatoIn, RegistroEmpresaIn,
    CandidatoOut, EmpresaOut,
    OfertaOut, PostulacionOut,
    PerfilOut, PerfilDatosIn, PreferenciasIn,
    HabilidadOut, EducacionOut, ProyectoOut, IdiomaOut,
    HabilidadesIn, EducacionIn, ProyectoIn, IdiomaIn,
    SobreMiIn, FotoIn,
    DatosPersonalesIn, PlantillaIn,
    ReferenciaOut, ReferenciaIn,
    SeccionCVOut, SeccionCVIn, SeccionCVUpdateIn,
)
from security import hash_password
from rate_limit import limiter, rate_limit_exceeded_handler, LIMIT_REGISTRO
from dependencies import (
    get_current_user,
    require_role,
    get_current_candidato,
    get_current_empresa,
    get_current_admin,
)
from audit import registrar_evento, EVENTO_REGISTRO, EVENTO_ACCESO_DENEGADO
from email_service import enviar_correo_verificacion

# Importar el router de auth
from auth import router as auth_router

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# ============================================================
# APP
# ============================================================
app = FastAPI(title="SeedWork API")

# Inicializar Groq (IA)
#groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
 #groq_client = None  # Temporal para que arranque sin IA

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# CORS
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_METODOS_SEGUROS = {"GET", "HEAD", "OPTIONS"}

@app.middleware("http")
async def proteger_sesion(request: Request, call_next):
    if request.method not in _METODOS_SEGUROS:
        origin = request.headers.get("origin")
        mismo_host = f"{request.url.scheme}://{request.headers.get('host', '')}"
        if origin and origin not in ALLOWED_ORIGINS and origin != mismo_host:
            return JSONResponse(status_code=403, content={"detail": "Origen no permitido."})

    response = await call_next(request)
    if request.url.path.startswith("/api/auth"):
        response.headers["Cache-Control"] = "no-store"
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    return response


app.include_router(auth_router)


# ============================================================
# HELPERS
# ============================================================
def _dividir_nombre(nombre_completo: str):
    partes = nombre_completo.strip().split()
    if len(partes) == 1:
        return partes[0], ""
    mitad = (len(partes) + 1) // 2
    return " ".join(partes[:mitad]), " ".join(partes[mitad:])


def _buscar_municipio(db: Session, nombre_ciudad: str) -> Municipio:
    municipio = (
        db.query(Municipio)
        .filter(func.lower(Municipio.Nombre) == nombre_ciudad.strip().lower())
        .first()
    )
    if not municipio:
        raise HTTPException(400, f"Ciudad '{nombre_ciudad}' no encontrada en el catálogo de municipios")
    return municipio


def _buscar_en_catalogo(db: Session, Modelo, campo_nombre: str, valor: str, etiqueta: str):
    fila = db.query(Modelo).filter(func.lower(getattr(Modelo, campo_nombre)) == valor.strip().lower()).first()
    if not fila:
        raise HTTPException(400, f"{etiqueta} '{valor}' no encontrado en el catálogo")
    return fila


def _obtener_candidato_completo(id_candidato: int, db: Session) -> Candidato:
    candidato = (
        db.query(Candidato)
        .options(
            joinedload(Candidato.usuario),
            joinedload(Candidato.municipio),
            joinedload(Candidato.tipo_contrato_preferido),
            joinedload(Candidato.jornada_preferida),
            joinedload(Candidato.modalidad_preferida),
            joinedload(Candidato.disponibilidad),
            joinedload(Candidato.habilidades),
            joinedload(Candidato.educacion),
            joinedload(Candidato.proyectos),
            joinedload(Candidato.idiomas),
            joinedload(Candidato.referencias),
            joinedload(Candidato.secciones_cv),
        )
        .filter(Candidato.IdCandidato == id_candidato)
        .first()
    )
    if not candidato:
        raise HTTPException(404, "Candidato no encontrado")
    return candidato


def _armar_perfil(candidato: Candidato) -> PerfilOut:
    return PerfilOut(
        idCandidato=candidato.IdCandidato,
        idUsuario=candidato.IdUsuario,
        nombres=candidato.Nombres,
        apellidos=candidato.Apellidos,
        tituloProfesional=candidato.TituloProfesional,
        correo=candidato.usuario.Correo,
        ciudad=candidato.municipio.Nombre if candidato.municipio else None,
        telefono=candidato.Telefono,
        fechaNacimiento=candidato.FechaNacimiento if candidato.FechaNacimiento else None,
        about=candidato.AcercaDe,
        fotoUrl=candidato.FotoUrl,
        areaInteres=candidato.AreaInteres,
        salarioEsperado=candidato.SalarioEsperado,
        tipoContratoPreferido=candidato.tipo_contrato_preferido.Nombre if candidato.tipo_contrato_preferido else None,
        jornadaPreferida=candidato.jornada_preferida.Nombre if candidato.jornada_preferida else None,
        movilidad=candidato.Movilidad,
        modalidad=candidato.modalidad_preferida.Nombre if candidato.modalidad_preferida else None,
        modalidadPreferida=candidato.modalidad_preferida.Nombre if candidato.modalidad_preferida else None,
        disponibilidad=candidato.disponibilidad.Nombre if candidato.disponibilidad else None,
        habilidades=[HabilidadOut(idHabilidad=h.IdHabilidad, nombre=h.Nombre) for h in (candidato.habilidades or [])],
        educacion=[EducacionOut(idEducacion=e.IdEducacion, titulo=e.Titulo, institucion=e.Institucion, anio=e.Anio) for e in (candidato.educacion or [])],
        experiencia=[ProyectoOut(idProyecto=p.IdProyecto, titulo=p.Titulo, descripcion=p.Descripcion, meta=p.Meta) for p in (candidato.proyectos or [])],
        idiomas=[IdiomaOut(idIdioma=i.IdIdioma, descripcion=i.Descripcion) for i in (candidato.idiomas or [])],
        plantilla=candidato.PlantillaCV or "clasico",
        proyectos=[ProyectoOut(idProyecto=p.IdProyecto, titulo=p.Titulo, descripcion=p.Descripcion, meta=p.Meta) for p in (candidato.proyectos or [])],
        referencias=[ReferenciaOut(idReferencia=r.IdReferencia, nombre=r.Nombre, cargo=r.Cargo, contacto=r.Contacto) for r in (candidato.referencias or [])],
        secciones=[SeccionCVOut(idSeccion=s.IdSeccion, titulo=s.Titulo, contenido=s.Contenido) for s in sorted(candidato.secciones_cv or [], key=lambda s: s.Orden)],
    )


def _verificar_ownership_candidato(usuario: Usuario, id_candidato: int):
    if usuario.rol and usuario.rol.Nombre == "Administrador":
        return
    if not usuario.candidato or usuario.candidato.IdCandidato != id_candidato:
        raise HTTPException(403, "No tienes permiso para acceder a este recurso.")


def _verificar_ownership_empresa(usuario: Usuario, id_empresa: int):
    if usuario.rol and usuario.rol.Nombre == "Administrador":
        return
    if not usuario.empresa or usuario.empresa.IdEmpresa != id_empresa:
        raise HTTPException(403, "No tienes permiso para acceder a este recurso.")


# ============================================================
# REGISTRO
# ============================================================
@app.post("/api/auth/registro/candidato", response_model=CandidatoOut)
@limiter.limit(LIMIT_REGISTRO)
def registrar_candidato(body: RegistroCandidatoIn, request: Request, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.Correo == body.correo).first():
        raise HTTPException(400, "Ya existe una cuenta con ese correo")

    municipio = _buscar_municipio(db, body.ciudad)

    rol_candidato = db.query(Rol).filter(Rol.Nombre == "Candidato").first()
    if not rol_candidato:
        raise HTTPException(400, "El Rol 'Candidato' no está registrado en la base de datos")

    estado_activo = db.query(EstadoUsuario).filter(EstadoUsuario.Nombre == "Activo").first()
    if not estado_activo:
        raise HTTPException(400, "El estado 'Activo' no está registrado en la base de datos")

    usuario = Usuario(
        IdRol=rol_candidato.IdRol,
        IdEstadoUsuario=estado_activo.IdEstadoUsuario,
        Correo=body.correo,
        Contrasena=hash_password(body.contrasena),
    )
    db.add(usuario)
    db.flush()

    nombres, apellidos = _dividir_nombre(body.nombreCompleto)
    candidato = Candidato(
        IdUsuario=usuario.IdUsuario,
        IdMunicipio=municipio.IdMunicipio,
        Nombres=nombres,
        Apellidos=apellidos,
        Telefono=body.telefono,
    )
    db.add(candidato)
    db.flush()
    
    from notificaciones import crear_notificacion, TIPO_SISTEMA
    crear_notificacion(
        db,
        titulo="¡Bienvenido/a a SeedWork!",
        mensaje="Verifica tu correo y completa tu perfil para empezar.",
        tipo=TIPO_SISTEMA,
        id_candidato=candidato.IdCandidato,
    )

    token_plano = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token_plano.encode("utf-8")).hexdigest()
    nuevo_token = EmailVerificationToken(
        IdUsuario=usuario.IdUsuario,
        TokenHash=token_hash,
        ExpiraEn=(datetime.now(timezone.utc) + timedelta(hours=24)).replace(tzinfo=None),
        FechaCreacion=datetime.now(timezone.utc).replace(tzinfo=None)
    )
    db.add(nuevo_token)

    enlace = f"{FRONTEND_URL}/verificar-correo?token={token_plano}"

    registrar_evento(db, EVENTO_REGISTRO, exito=True, id_usuario=usuario.IdUsuario,
                 correo_intentado=body.correo, request=request, detalles="candidato",
                 commit=False)
    db.commit()             # ← commit PRIMERO
    db.refresh(candidato)

    # Email best-effort DESPUÉS del commit
    try:
        enviar_correo_verificacion(usuario.Correo, enlace)
    except Exception as e:
        print(f"[EMAIL] Falló envío de verificación: {e}")
        # No fallar el registro por un email roto

    return CandidatoOut(
        idCandidato=candidato.IdCandidato,
        idUsuario=usuario.IdUsuario,
        nombres=candidato.Nombres,
        apellidos=candidato.Apellidos,
        correo=usuario.Correo,
        ciudad=municipio.Nombre,
        telefono=candidato.Telefono,
    )


@app.post("/api/auth/registro/empresa", response_model=EmpresaOut)
@limiter.limit(LIMIT_REGISTRO)
def registrar_empresa(body: RegistroEmpresaIn, request: Request, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.Correo == body.correo).first():
        raise HTTPException(400, "Ya existe una cuenta con ese correo")
    if db.query(Empresa).filter(Empresa.NIT == body.nit).first():
        raise HTTPException(400, "Ya existe una empresa registrada con ese NIT")

    municipio = _buscar_municipio(db, body.ciudad)
    sector = db.query(SectorEmpresa).filter(func.lower(SectorEmpresa.Nombre) == body.sector.strip().lower()).first()
    if not sector:
        raise HTTPException(400, f"Sector '{body.sector}' no encontrado en el catálogo")

    rol_empresa = db.query(Rol).filter(Rol.Nombre == "Empresa").first()
    if not rol_empresa:
        raise HTTPException(400, "El Rol 'Empresa' no está registrado en la base de datos")

    estado_activo = db.query(EstadoUsuario).filter(EstadoUsuario.Nombre == "Activo").first()
    if not estado_activo:
        raise HTTPException(400, "El estado 'Activo' no está registrado en la base de datos")

    usuario = Usuario(
        IdRol=rol_empresa.IdRol,
        IdEstadoUsuario=estado_activo.IdEstadoUsuario,
        Correo=body.correo,
        Contrasena=hash_password(body.contrasena),
    )
    db.add(usuario)
    db.flush()

    empresa = Empresa(
        IdUsuario=usuario.IdUsuario,
        IdMunicipio=municipio.IdMunicipio,
        IdSectorEmpresa=sector.IdSectorEmpresa,
        NombreEmpresa=body.nombreEmpresa,
        NIT=body.nit,
    )
    db.add(empresa)
    db.flush()

    from notificaciones import crear_notificacion, TIPO_SISTEMA
    crear_notificacion(
        db,
        titulo="¡Bienvenido/a a SeedWork!",
        mensaje="Verifica tu correo y publica tu primera oferta.",
        tipo=TIPO_SISTEMA,
        id_empresa=empresa.IdEmpresa,
    )

    token_plano = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token_plano.encode("utf-8")).hexdigest()
    nuevo_token = EmailVerificationToken(
        IdUsuario=usuario.IdUsuario,
        TokenHash=token_hash,
        ExpiraEn=(datetime.now(timezone.utc) + timedelta(hours=24)).replace(tzinfo=None),
        FechaCreacion=datetime.now(timezone.utc).replace(tzinfo=None)
    )
    db.add(nuevo_token)

    enlace = f"{FRONTEND_URL}/verificar-correo?token={token_plano}"
    enviar_correo_verificacion(usuario.Correo, enlace)

    registrar_evento(db, EVENTO_REGISTRO, exito=True, id_usuario=usuario.IdUsuario, correo_intentado=body.correo, request=request, detalles="empresa", commit=False)
    db.commit()
    db.refresh(empresa)

    return EmpresaOut(
        idEmpresa=empresa.IdEmpresa,
        idUsuario=usuario.IdUsuario,
        nombreEmpresa=empresa.NombreEmpresa,
        correo=usuario.Correo,
        nit=empresa.NIT,
        sector=sector.Nombre,
        ciudad=municipio.Nombre,
    )


# ============================================================
# PERFIL DEL CANDIDATO
# ============================================================
@app.get("/api/candidato/{id_candidato}/perfil", response_model=PerfilOut)
def obtener_perfil(
    id_candidato: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    if usuario.rol and usuario.rol.Nombre == "Empresa":
        if not usuario.empresa:
            raise HTTPException(403, "No tienes permiso.")
        existe = (
            db.query(Postulacion)
            .join(Oferta)
            .filter(
                Postulacion.IdCandidato == id_candidato,
                Oferta.IdEmpresa == usuario.empresa.IdEmpresa,
            )
            .first()
        )
        if not existe:
            raise HTTPException(403, "No tienes permiso para ver este perfil.")
    else:
        _verificar_ownership_candidato(usuario, id_candidato)

    candidato = _obtener_candidato_completo(id_candidato, db)
    return _armar_perfil(candidato)


# ============================================================
# PERFIL DE EMPRESA
# ============================================================
@app.get("/api/empresa/{id_empresa}")
def obtener_empresa(
    id_empresa: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_empresa(usuario, id_empresa)
    empresa = (
        db.query(Empresa)
        .options(joinedload(Empresa.usuario), joinedload(Empresa.municipio), joinedload(Empresa.sector))
        .filter(Empresa.IdEmpresa == id_empresa)
        .first()
    )
    if not empresa:
        raise HTTPException(404, "Empresa no encontrada")
    return {
        "idEmpresa": empresa.IdEmpresa,
        "idUsuario": empresa.IdUsuario,
        "nombreEmpresa": empresa.NombreEmpresa,
        "correo": empresa.usuario.Correo,
        "nit": empresa.NIT,
        "sector": empresa.sector.Nombre if empresa.sector else None,
        "ciudad": empresa.municipio.Nombre,
        "telefono": empresa.Telefono,
        "descripcion": empresa.Descripcion,
        "direccion": empresa.Direccion,
        "sitioweb": empresa.SitioWeb,
        "correoCorporativo": empresa.CorreoCorporativo,
        "especialidades": empresa.Especialidades,
        "anioFundacion": empresa.AnioFundacion,
        "mision": empresa.Mision,
        "vision": empresa.Vision,
        "logoUrl": empresa.LogoUrl,
    }


@app.put("/api/empresa/{id_empresa}")
def actualizar_empresa(
    id_empresa: int,
    body: dict,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_empresa(usuario, id_empresa)
    empresa = db.query(Empresa).filter(Empresa.IdEmpresa == id_empresa).first()
    if not empresa:
        raise HTTPException(404, "Empresa no encontrada")

    if "nombreEmpresa" in body and body["nombreEmpresa"] is not None:
        empresa.NombreEmpresa = body["nombreEmpresa"]
    if "nit" in body and body["nit"] is not None:
        empresa.NIT = body["nit"]
    if "ciudad" in body and body["ciudad"]:
        municipio = _buscar_municipio(db, body["ciudad"])
        empresa.IdMunicipio = municipio.IdMunicipio
    if "sector" in body and body["sector"]:
        sector = db.query(SectorEmpresa).filter(func.lower(SectorEmpresa.Nombre) == body["sector"].strip().lower()).first()
        if sector:
            empresa.IdSectorEmpresa = sector.IdSectorEmpresa
    if "telefono" in body and body["telefono"] is not None:
        empresa.Telefono = body["telefono"]
    if "descripcion" in body and body["descripcion"] is not None:
        empresa.Descripcion = body["descripcion"]
    if "direccion" in body and body["direccion"] is not None:
        empresa.Direccion = body["direccion"]
    if "sitioweb" in body and body["sitioweb"] is not None:
        empresa.SitioWeb = body["sitioweb"]
    if "correoCorporativo" in body and body["correoCorporativo"] is not None:
        empresa.CorreoCorporativo = body["correoCorporativo"]
    if "especialidades" in body and body["especialidades"] is not None:
        empresa.Especialidades = body["especialidades"]
    if "anioFundacion" in body and body["anioFundacion"] is not None:
        empresa.AnioFundacion = int(body["anioFundacion"])
    if "mision" in body and body["mision"] is not None:
        empresa.Mision = body["mision"]
    if "vision" in body and body["vision"] is not None:
        empresa.Vision = body["vision"]
    if "logoUrl" in body and body["logoUrl"] is not None:
        empresa.LogoUrl = body["logoUrl"]

    db.commit()
    db.refresh(empresa)
    return {"message": "Empresa actualizada correctamente"}


# ============================================================
# CANDIDATOS DE UNA EMPRESA
# ============================================================
@app.get("/api/empresa/{id_empresa}/candidatos")
def obtener_candidatos_empresa(
    id_empresa: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_empresa(usuario, id_empresa)
    ofertas = db.query(Oferta).filter(Oferta.IdEmpresa == id_empresa).all()
    if not ofertas:
        return []

    postulaciones = (
        db.query(Postulacion)
        .options(
            joinedload(Postulacion.candidato).joinedload(Candidato.usuario),
            joinedload(Postulacion.oferta),
            joinedload(Postulacion.estado),
        )
        .filter(Postulacion.IdOferta.in_([o.IdOferta for o in ofertas]))
        .all()
    )

    return [
        {
            "idPostulacion": p.IdPostulacion,
            "idCandidato": p.candidato.IdCandidato,
            "nombres": p.candidato.Nombres,
            "apellidos": p.candidato.Apellidos,
            "correo": p.candidato.usuario.Correo,
            "telefono": p.candidato.Telefono,
            "fotoUrl": p.candidato.FotoUrl,
            "tituloOferta": p.oferta.Titulo,
            "estado": p.estado.Nombre,
            "fechaPostulacion": p.FechaPostulacion,
        }
        for p in postulaciones
    ]


@app.get("/api/empresa/ofertas/{id_oferta}/candidatos")
def obtener_candidatos_de_oferta(
    id_oferta: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    oferta = db.query(Oferta).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta:
        raise HTTPException(404, "Oferta no encontrada")
    _verificar_ownership_empresa(usuario, oferta.IdEmpresa)

    postulaciones = (
        db.query(Postulacion)
        .options(
            joinedload(Postulacion.candidato).joinedload(Candidato.usuario),
            joinedload(Postulacion.estado),
        )
        .filter(Postulacion.IdOferta == id_oferta)
        .all()
    )

    return [
        {
            "idPostulacion": p.IdPostulacion,
            "idCandidato": p.candidato.IdCandidato,
            "nombres": p.candidato.Nombres,
            "apellidos": p.candidato.Apellidos,
            "correo": p.candidato.usuario.Correo,
            "telefono": p.candidato.Telefono,
            "fotoUrl": p.candidato.FotoUrl,
            "estado": p.estado.Nombre,
            "fechaPostulacion": p.FechaPostulacion,
        }
        for p in postulaciones
    ]

@app.get("/api/empresa/{id_empresa}/ofertas/estados")
def contar_ofertas_por_estado(
    id_empresa: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_empresa(usuario, id_empresa)
    total = db.query(Oferta).filter(Oferta.IdEmpresa == id_empresa).count()

    # Una sola query para todos los estados
    estados = {e.Nombre: e.IdEstadoOferta for e in db.query(EstadoOferta).all()}
    requeridos = {"Publicada", "Por aprobar", "Pausada", "Cerrada", "Rechazada"}
    faltantes = requeridos - estados.keys()
    if faltantes:
        raise HTTPException(500, f"Faltan estados de oferta en la base de datos: {faltantes}")

    def cuenta(nombre: str) -> int:
        return (
            db.query(Oferta)
            .filter(
                Oferta.IdEmpresa == id_empresa,
                Oferta.IdEstadoOferta == estados[nombre],
            )
            .count()
        )

    return {
        "total": total,
        "activas": cuenta("Publicada"),
        "en_revision": cuenta("Por aprobar"),
        "pausadas": cuenta("Pausada"),
        "cerradas": cuenta("Cerrada"),
        "rechazadas": cuenta("Rechazada"),  # ⬅️ NUEVO
    }

@app.patch("/api/empresa/ofertas/{id_oferta}/estado")
def cambiar_estado_oferta_empresa(
    id_oferta: int,
    body: dict,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    oferta = db.query(Oferta).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta:
        raise HTTPException(404, "Oferta no encontrada")
    _verificar_ownership_empresa(usuario, oferta.IdEmpresa)

    nuevo_estado_nombre = body.get("nuevoEstado")
    if not nuevo_estado_nombre:
        raise HTTPException(400, "Falta 'nuevoEstado'.")

    # Transiciones permitidas SOLO para la empresa (el admin aprueba/publica)
    TRANSICIONES_EMPRESA = {
        "Publicada": {"Pausada", "Cerrada"},
        "Pausada":   {"Cerrada"},
    }

    estado_actual = oferta.estado.Nombre if oferta.estado else None
    permitidos = TRANSICIONES_EMPRESA.get(estado_actual, set())

    if nuevo_estado_nombre not in permitidos:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"No puedes cambiar una oferta de '{estado_actual}' "
                f"a '{nuevo_estado_nombre}'. "
                f"La publicación de ofertas requiere aprobación del administrador."
            ),
        )

    nuevo_estado = (
        db.query(EstadoOferta)
        .filter(EstadoOferta.Nombre == nuevo_estado_nombre)
        .first()
    )
    if not nuevo_estado:
        raise HTTPException(400, f"Estado '{nuevo_estado_nombre}' no encontrado.")

    oferta.IdEstadoOferta = nuevo_estado.IdEstadoOferta
    db.commit()
    return {"idOferta": oferta.IdOferta, "estado": nuevo_estado_nombre}


@app.patch("/api/empresa/postulaciones/{id_postulacion}/estado")
def cambiar_estado_postulacion_empresa(
    id_postulacion: int,
    body: dict,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    if not usuario.empresa:
        raise HTTPException(403, "Solo las empresas pueden hacer esto.")

    postulacion = (
        db.query(Postulacion)
        .options(
            joinedload(Postulacion.oferta).joinedload(Oferta.empresa),
            joinedload(Postulacion.candidato),
        )
        .filter(Postulacion.IdPostulacion == id_postulacion)
        .first()
    )
    if not postulacion:
        raise HTTPException(404, "Postulación no encontrada.")

    if postulacion.oferta.IdEmpresa != usuario.empresa.IdEmpresa:
        raise HTTPException(403, "No tienes permiso para modificar esta postulación.")

    ESTADOS_PERMITIDOS_EMPRESA = {
        "En revisión", "Entrevista", "Preseleccionado",
        "Contratado", "Rechazado", "Prueba Técnica"
    }
    nuevo_estado_nombre = body.get("nuevoEstado")
    if nuevo_estado_nombre not in ESTADOS_PERMITIDOS_EMPRESA:
        raise HTTPException(400, f"Estado no permitido: {nuevo_estado_nombre}")

    nuevo_estado = (
        db.query(EstadoPostulacion)
        .filter(EstadoPostulacion.Nombre == nuevo_estado_nombre)
        .first()
    )
    if not nuevo_estado:
        raise HTTPException(400, f"Estado '{nuevo_estado_nombre}' no encontrado.")

    estado_anterior = postulacion.IdEstadoPostulacion
    postulacion.IdEstadoPostulacion = nuevo_estado.IdEstadoPostulacion

    if estado_anterior != nuevo_estado.IdEstadoPostulacion:
        from notificaciones import crear_notificacion, TIPO_SISTEMA
        crear_notificacion(
            db,
            titulo="Actualización de postulación",
            mensaje=f"Tu postulación a {postulacion.oferta.Titulo} cambió a: {nuevo_estado_nombre}",
            tipo=TIPO_SISTEMA,
            id_candidato=postulacion.IdCandidato,
        )

    db.commit()

    return {
        "idPostulacion": postulacion.IdPostulacion,
        "estado": nuevo_estado_nombre,
    }


# ============================================================
# OFERTAS
# ============================================================
@app.get("/api/ofertas/{id_oferta}")
def obtener_oferta(id_oferta: int, db: Session = Depends(get_db)):
    oferta = (
        db.query(Oferta)
        .options(
            joinedload(Oferta.empresa),
            joinedload(Oferta.modalidad),
            joinedload(Oferta.municipio),
            joinedload(Oferta.categoria),
        )
        .filter(Oferta.IdOferta == id_oferta)
        .first()
    )
    if not oferta:
        raise HTTPException(404, "Oferta no encontrada")
    return {
        "idOferta": oferta.IdOferta,
        "titulo": oferta.Titulo,
        "descripcion": oferta.Descripcion,
        "ciudad": oferta.municipio.Nombre,
        "modalidad": oferta.modalidad.Nombre,
    }


@app.put("/api/ofertas/{id_oferta}")
def actualizar_oferta(
    id_oferta: int,
    body: dict,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    oferta = db.query(Oferta).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta:
        raise HTTPException(404, "Oferta no encontrada")
    _verificar_ownership_empresa(usuario, oferta.IdEmpresa)

    if body.get("titulo"):
        oferta.Titulo = body["titulo"]
    if body.get("descripcion"):
        oferta.Descripcion = body["descripcion"]
    if body.get("ciudad"):
        municipio = _buscar_municipio(db, body["ciudad"])
        oferta.IdMunicipio = municipio.IdMunicipio
    if body.get("modalidad"):
        modalidad = db.query(Modalidad).filter(func.lower(Modalidad.Nombre) == body["modalidad"].strip().lower()).first()
        if modalidad:
            oferta.IdModalidad = modalidad.IdModalidad

    db.commit()
    db.refresh(oferta)
    return {"message": "Oferta actualizada correctamente"}


@app.get("/api/empresa/{id_empresa}/ofertas")
def listar_ofertas_de_empresa(
    id_empresa: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_empresa(usuario, id_empresa)
    ofertas = (
        db.query(Oferta)
        .options(
            joinedload(Oferta.empresa),
            joinedload(Oferta.modalidad),
            joinedload(Oferta.municipio),
            joinedload(Oferta.categoria),
        )
        .filter(Oferta.IdEmpresa == id_empresa)
        .order_by(Oferta.FechaPublicacion.desc())
        .all()
    )

    oferta_ids = [o.IdOferta for o in ofertas]
    conteo_map: dict[int, int] = {}
    if oferta_ids:
        filas = (
            db.query(Postulacion.IdOferta, func.count(Postulacion.IdPostulacion)) # pylint: disable=not-callable
            .filter(Postulacion.IdOferta.in_(oferta_ids))
            .group_by(Postulacion.IdOferta)
            .all()
        )
        conteo_map = {id_oferta: total for id_oferta, total in filas}

    return [
        {
            "idOferta": o.IdOferta,
            "titulo": o.Titulo,
            "empresa": o.empresa.NombreEmpresa,
            "ciudad": o.municipio.Nombre,
            "modalidad": o.modalidad.Nombre,
            "categoria": o.categoria.Nombre,
            "estado": o.estado.Nombre,
            "fechaPublicacion": o.FechaPublicacion,
            "totalPostulaciones": conteo_map.get(o.IdOferta, 0),
        }
        for o in ofertas
    ]


@app.post("/api/ofertas")
def crear_oferta(
    body: dict,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    if not usuario.empresa:
        raise HTTPException(403, "Solo las empresas pueden crear ofertas.")

    empresa = usuario.empresa

    # ⬇️ AHORA LEEMOS DEL BODY EN VEZ DE HARDCODEAR ⬇️
    modalidad_nombre = body.get("modalidad", "Presencial")
    categoria_nombre = body.get("categoria", "Desarrollo de Software")
    contrato_nombre = body.get("tipoContrato", "Término Indefinido")
    jornada_nombre = body.get("jornada", "Tiempo Completo")

    modalidad = db.query(Modalidad).filter(func.lower(Modalidad.Nombre) == modalidad_nombre.strip().lower()).first()
    categoria = db.query(CategoriaOferta).filter(func.lower(CategoriaOferta.Nombre) == categoria_nombre.strip().lower()).first()
    tipo_contrato = db.query(TipoContrato).filter(func.lower(TipoContrato.Nombre) == contrato_nombre.strip().lower()).first()
    jornada = db.query(JornadaLaboral).filter(func.lower(JornadaLaboral.Nombre) == jornada_nombre.strip().lower()).first()

    if not modalidad:
        raise HTTPException(400, f"Modalidad '{modalidad_nombre}' no encontrada")
    if not categoria:
        raise HTTPException(400, f"Categoría '{categoria_nombre}' no encontrada")
    if not tipo_contrato:
        raise HTTPException(400, f"Tipo de contrato '{contrato_nombre}' no encontrado")
    if not jornada:
        raise HTTPException(400, f"Jornada '{jornada_nombre}' no encontrada")

    municipio = _buscar_municipio(db, body.get("ciudad", "Medellín"))
    
    # ⬇️ CAMBIAR A "POR APROBAR" EN VEZ DE "PUBLICADA" ⬇️
    estado = db.query(EstadoOferta).filter(EstadoOferta.Nombre == "Por aprobar").first()
    if not estado:
        raise HTTPException(500, "Falta el estado 'Por aprobar' en la base de datos")

    oferta = Oferta(
        IdEmpresa=empresa.IdEmpresa,
        IdCategoria=categoria.IdCategoria,
        IdTipoContrato=tipo_contrato.IdTipoContrato,
        IdModalidad=modalidad.IdModalidad,
        IdJornada=jornada.IdJornada,
        IdEstadoOferta=estado.IdEstadoOferta,
        IdMunicipio=municipio.IdMunicipio,
        Titulo=body.get("titulo", ""),
        Descripcion=body.get("descripcion", ""),
        Vacantes=body.get("vacantes", 1),
        ExperienciaMinima=body.get("experienciaMinima", 0),
    )
    db.add(oferta)
    db.commit()
    db.refresh(oferta)

    return {
        "idOferta": oferta.IdOferta,
        "titulo": oferta.Titulo,
        "ciudad": municipio.Nombre,
        "modalidad": modalidad.Nombre,
        "estado": estado.Nombre
    }

# ============================================================
# VACANTES (público)
# ============================================================
@app.get("/api/vacantes", response_model=list[OfertaOut])
def listar_vacantes(
    q: str | None = None,
    modalidad: str | None = None,
    ciudad: str | None = None,
    categoria: str | None = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(Oferta)
        .join(EstadoOferta)
        .join(Empresa)
        .options(
            joinedload(Oferta.empresa),
            joinedload(Oferta.modalidad),
            joinedload(Oferta.municipio),
            joinedload(Oferta.categoria),
            joinedload(Oferta.tipo_contrato),
        )
        .filter(EstadoOferta.Nombre == "Publicada")
    )

    if q:
        like = f"%{q}%"
        query = query.filter(or_(Oferta.Titulo.ilike(like), Empresa.NombreEmpresa.ilike(like)))
    if modalidad:
        query = query.join(Modalidad).filter(Modalidad.Nombre == modalidad)
    if ciudad:
        query = query.join(Municipio).filter(Municipio.Nombre == ciudad)
    if categoria:
        query = query.join(CategoriaOferta).filter(CategoriaOferta.Nombre == categoria)

    ofertas = query.order_by(Oferta.FechaPublicacion.desc()).all()

    return [
        OfertaOut(
            idOferta=o.IdOferta,
            idEmpresa=o.empresa.IdEmpresa,
            titulo=o.Titulo,
            empresa=o.empresa.NombreEmpresa,
            ciudad=o.municipio.Nombre,
            modalidad=o.modalidad.Nombre,
            categoria=o.categoria.Nombre,
            tipoContrato=o.tipo_contrato.Nombre,
            descripcion=o.Descripcion,
            experienciaMinima=o.ExperienciaMinima,
            fechaPublicacion=o.FechaPublicacion,
        )
        for o in ofertas
    ]


# ============================================================
# POSTULACIONES
# ============================================================
@app.post("/api/postulaciones")
def crear_postulacion(
    body: dict,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    if not usuario.candidato:
        raise HTTPException(403, "Solo los candidatos pueden postularse.")

    candidato = usuario.candidato
    id_oferta = body.get("idOferta")
    if not id_oferta:
        raise HTTPException(400, "Falta idOferta")

    oferta = (
        db.query(Oferta)
        .options(joinedload(Oferta.empresa))
        .filter(Oferta.IdOferta == id_oferta)
        .first()
    )
    if not oferta:
        raise HTTPException(404, "Oferta no encontrada")

    existente = db.query(Postulacion).filter(
        Postulacion.IdOferta == id_oferta,
        Postulacion.IdCandidato == candidato.IdCandidato,
    ).first()
    if existente:
        raise HTTPException(400, "Ya te postulaste a esta oferta.")

    estado_inicial = db.query(EstadoPostulacion).filter(EstadoPostulacion.Nombre == "Postulado").first()
    if not estado_inicial:
        raise HTTPException(500, "Falta el estado 'Postulado' en la base de datos")

    postulacion = Postulacion(
        IdOferta=id_oferta,
        IdCandidato=candidato.IdCandidato,
        IdEstadoPostulacion=estado_inicial.IdEstadoPostulacion,
        Vista=False,
    )
    db.add(postulacion)
    db.flush()

    from notificaciones import crear_notificacion, TIPO_NUEVA_POSTULACION
    crear_notificacion(
        db,
        titulo="Nueva postulación",
        mensaje=f"{candidato.Nombres} {candidato.Apellidos} se postuló a {oferta.Titulo}",
        tipo=TIPO_NUEVA_POSTULACION,
        id_empresa=oferta.IdEmpresa,
    )

    db.commit()
    db.refresh(postulacion)

    return {
        "idPostulacion": postulacion.IdPostulacion,
        "idOferta": id_oferta,
        "idCandidato": candidato.IdCandidato,
        "estado": estado_inicial.Nombre,
    }


@app.get("/api/candidato/{id_candidato}/postulaciones", response_model=list[PostulacionOut])
def listar_postulaciones_candidato(
    id_candidato: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    postulaciones = (
        db.query(Postulacion)
        .options(
            joinedload(Postulacion.oferta).joinedload(Oferta.empresa),
            joinedload(Postulacion.oferta).joinedload(Oferta.municipio),
            joinedload(Postulacion.oferta).joinedload(Oferta.modalidad),
            joinedload(Postulacion.estado),
        )
        .filter(Postulacion.IdCandidato == id_candidato)
        .order_by(Postulacion.FechaPostulacion.desc())
        .all()
    )
    return [
        PostulacionOut(
            idPostulacion=p.IdPostulacion,
            idOferta=p.oferta.IdOferta,
            idCandidato=id_candidato,
            titulo=p.oferta.Titulo,
            empresa=p.oferta.empresa.NombreEmpresa,
            ciudad=p.oferta.municipio.Nombre,
            modalidad=p.oferta.modalidad.Nombre,
            estado=p.estado.Nombre,
            vista=p.Vista,
            fechaPostulacion=p.FechaPostulacion,
             categoria=p.oferta.categoria.Nombre  
        )
        for p in postulaciones
    ]


@app.put("/api/candidato/{id_candidato}/perfil/datos", response_model=PerfilOut)
def actualizar_datos_perfil(
    id_candidato: int,
    body: PerfilDatosIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    if body.nombres is not None:
        candidato.Nombres = body.nombres
    if body.apellidos is not None:
        candidato.Apellidos = body.apellidos
    if body.tituloProfesional is not None:
        candidato.TituloProfesional = body.tituloProfesional
    if body.telefono is not None:
        candidato.Telefono = body.telefono
    if body.fechaNacimiento is not None:
        candidato.FechaNacimiento = body.fechaNacimiento
    if body.correo and body.correo != candidato.usuario.Correo:
        if db.query(Usuario).filter(Usuario.Correo == body.correo, Usuario.IdUsuario != candidato.IdUsuario).first():
            raise HTTPException(400, "Ese correo ya está en uso por otra cuenta")
        candidato.usuario.Correo = body.correo
    if body.ciudad:
        candidato.IdMunicipio = _buscar_municipio(db, body.ciudad).IdMunicipio
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/perfil/preferencias", response_model=PerfilOut)
def actualizar_preferencias(
    id_candidato: int,
    body: PreferenciasIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    if body.areaInteres is not None:
        candidato.AreaInteres = body.areaInteres
    if body.salarioEsperado is not None:
        candidato.SalarioEsperado = body.salarioEsperado
    if body.movilidad is not None:
        candidato.Movilidad = body.movilidad
    if body.tipoContratoPreferido:
        tipo = _buscar_en_catalogo(db, TipoContrato, "Nombre", body.tipoContratoPreferido, "Tipo de contrato")
        candidato.IdTipoContratoPreferido = tipo.IdTipoContrato
    if body.jornadaPreferida:
        jornada = _buscar_en_catalogo(db, JornadaLaboral, "Nombre", body.jornadaPreferida, "Jornada")
        candidato.IdJornadaPreferida = jornada.IdJornada
    if body.modalidadPreferida:
        modalidad = _buscar_en_catalogo(db, Modalidad, "Nombre", body.modalidadPreferida, "Modalidad")
        candidato.IdModalidad = modalidad.IdModalidad
    elif body.idModalidad is not None:
        candidato.IdModalidad = body.idModalidad
    if body.disponibilidad:
        disponibilidad = _buscar_en_catalogo(db, Disponibilidad, "Nombre", body.disponibilidad, "Disponibilidad")
        candidato.IdDisponibilidad = disponibilidad.IdDisponibilidad
    elif body.idDisponibilidad is not None:
        candidato.IdDisponibilidad = body.idDisponibilidad
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/sobre-mi", response_model=PerfilOut)
def actualizar_sobre_mi(
    id_candidato: int,
    body: SobreMiIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.AcercaDe = body.about
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/foto", response_model=PerfilOut)
def actualizar_foto(
    id_candidato: int,
    body: FotoIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.FotoUrl = body.fotoUrl
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.get("/api/candidato/{id_candidato}/cv/habilidades", response_model=list[HabilidadOut])
def obtener_habilidades(
    id_candidato: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    return db.query(CandidatoHabilidad).filter(CandidatoHabilidad.IdCandidato == id_candidato).all()


@app.put("/api/candidato/{id_candidato}/cv/habilidades", response_model=PerfilOut)
def actualizar_habilidades(
    id_candidato: int,
    body: HabilidadesIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    _obtener_candidato_completo(id_candidato, db)
    db.query(CandidatoHabilidad).filter(CandidatoHabilidad.IdCandidato == id_candidato).delete()
    for nombre in body.habilidades:
        db.add(CandidatoHabilidad(IdCandidato=id_candidato, Nombre=nombre.strip()))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/educacion", response_model=PerfilOut)
def crear_educacion(
    id_candidato: int,
    body: EducacionIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    _obtener_candidato_completo(id_candidato, db)
    db.add(CandidatoEducacion(
        IdCandidato=id_candidato,
        Titulo=body.titulo,
        Institucion=body.institucion,
        Anio=body.anio,
    ))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.delete("/api/candidato/{id_candidato}/cv/educacion/{id_educacion}", response_model=PerfilOut)
def eliminar_educacion(
    id_candidato: int,
    id_educacion: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    educacion = db.query(CandidatoEducacion).filter(
        CandidatoEducacion.IdEducacion == id_educacion,
        CandidatoEducacion.IdCandidato == id_candidato,  # ⬅️ AÑADIDO
    ).first()
    if not educacion:
        raise HTTPException(404, "Educación no encontrada")
    db.delete(educacion)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/educacion/{id_educacion}", response_model=PerfilOut)
def actualizar_educacion(
    id_candidato: int,
    id_educacion: int,
    body: EducacionIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    _obtener_candidato_completo(id_candidato, db)
    educacion = db.query(CandidatoEducacion).filter(
        CandidatoEducacion.IdEducacion == id_educacion,
        CandidatoEducacion.IdCandidato == id_candidato,
    ).first()
    if not educacion:
        raise HTTPException(404, "Educación no encontrada")
    educacion.Titulo = body.titulo
    educacion.Institucion = body.institucion
    educacion.Anio = body.anio
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/proyectos", response_model=PerfilOut)
def crear_proyecto(
    id_candidato: int,
    body: ProyectoIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    _obtener_candidato_completo(id_candidato, db)
    db.add(CandidatoProyecto(
        IdCandidato=id_candidato,
        Titulo=body.titulo,
        Descripcion=body.descripcion,
        Meta=body.meta,
    ))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.delete("/api/candidato/{id_candidato}/cv/proyectos/{id_proyecto}", response_model=PerfilOut)
def eliminar_proyecto(
    id_candidato: int,
    id_proyecto: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    proyecto = db.query(CandidatoProyecto).filter(
        CandidatoProyecto.IdProyecto == id_proyecto,
        CandidatoProyecto.IdCandidato == id_candidato,  # ⬅️ AÑADIDO
    ).first()
    if not proyecto:
        raise HTTPException(404, "Proyecto no encontrado")
    db.delete(proyecto)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@app.put("/api/candidato/{id_candidato}/cv/proyectos/{id_proyecto}", response_model=PerfilOut)
def actualizar_proyecto(
    id_candidato: int,
    id_proyecto: int,
    body: ProyectoIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    _obtener_candidato_completo(id_candidato, db)
    proyecto = db.query(CandidatoProyecto).filter(
        CandidatoProyecto.IdProyecto == id_proyecto,
        CandidatoProyecto.IdCandidato == id_candidato,
    ).first()
    if not proyecto:
        raise HTTPException(404, "Proyecto no encontrado")
    proyecto.Titulo = body.titulo
    proyecto.Descripcion = body.descripcion
    proyecto.Meta = body.meta
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/idiomas", response_model=PerfilOut)
def crear_idioma(
    id_candidato: int,
    body: IdiomaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    _obtener_candidato_completo(id_candidato, db)
    db.add(CandidatoIdioma(IdCandidato=id_candidato, Descripcion=body.descripcion))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.delete("/api/candidato/{id_candidato}/cv/idiomas/{id_idioma}", response_model=PerfilOut)
def eliminar_idioma(
    id_candidato: int,
    id_idioma: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    idioma = db.query(CandidatoIdioma).filter(
        CandidatoIdioma.IdIdioma == id_idioma,
        CandidatoIdioma.IdCandidato == id_candidato,  # ⬅️ AÑADIDO
    ).first()
    if not idioma:
        raise HTTPException(404, "Idioma no encontrado")
    db.delete(idioma)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/idiomas/{id_idioma}", response_model=PerfilOut)
def actualizar_idioma(
    id_candidato: int,
    id_idioma: int,
    body: IdiomaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    _obtener_candidato_completo(id_candidato, db)
    idioma = db.query(CandidatoIdioma).filter(
        CandidatoIdioma.IdIdioma == id_idioma,
        CandidatoIdioma.IdCandidato == id_candidato,
    ).first()
    if not idioma:
        raise HTTPException(404, "Idioma no encontrado")
    idioma.Descripcion = body.descripcion
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.get("/api/candidato/{id_candidato}/cv", response_model=PerfilOut)
def obtener_cv(
    id_candidato: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    return _armar_perfil(candidato)


@app.put("/api/candidato/{id_candidato}/cv/datos-personales", response_model=PerfilOut)
def actualizar_datos_personales_cv(
    id_candidato: int,
    body: DatosPersonalesIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.Nombres = body.nombres
    candidato.Apellidos = body.apellidos
    candidato.TituloProfesional = body.tituloProfesional
    candidato.Telefono = body.telefono
    if body.correo and body.correo != candidato.usuario.Correo:
        if db.query(Usuario).filter(Usuario.Correo == body.correo, Usuario.IdUsuario != candidato.IdUsuario).first():
            raise HTTPException(400, "Ese correo ya está en uso por otra cuenta")
        candidato.usuario.Correo = body.correo
    if body.ciudad:
        candidato.IdMunicipio = _buscar_municipio(db, body.ciudad).IdMunicipio
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/plantilla", response_model=PerfilOut)
def actualizar_plantilla(
    id_candidato: int,
    body: PlantillaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.PlantillaCV = body.plantilla
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/referencias", response_model=PerfilOut)
def crear_referencia(
    id_candidato: int,
    body: ReferenciaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    _obtener_candidato_completo(id_candidato, db)
    db.add(CandidatoReferencia(
        IdCandidato=id_candidato,
        Nombre=body.nombre,
        Cargo=body.cargo,
        Contacto=body.contacto,
    ))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.delete("/api/candidato/{id_candidato}/cv/referencias/{id_referencia}", response_model=PerfilOut)
def eliminar_referencia(
    id_candidato: int,
    id_referencia: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    referencia = db.query(CandidatoReferencia).filter(
        CandidatoReferencia.IdReferencia == id_referencia,
        CandidatoReferencia.IdCandidato == id_candidato,  # ⬅️ AÑADIDO
    ).first()
    if not referencia:
        raise HTTPException(404, "Referencia no encontrada")
    db.delete(referencia)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/referencias/{id_referencia}", response_model=PerfilOut)
def actualizar_referencia(
    id_candidato: int,
    id_referencia: int,
    body: ReferenciaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    _obtener_candidato_completo(id_candidato, db)
    referencia = db.query(CandidatoReferencia).filter(
        CandidatoReferencia.IdReferencia == id_referencia,
        CandidatoReferencia.IdCandidato == id_candidato,
    ).first()
    if not referencia:
        raise HTTPException(404, "Referencia no encontrada")
    referencia.Nombre = body.nombre
    referencia.Cargo = body.cargo
    referencia.Contacto = body.contacto
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/secciones", response_model=PerfilOut)
def crear_seccion(
    id_candidato: int,
    body: SeccionCVIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    siguiente_orden = len(candidato.secciones_cv or []) + 1
    db.add(CandidatoSeccionCV(
        IdCandidato=id_candidato,
        Titulo=body.titulo,
        Contenido=body.contenido,
        Orden=siguiente_orden,
    ))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/secciones/{id_seccion}", response_model=PerfilOut)
def actualizar_seccion(
    id_candidato: int,
    id_seccion: int,
    body: SeccionCVUpdateIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    _obtener_candidato_completo(id_candidato, db)
    seccion = db.query(CandidatoSeccionCV).filter(
        CandidatoSeccionCV.IdSeccion == id_seccion,
        CandidatoSeccionCV.IdCandidato == id_candidato,
    ).first()
    if not seccion:
        raise HTTPException(404, "Sección no encontrada")
    if body.titulo is not None:
        seccion.Titulo = body.titulo
    if body.contenido is not None:
        seccion.Contenido = body.contenido
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.delete("/api/candidato/{id_candidato}/cv/secciones/{id_seccion}", response_model=PerfilOut)
def eliminar_seccion(
    id_candidato: int,
    id_seccion: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    seccion = db.query(CandidatoSeccionCV).filter(
        CandidatoSeccionCV.IdSeccion == id_seccion,
        CandidatoSeccionCV.IdCandidato == id_candidato,  # ⬅️ AÑADIDO
    ).first()
    if not seccion:
        raise HTTPException(404, "Sección no encontrada")
    db.delete(seccion)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.get("/api/candidato/{id_candidato}/notificaciones")
def obtener_notificaciones_candidato(
    id_candidato: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    notificaciones = (
        db.query(Notificacion)
        .filter(
            (Notificacion.IdCandidato == id_candidato) |
            (Notificacion.IdCandidato == None)  # noqa: E711
        )
        .order_by(Notificacion.Fecha.desc())
        .all()
    )
    return [
        {
            "idNotificacion": n.IdNotificacion,
            "titulo": n.Titulo,
            "mensaje": n.Mensaje,
            "leida": n.Leida,
            "fecha": n.Fecha,
        }
        for n in notificaciones
    ]


@app.patch("/api/candidato/{id_candidato}/notificaciones/{id_notificacion}/leer")
def marcar_notificacion_leida_candidato(
    id_candidato: int,
    id_notificacion: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    noti = (
        db.query(Notificacion)
        .filter(
            Notificacion.IdNotificacion == id_notificacion,
            Notificacion.IdCandidato == id_candidato,
        )
        .first()
    )
    if not noti:
        raise HTTPException(404, "Notificación no encontrada.")
    noti.Leida = True
    db.commit()
    return {"idNotificacion": noti.IdNotificacion, "leida": True}


@app.patch("/api/candidato/{id_candidato}/notificaciones/leer-todas")
def marcar_todas_leidas_candidato(
    id_candidato: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_candidato(usuario, id_candidato)
    actualizadas = (
        db.query(Notificacion)
        .filter(
            Notificacion.IdCandidato == id_candidato,
            Notificacion.Leida == False,  # noqa: E712
        )
        .update({"Leida": True})
    )
    db.commit()
    return {"actualizadas": actualizadas}


# ============================================================
# ADMINISTRADOR
# ============================================================
ESTADOS_PERMITIDOS = {"Publicada", "Rechazada", "Pausada"}


@app.get("/api/admin/vacantes")
def listar_vacantes_admin(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role("Administrador")),
):
    ofertas = (
        db.query(Oferta)
        .options(joinedload(Oferta.empresa), joinedload(Oferta.modalidad),
                 joinedload(Oferta.municipio), joinedload(Oferta.estado))
        .order_by(Oferta.FechaPublicacion.desc())
        .all()
    )
    return [
        {
            "idOferta": o.IdOferta,
            "titulo": o.Titulo,
            "empresa": o.empresa.NombreEmpresa,
            "ciudad": o.municipio.Nombre,
            "modalidad": o.modalidad.Nombre,
            "estado": o.estado.Nombre,
            "fechaPublicacion": o.FechaPublicacion,
        }
        for o in ofertas
    ]

@app.patch("/api/admin/vacantes/{id_oferta}/estado")
def cambiar_estado_vacante(
    id_oferta: int,
    body: dict,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role("Administrador")),
):
    nuevo_estado_nombre = body.get("nuevoEstado")
    if nuevo_estado_nombre not in ESTADOS_PERMITIDOS:
        raise HTTPException(400, f"Estado no permitido: {nuevo_estado_nombre}")

    oferta = (
        db.query(Oferta)
        .options(joinedload(Oferta.empresa))
        .filter(Oferta.IdOferta == id_oferta)
        .first()
    )
    if not oferta:
        raise HTTPException(404, "Vacante no encontrada")

    nuevo_estado = db.query(EstadoOferta).filter(EstadoOferta.Nombre == nuevo_estado_nombre).first()
    oferta.IdEstadoOferta = nuevo_estado.IdEstadoOferta

    from notificaciones import crear_notificacion, TIPO_SISTEMA
    verbo = {
        "Publicada": "aprobada y publicada",
        "Rechazada": "rechazada",
        "Pausada": "pausada",
    }.get(nuevo_estado_nombre, "actualizada")

    crear_notificacion(
        db,
        titulo=f"Oferta {verbo}",
        mensaje=f"Tu oferta '{oferta.Titulo}' fue {verbo} por el administrador.",
        tipo=TIPO_SISTEMA,
        id_empresa=oferta.IdEmpresa,
    )

    db.commit()
    return {"idOferta": oferta.IdOferta, "estado": nuevo_estado_nombre}


@app.get("/api/empresa/{id_empresa}/notificaciones")
def obtener_notificaciones_empresa(
    id_empresa: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_empresa(usuario, id_empresa)
    notificaciones = (
        db.query(Notificacion)
        .filter(
            (Notificacion.IdEmpresa == id_empresa) |
            (Notificacion.IdEmpresa == None)  # noqa: E711
        )
        .order_by(Notificacion.Fecha.desc())
        .all()
    )
    return [
        {
            "idNotificacion": n.IdNotificacion,
            "titulo": n.Titulo,
            "mensaje": n.Mensaje,
            "leida": n.Leida,
            "fecha": n.Fecha,
        }
        for n in notificaciones
    ]

@app.patch("/api/empresa/{id_empresa}/notificaciones/{id_notificacion}/leer")
def marcar_notificacion_leida(
    id_empresa: int,
    id_notificacion: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_empresa(usuario, id_empresa)

    noti = (
        db.query(Notificacion)
        .filter(
            Notificacion.IdNotificacion == id_notificacion,
            Notificacion.IdEmpresa == id_empresa,
        )
        .first()
    )
    if not noti:
        raise HTTPException(404, "Notificación no encontrada.")

    noti.Leida = True
    db.commit()
    return {"idNotificacion": noti.IdNotificacion, "leida": True}


@app.patch("/api/empresa/{id_empresa}/notificaciones/leer-todas")
def marcar_todas_leidas(
    id_empresa: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_empresa(usuario, id_empresa)

    actualizadas = (
        db.query(Notificacion)
        .filter(
            Notificacion.IdEmpresa == id_empresa,
            Notificacion.Leida == False,  # noqa: E712
        )
        .update({"Leida": True})
    )
    db.commit()
    return {"actualizadas": actualizadas}

@app.get("/api/empresa/{id_empresa}/resumen")
def obtener_resumen_empresa(
    id_empresa: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    _verificar_ownership_empresa(usuario, id_empresa)
    ofertas = db.query(Oferta).filter(Oferta.IdEmpresa == id_empresa).all()
    oferta_ids = [o.IdOferta for o in ofertas]

    postulaciones = db.query(Postulacion).filter(Postulacion.IdOferta.in_(oferta_ids)).all()

    estados = db.query(EstadoPostulacion).all()
    estado_nombres = {e.IdEstadoPostulacion: e.Nombre for e in estados}

    nuevos_candidatos = len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) == "Postulado"])
    candidatos_recomendados = len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) in ["En revisión", "Preseleccionado"]])
    entrevistas = len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) == "Entrevista"])
    vacantes_por_vencer = len([o for o in ofertas if o.FechaCierre is not None])
    rendimiento = len([o for o in ofertas if o.IdEstadoOferta == 1])

    return {
        "nuevosCandidatos": nuevos_candidatos,
        "candidatosRecomendados": candidatos_recomendados,
        "entrevistas": entrevistas,
        "vacantesPorVencer": vacantes_por_vencer,
        "rendimiento": rendimiento,
    }


@app.delete("/api/postulaciones/{id_postulacion}")
def eliminar_postulacion(
    id_postulacion: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    postulacion = db.query(Postulacion).filter(Postulacion.IdPostulacion == id_postulacion).first()
    if not postulacion:
        raise HTTPException(404, "Postulación no encontrada")

    es_admin = usuario.rol and usuario.rol.Nombre == "Administrador"
    es_dueno = usuario.candidato and usuario.candidato.IdCandidato == postulacion.IdCandidato

    if not (es_admin or es_dueno):
        raise HTTPException(403, "No tienes permiso.")

    db.delete(postulacion)
    db.commit()
    return {"message": "Postulación eliminada"}

@app.get("/api/candidato/busquedas-guardadas")
def obtener_busquedas_guardadas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    categorias = db.query(CategoriaOferta).all()
    busquedas = []
    for categoria in categorias:
        total = (
            db.query(Oferta)
            .filter(
                Oferta.IdCategoria == categoria.IdCategoria,
                Oferta.IdEstadoOferta == 1,
            )
            .count()
        )
        busquedas.append({"titulo": categoria.Nombre, "total": total})
    return busquedas


@app.get("/api/municipios/")
def obtener_municipios(db: Session = Depends(get_db)):
    return db.query(Municipio).all()


@app.get("/api/roles/")
def obtener_roles(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role("Administrador")),
):
    return db.query(Rol).all()

# ============================================================
# SIMULADOR DE ENTREVISTAS CON IA (Groq)
# ============================================================
PROMPT_EVALUACION = """
Eres un reclutador experto y coach de entrevistas. Evalúa la respuesta de un candidato para el puesto de **{cargo}**.

**Pregunta de la entrevista:**
{pregunta}

**Respuesta del candidato (transcrita o escrita):**
{respuesta}

**Instrucciones de Evaluación:**
1. **Análisis de Contenido:** Evalúa la relevancia, profundidad y estructura. ¿Usa el método STAR (Situación, Tarea, Acción, Resultado)? ¿Menciona resultados concretos?
2. **Análisis de Expresión:**
   - Si la respuesta fue **por voz** (transcripción): analiza si hay muletillas (eh, este, o sea), fluidez y claridad de ideas. Ignora errores menores de transcripción.
   - Si la respuesta fue **escrita**: evalúa claridad, ortografía, gramática y estructura de las oraciones.
3. **Genera Retroalimentación:** Un consejo conciso y accionable (de 2 a 3 frases) que el candidato pueda aplicar en una entrevista real.

**Formato de Salida (JSON estricto):**
{{
  "fortalezas": ["Punto fuerte 1", "Punto fuerte 2"],
  "areas_de_mejora": ["Área de mejora 1", "Área de mejora 2"],
  "consejo_final": "Aquí va el consejo conciso y accionable.",
  "puntuacion_general": "Muy bueno | Bueno | Regular | Necesita mejorar"
}}
"""

@app.post("/api/simulador/evaluar")
@limiter.limit("10/hour") # ⬅️ MÁXIMO 10 EVALUACIONES POR HORA
async def evaluar_respuesta_simulador(
    request: Request, 
    cargo: str = Form(...),
    pregunta: str = Form(...),
    respuesta_texto: str = Form(None),
    archivo_audio: UploadFile = File(None),
    usuario: Usuario = Depends(get_current_user),
):
    if not respuesta_texto and not archivo_audio:
        raise HTTPException(400, "Debes enviar un texto o un archivo de audio.")

    texto_final_respuesta = respuesta_texto

    if archivo_audio:
        try:
            # Validar que el audio no sea mayor a 10MB para evitar saturación
            contenido = await archivo_audio.read()
            if len(contenido) > 10 * 1024 * 1024:
                raise HTTPException(413, "El archivo de audio es demasiado grande (máximo 10MB).")
            
            # Volvemos a empaquetar el audio para enviarlo a Groq
            # (Groq SDK acepta tuplas de (filename, bytes))
            audio_tuple = (archivo_audio.filename, contenido)
            
            transcripcion = groq_client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=audio_tuple,
                language="es",
                response_format="text",
            )
            texto_final_respuesta = transcripcion
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(500, f"Error en la transcripción: {str(e)}")

    try:
        respuesta_llm = groq_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": "Eres un coach de entrevistas experto. Siempre respondes en formato JSON válido."},
                {"role": "user", "content": PROMPT_EVALUACION.format(cargo=cargo, pregunta=pregunta, respuesta=texto_final_respuesta)},
            ],
            response_format={"type": "json_object"},
            temperature=0.5,
        )
        resultado = json.loads(respuesta_llm.choices[0].message.content)
        resultado["texto_transcrito"] = texto_final_respuesta
        return resultado
    except Exception as e:
        raise HTTPException(500, f"Error en la evaluación: {str(e)}")

# --- ENDPOINTS DE ADMINISTRADOR: USUARIOS ---
@app.get("/api/admin/usuarios")
def listar_usuarios_admin(db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    print("⚠️ EJECUTANDO NUEVA VERSIÓN DE LISTAR_USUARIOS ⚠️")
    usuarios = db.query(Usuario).filter(Usuario.IdRol != 1).all()
    resultado = []
    for u in usuarios:
        nombre = u.Correo  # ⬅️ MAYÚSCULA (así está en models.py)
        id_perfil = None
        if u.candidato: 
            nombre = f"{u.candidato.Nombres} {u.candidato.Apellidos}"
            id_perfil = u.candidato.IdCandidato
        elif u.empresa: 
            nombre = u.empresa.NombreEmpresa
            id_perfil = u.empresa.IdEmpresa
        
        estado_nombre = u.estado.Nombre if u.estado else "Activo"
        
        resultado.append({
            "idUsuario": u.IdUsuario,
            "idPerfil": id_perfil,
            "nombre": nombre,
            "correo": u.Correo,  # ⬅️ MAYÚSCULA
            "tipo": "candidato" if u.candidato else "empresa",
            "estado": estado_nombre,
            "fechaRegistro": str(u.FechaCreacion) if u.FechaCreacion else None
        })
    return resultado

@app.patch("/api/admin/usuarios/{id_usuario}/estado")
def cambiar_estado_usuario(id_usuario: int, body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    user = db.query(Usuario).filter(Usuario.IdUsuario == id_usuario).first()
    if not user: raise HTTPException(404, "Usuario no encontrado")

       # ⬇️ VALIDACIONES NUEVAS DE SEGURIDAD ⬇️
    if user.IdRol == 1:
        raise HTTPException(403, "No puedes suspender a otro Administrador.")
    if user.IdUsuario == usuario.IdUsuario:
        raise HTTPException(400, "No puedes suspender tu propia cuenta.")
    
    nuevo_estado_nombre = body.get("estado") # "Activo" o "Suspendido"
    estado = db.query(EstadoUsuario).filter(EstadoUsuario.Nombre == nuevo_estado_nombre).first()
    if not estado: raise HTTPException(400, "Estado no válido")
    
    user.IdEstadoUsuario = estado.IdEstadoUsuario
    db.commit()
    return {"message": "Estado actualizado"}

# --- ENDPOINTS DE REPORTES ---
@app.post("/api/reportes")
@limiter.limit("3/hour") # MÁXIMO 3 REPORTES POR HORA
def crear_reporte(
    request: Request,body: dict, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    
    # Permitimos que cualquier usuario logueado (Candidato) reporte
    nuevo = Reporte(
        IdUsuario=usuario.IdUsuario,
        IdOferta=body.get("idOferta"),
        Motivo=body.get("motivo", "Reporte general")
    )
    db.add(nuevo)
    db.commit()
    return {"message": "Reporte enviado"}

@app.get("/api/admin/reportes")
def listar_reportes_admin(db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    reportes = db.query(Reporte).order_by(Reporte.Fecha.desc()).all()
    return [{
        "idReporte": r.IdReporte,
        "reportadoPor": r.usuario.Correo,
        "motivo": r.Motivo,
        "estado": r.Estado,
        "oferta": r.oferta.Titulo if r.oferta else "Oferta eliminada"
    } for r in reportes]

@app.patch("/api/admin/reportes/{id_reporte}/resolver")
def resolver_reporte(id_reporte: int, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role("Administrador"))):
    rep = db.query(Reporte).filter(Reporte.IdReporte == id_reporte).first()
    if not rep: raise HTTPException(404, "No encontrado")
    rep.Estado = "Cerrado"
    db.commit()
    return {"message": "Reporte cerrado"}

    
# ============================================================
# Punto de entrada
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)