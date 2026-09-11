<<<<<<< HEAD
"""
Backend de SeedWork (FastAPI).

Incluye:
  - Registro de candidato / empresa (con contraseña hasheada de verdad)
  - Login
  - Obtener los datos de un candidato / empresa (para pintar el dashboard)
  - Moderación de vacantes del panel Administrador
  - Gestión completa del perfil y CV del candidato
"""
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
=======

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import get_db
from models import (
    Usuario, Rol, EstadoUsuario, Candidato, Empresa, Municipio, SectorEmpresa,
    Oferta, EstadoOferta, Modalidad, CategoriaOferta,
    Postulacion, EstadoPostulacion,
    TipoContrato, JornadaLaboral, Disponibilidad,
    CandidatoHabilidad, CandidatoEducacion, CandidatoProyecto, CandidatoIdioma,
<<<<<<< HEAD
    TipoNotificacion, Notificacion, Administrador,
    CandidatoReferencia, CandidatoSeccionCV,
=======
    TipoNotificacion, Notificacion
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
)
from schemas import (
    RegistroCandidatoIn, RegistroEmpresaIn, LoginIn,
    CandidatoOut, EmpresaOut,
    OfertaOut, PostulacionIn, PostulacionOut,
    PerfilOut, PerfilDatosIn, PreferenciasIn,
    HabilidadOut, EducacionOut, ProyectoOut, IdiomaOut,
<<<<<<< HEAD
    HabilidadesIn, EducacionIn, ProyectoIn, IdiomaIn
=======
    HabilidadesIn, EducacionIn, ProyectoIn, IdiomaIn,
    SobreMiIn, FotoIn
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
)
from security import hash_password, verify_password

app = FastAPI(title="SeedWork API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _dividir_nombre(nombre_completo: str):
    """RegistroCandidato/Empresa.html solo piden un campo 'Nombre completo'.
    Lo partimos en Nombres/Apellidos con una regla simple: la primera mitad
    de las palabras son nombres, el resto apellidos."""
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
    """Obtiene un candidato con todas sus relaciones cargadas."""
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
        )
        .filter(Candidato.IdCandidato == id_candidato)
        .first()
    )
    if not candidato:
        raise HTTPException(404, "Candidato no encontrado")
    return candidato


def _armar_perfil(candidato: Candidato) -> PerfilOut:
    """Arma el objeto PerfilOut a partir de un candidato."""
    return PerfilOut(
        idCandidato=candidato.IdCandidato,
        idUsuario=candidato.IdUsuario,
        nombres=candidato.Nombres,
        apellidos=candidato.Apellidos,
        tituloProfesional=candidato.TituloProfesional,
        correo=candidato.usuario.Correo,
        ciudad=candidato.municipio.Nombre if candidato.municipio else None,
        telefono=candidato.Telefono,
<<<<<<< HEAD
        fechaNacimiento=candidato.FechaNacimiento,
        about=candidato.AcercaDe,
        fotoUrl=candidato.FotoUrl,
        areaInteres=candidato.AreaInteres,
        salarioEsperado=float(candidato.SalarioEsperado) if candidato.SalarioEsperado is not None else None,
        tipoContratoPreferido=candidato.tipo_contrato_preferido.Nombre if candidato.tipo_contrato_preferido else None,
        jornadaPreferida=candidato.jornada_preferida.Nombre if candidato.jornada_preferida else None,
        movilidad=candidato.Movilidad,
        modalidadPreferida=candidato.modalidad_preferida.Nombre if candidato.modalidad_preferida else None,
        disponibilidad=candidato.disponibilidad.Nombre if candidato.disponibilidad else None,
        habilidades=[
            HabilidadOut(idHabilidad=h.IdHabilidad, nombre=h.Nombre)
=======
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
        habilidades=[
            HabilidadOut(idHabilidad=h.IdHabilidad, nombre=h.Nombre) 
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
            for h in (candidato.habilidades or [])
        ],
        educacion=[
            EducacionOut(idEducacion=e.IdEducacion, titulo=e.Titulo, institucion=e.Institucion, anio=e.Anio)
            for e in (candidato.educacion or [])
        ],
        experiencia=[
            ProyectoOut(idProyecto=p.IdProyecto, titulo=p.Titulo, descripcion=p.Descripcion, meta=p.Meta)
            for p in (candidato.proyectos or [])
        ],
        idiomas=[
            IdiomaOut(idIdioma=i.IdIdioma, descripcion=i.Descripcion)
            for i in (candidato.idiomas or [])
        ],
    )


# ============================================================
# REGISTRO
# ============================================================

@app.post("/api/auth/registro/candidato", response_model=CandidatoOut)
def registrar_candidato(body: RegistroCandidatoIn, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.Correo == body.correo).first():
        raise HTTPException(400, "Ya existe una cuenta con ese correo")

    municipio = _buscar_municipio(db, body.ciudad)
<<<<<<< HEAD
 
=======
    
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
    # VERIFICACIÓN CRÍTICA: Si no existen estos datos en la BD, lanzar error claro
    rol_candidato = db.query(Rol).filter(Rol.Nombre == "Candidato").first()
    if not rol_candidato:
        raise HTTPException(400, "El Rol 'Candidato' no está registrado en la base de datos")
<<<<<<< HEAD
 
=======
    
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
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
    db.commit()
    db.refresh(candidato)

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
def registrar_empresa(body: RegistroEmpresaIn, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.Correo == body.correo).first():
        raise HTTPException(400, "Ya existe una cuenta con ese correo")
    if db.query(Empresa).filter(Empresa.NIT == body.nit).first():
        raise HTTPException(400, "Ya existe una empresa registrada con ese NIT")

    municipio = _buscar_municipio(db, body.ciudad)
    sector = db.query(SectorEmpresa).filter(func.lower(SectorEmpresa.Nombre) == body.sector.strip().lower()).first()
    if not sector:
        raise HTTPException(400, f"Sector '{body.sector}' no encontrado en el catálogo")

    # VERIFICACIÓN CRÍTICA: Si no existen estos datos en la BD, lanzar error claro
    rol_empresa = db.query(Rol).filter(Rol.Nombre == "Empresa").first()
    if not rol_empresa:
        raise HTTPException(400, "El Rol 'Empresa' no está registrado en la base de datos")
<<<<<<< HEAD
 
=======
    
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
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
# LOGIN
# ============================================================

@app.post("/api/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.Correo == body.correo).first()
    if not usuario or not verify_password(body.contrasena, usuario.Contrasena):
        raise HTTPException(401, "Correo o contraseña incorrectos")

<<<<<<< HEAD
    # Si la cuenta es de un administrador, entra como administrador sin
    # importar si en el formulario se seleccionó "candidato" o "empresa".
    administrador = db.query(Administrador).filter(Administrador.IdUsuario == usuario.IdUsuario).first()
    if administrador:
        return {
            "idUsuario": usuario.IdUsuario,
            "idAdministrador": administrador.IdAdministrador,
            "tipo": "administrador",
        }

=======
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
    if body.tipo == "candidato":
        candidato = db.query(Candidato).filter(Candidato.IdUsuario == usuario.IdUsuario).first()
        if not candidato:
            raise HTTPException(403, "Esta cuenta no es de un candidato")
        return {"idUsuario": usuario.IdUsuario, "idCandidato": candidato.IdCandidato, "tipo": "candidato"}

    if body.tipo == "empresa":
        empresa = db.query(Empresa).filter(Empresa.IdUsuario == usuario.IdUsuario).first()
        if not empresa:
            raise HTTPException(403, "Esta cuenta no es de una empresa")
        return {"idUsuario": usuario.IdUsuario, "idEmpresa": empresa.IdEmpresa, "tipo": "empresa"}

    raise HTTPException(400, "Tipo de cuenta inválido")


# ============================================================
<<<<<<< HEAD
# ADMINISTRADOR
# ============================================================

@app.get("/api/administrador/{id_administrador}")
def obtener_administrador(id_administrador: int, db: Session = Depends(get_db)):
    admin = (
        db.query(Administrador)
        .options(joinedload(Administrador.usuario))
        .filter(Administrador.IdAdministrador == id_administrador)
        .first()
    )
    if not admin:
        raise HTTPException(404, "Administrador no encontrado")
    return {
        "idAdministrador": admin.IdAdministrador,
        "idUsuario": admin.IdUsuario,
        "nombres": admin.Nombres,
        "apellidos": admin.Apellidos,
        "correo": admin.usuario.Correo,
        "telefono": admin.Telefono,
    }


# ============================================================
=======
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
# DASHBOARDS (traer los datos del usuario ya creado)
# ============================================================

@app.get("/api/candidato/{id_candidato}", response_model=CandidatoOut)
def obtener_candidato(id_candidato: int, db: Session = Depends(get_db)):
    candidato = (
        db.query(Candidato)
        .options(joinedload(Candidato.usuario), joinedload(Candidato.municipio))
        .filter(Candidato.IdCandidato == id_candidato)
        .first()
    )
    if not candidato:
        raise HTTPException(404, "Candidato no encontrado")
    return CandidatoOut(
        idCandidato=candidato.IdCandidato,
        idUsuario=candidato.IdUsuario,
        nombres=candidato.Nombres,
        apellidos=candidato.Apellidos,
        correo=candidato.usuario.Correo,
        ciudad=candidato.municipio.Nombre if candidato.municipio else None,
        telefono=candidato.Telefono,
    )


@app.get("/api/empresa/{id_empresa}")
def obtener_empresa(id_empresa: int, db: Session = Depends(get_db)):
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
        "logoUrl": empresa.LogoUrl, # Foto de perfil
    }


# ============================================================
# PERFIL DE EMPRESA (Actualizar y ver postulantes)
# ============================================================

@app.put("/api/empresa/{id_empresa}")
def actualizar_empresa(id_empresa: int, body: dict, db: Session = Depends(get_db)):
    empresa = db.query(Empresa).filter(Empresa.IdEmpresa == id_empresa).first()
    if not empresa:
        raise HTTPException(404, "Empresa no encontrada")

    if body.get("nombreEmpresa"):
        empresa.NombreEmpresa = body["nombreEmpresa"]
    if body.get("nit"):
        empresa.NIT = body["nit"]
    if body.get("ciudad"):
        municipio = _buscar_municipio(db, body["ciudad"])
        empresa.IdMunicipio = municipio.IdMunicipio
    if body.get("sector"):
        sector = db.query(SectorEmpresa).filter(func.lower(SectorEmpresa.Nombre) == body["sector"].strip().lower()).first()
        if sector:
            empresa.IdSectorEmpresa = sector.IdSectorEmpresa
    if body.get("telefono"):
        empresa.Telefono = body["telefono"]
    if body.get("descripcion"):
        empresa.Descripcion = body["descripcion"]
    if body.get("direccion"):
        empresa.Direccion = body["direccion"]
    if body.get("sitioweb"):
        empresa.SitioWeb = body["sitioweb"]
    if body.get("correoCorporativo"):
        empresa.CorreoCorporativo = body["correoCorporativo"]
    if body.get("especialidades"):
        empresa.Especialidades = body["especialidades"]
    if body.get("anioFundacion"):
        empresa.AnioFundacion = int(body["anioFundacion"])
    if body.get("mision"):
        empresa.Mision = body["mision"]
    if body.get("vision"):
        empresa.Vision = body["vision"]
    if body.get("logoUrl"):  # Foto de perfil
        empresa.LogoUrl = body["logoUrl"]

    db.commit()
    db.refresh(empresa)
    return {"message": "Empresa actualizada correctamente"}


@app.get("/api/empresa/{id_empresa}/candidatos")
def obtener_candidatos_empresa(id_empresa: int, db: Session = Depends(get_db)):
    # 1. Buscar todas las ofertas de la empresa
    ofertas = db.query(Oferta).filter(Oferta.IdEmpresa == id_empresa).all()
    if not ofertas:
        return []

    # 2. Buscar todas las postulaciones a esas ofertas
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

    # 3. Armar los datos
    return [
        {
            "idPostulacion": p.IdPostulacion,
            "idCandidato": p.candidato.IdCandidato,
            "nombres": p.candidato.Nombres,
            "apellidos": p.candidato.Apellidos,
            "correo": p.candidato.usuario.Correo,
            "telefono": p.candidato.Telefono,
            "tituloOferta": p.oferta.Titulo,
            "estado": p.estado.Nombre,
            "fechaPostulacion": p.FechaPostulacion,
        }
        for p in postulaciones
    ]

@app.get("/api/empresa/ofertas/{id_oferta}/candidatos")
def obtener_candidatos_de_oferta(id_oferta: int, db: Session = Depends(get_db)):
    # Buscar todas las postulaciones a esa oferta
    postulaciones = (
        db.query(Postulacion)
        .options(
            joinedload(Postulacion.candidato).joinedload(Candidato.usuario),
            joinedload(Postulacion.estado)
        )
        .filter(Postulacion.IdOferta == id_oferta)
        .all()
    )
<<<<<<< HEAD
 
=======
    
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
    # Armar los datos
    return [
        {
            "idPostulacion": p.IdPostulacion,
            "idCandidato": p.candidato.IdCandidato,
            "nombres": p.candidato.Nombres,
            "apellidos": p.candidato.Apellidos,
            "correo": p.candidato.usuario.Correo,
            "telefono": p.candidato.Telefono,
            "estado": p.estado.Nombre,
            "fechaPostulacion": p.FechaPostulacion,
        }
        for p in postulaciones
    ]

@app.get("/api/empresa/{id_empresa}/ofertas/estados")
def contar_ofertas_por_estado(id_empresa: int, db: Session = Depends(get_db)):
    # Todas las ofertas de la empresa
    total = db.query(Oferta).filter(Oferta.IdEmpresa == id_empresa).count()

    # Verificar que los estados existan
    estado_publicada = db.query(EstadoOferta).filter(EstadoOferta.Nombre == "Publicada").first()
    estado_por_aprobar = db.query(EstadoOferta).filter(EstadoOferta.Nombre == "Por aprobar").first()
    estado_pausada = db.query(EstadoOferta).filter(EstadoOferta.Nombre == "Pausada").first()
    estado_cerrada = db.query(EstadoOferta).filter(EstadoOferta.Nombre == "Cerrada").first()

    if not estado_publicada or not estado_por_aprobar or not estado_pausada or not estado_cerrada:
        raise HTTPException(500, "Faltan estados de oferta en la base de datos")

    activas = db.query(Oferta).filter(
        Oferta.IdEmpresa == id_empresa,
        Oferta.IdEstadoOferta == estado_publicada.IdEstadoOferta
    ).count()

    en_revision = db.query(Oferta).filter(
        Oferta.IdEmpresa == id_empresa,
        Oferta.IdEstadoOferta == estado_por_aprobar.IdEstadoOferta
    ).count()

    pausadas = db.query(Oferta).filter(
        Oferta.IdEmpresa == id_empresa,
        Oferta.IdEstadoOferta == estado_pausada.IdEstadoOferta
    ).count()

    cerradas = db.query(Oferta).filter(
        Oferta.IdEmpresa == id_empresa,
        Oferta.IdEstadoOferta == estado_cerrada.IdEstadoOferta
    ).count()

    return {
        "total": total,
        "activas": activas,
        "en_revision": en_revision,
        "pausadas": pausadas,
        "cerradas": cerradas,
    }


@app.patch("/api/empresa/ofertas/{id_oferta}/estado")
def cambiar_estado_oferta_empresa(id_oferta: int, body: dict, db: Session = Depends(get_db)):
    # Verificar que la oferta exista
    oferta = db.query(Oferta).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta:
        raise HTTPException(404, "Oferta no encontrada")

    # Verificar que el estado exista en los catálogos
    nuevo_estado_nombre = body.get("nuevoEstado")
    if nuevo_estado_nombre not in ["Publicada", "Pausada", "Cerrada"]:
        raise HTTPException(400, f"Estado no permitido: {nuevo_estado_nombre}")

    nuevo_estado = db.query(EstadoOferta).filter(EstadoOferta.Nombre == nuevo_estado_nombre).first()
    if not nuevo_estado:
        raise HTTPException(400, f"Estado '{nuevo_estado_nombre}' no encontrado en la base de datos")

    oferta.IdEstadoOferta = nuevo_estado.IdEstadoOferta
    db.commit()
    return {"idOferta": oferta.IdOferta, "estado": nuevo_estado_nombre}

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
def actualizar_oferta(id_oferta: int, body: dict, db: Session = Depends(get_db)):
    oferta = db.query(Oferta).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta:
        raise HTTPException(404, "Oferta no encontrada")

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
def listar_ofertas_de_empresa(id_empresa: int, db: Session = Depends(get_db)):
    # Traer todas las ofertas de la empresa (sin filtrar por estado)
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
<<<<<<< HEAD
 
=======
    
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
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
        }
        for o in ofertas
    ]

# ============================================================
# CREAR OFERTA (Empresa)
# ============================================================

@app.post("/api/ofertas")
def crear_oferta(body: dict, db: Session = Depends(get_db)):
    # Verificar que la empresa exista
    empresa = db.query(Empresa).filter(Empresa.IdEmpresa == body.get("idEmpresa")).first()
    if not empresa:
        raise HTTPException(404, "Empresa no encontrada")

    # Buscar datos obligatorios en catálogos
    modalidad = db.query(Modalidad).filter(func.lower(Modalidad.Nombre) == body.get("modalidad", "").strip().lower()).first()
    if not modalidad:
        raise HTTPException(400, f"Modalidad '{body.get('modalidad')}' no encontrada")
<<<<<<< HEAD
 
=======
    
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
    municipio = _buscar_municipio(db, body.get("ciudad", "Medellín"))
    categoria = db.query(CategoriaOferta).filter(CategoriaOferta.Nombre == "Desarrollo de Software").first()
    tipo_contrato = db.query(TipoContrato).filter(TipoContrato.Nombre == "Término Indefinido").first()
    jornada = db.query(JornadaLaboral).filter(JornadaLaboral.Nombre == "Tiempo Completo").first()
    estado = db.query(EstadoOferta).filter(EstadoOferta.Nombre == "Publicada").first()

<<<<<<< HEAD
    if not all([categoria, tipo_contrato, jornada, estado]):
        raise HTTPException(500, "Faltan catálogos obligatorios en la base de datos")

    # crear la oferta
=======
    if not (categoria, tipo_contrato, jornada, estado):
        raise HTTPException(500, "Faltan catálogos obligatorios en la base de dados")

    # Create the offer
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
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
    }


# ============================================================
# VACANTES (vista pública / candidato)
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
<<<<<<< HEAD
            joinedload(Oferta.empresa),
            joinedload(Oferta.modalidad),
            joinedload(Oferta.municipio),
=======
            joinedload(Oferta.empresa), 
            joinedload(Oferta.modalidad),
            joinedload(Oferta.municipio), 
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
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

<<<<<<< HEAD
@app.post("/api/postulaciones", response_model=PostulacionOut)
def crear_postulacion(body: PostulacionIn, db: Session = Depends(get_db)):
    candidato = db.query(Candidato).filter(Candidato.IdCandidato == body.idCandidato).first()
    if not candidato:
        raise HTTPException(404, "Candidato no encontrado")

    oferta = (
        db.query(Oferta)
        .options(joinedload(Oferta.empresa), joinedload(Oferta.municipio), joinedload(Oferta.modalidad))
        .filter(Oferta.IdOferta == body.idOferta)
        .first()
    )
    if not oferta:
        raise HTTPException(404, "Oferta no encontrada")

    ya_existe = (
        db.query(Postulacion)
        .filter(Postulacion.IdCandidato == body.idCandidato, Postulacion.IdOferta == body.idOferta)
        .first()
    )
    if ya_existe:
        raise HTTPException(400, "Ya te postulaste a esta vacante")

    estado_inicial = db.query(EstadoPostulacion).filter(EstadoPostulacion.Nombre == "Postulado").first()
    if not estado_inicial:
        raise HTTPException(500, "Falta el estado 'Postulado' en la tabla EstadoPostulacion")

    postulacion = Postulacion(
        IdOferta=body.idOferta,
        IdCandidato=body.idCandidato,
        IdEstadoPostulacion=estado_inicial.IdEstadoPostulacion,
    )
    db.add(postulacion)
    db.commit()
    db.refresh(postulacion)

    return PostulacionOut(
        idPostulacion=postulacion.IdPostulacion,
        idOferta=oferta.IdOferta,
        idCandidato=candidato.IdCandidato,
        titulo=oferta.Titulo,
        empresa=oferta.empresa.NombreEmpresa,
        ciudad=oferta.municipio.Nombre,
        modalidad=oferta.modalidad.Nombre,
        estado=estado_inicial.Nombre,
        vista=postulacion.Vista,
        fechaPostulacion=postulacion.FechaPostulacion,
    )
=======
@app.post("/api/postulaciones")
def crear_postulacion(body: dict, db: Session = Depends(get_db)):
    print("BODY RECIBIDO:", body) # 👈 VE ESTO EN LA TERMINAL
    candidato = db.query(Candidato).first()
    if not candidato:
        raise HTTPException(400, "No hay candidatos en la base de datos")
    
    print("CANDIDATO ENCONTRADO:", candidato.IdCandidato, candidato.Nombres) # 👈 VE ESTO
    oferta = db.query(Oferta).first()
    if not oferta:
        raise HTTPException(400, "No hay ofertas en la base de datos")
    print("OFERTA ENCONTRADA:", oferta.IdOferta, oferta.Titulo) # 👈 VE ESTO
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0

@app.get("/api/candidato/{id_candidato}/postulaciones", response_model=list[PostulacionOut])
def listar_postulaciones_candidato(id_candidato: int, db: Session = Depends(get_db)):
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
<<<<<<< HEAD
            idCandidato=p.IdCandidato,
=======
            idCandidato=id_candidato,
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
            titulo=p.oferta.Titulo,
            empresa=p.oferta.empresa.NombreEmpresa,
            ciudad=p.oferta.municipio.Nombre,
            modalidad=p.oferta.modalidad.Nombre,
            estado=p.estado.Nombre,
            vista=p.Vista,
            fechaPostulacion=p.FechaPostulacion,
        )
        for p in postulaciones
    ]


# ============================================================
# PERFIL DEL CANDIDATO
# ============================================================

@app.get("/api/candidato/{id_candidato}/perfil", response_model=PerfilOut)
def obtener_perfil(id_candidato: int, db: Session = Depends(get_db)):
    candidato = _obtener_candidato_completo(id_candidato, db)
    return _armar_perfil(candidato)


@app.put("/api/candidato/{id_candidato}/perfil/datos", response_model=PerfilOut)
def actualizar_datos_perfil(id_candidato: int, body: PerfilDatosIn, db: Session = Depends(get_db)):
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
def actualizar_preferencias(id_candidato: int, body: PreferenciasIn, db: Session = Depends(get_db)):
    candidato = _obtener_candidato_completo(id_candidato, db)
<<<<<<< HEAD
    candidato.AreaInteres = body.areaInteres
    candidato.SalarioEsperado = body.salarioEsperado
    candidato.Movilidad = body.movilidad
=======
    if body.areaInteres is not None:
        candidato.AreaInteres = body.areaInteres
    if body.salarioEsperado is not None:
        candidato.SalarioEsperado = body.salarioEsperado
    if body.movilidad is not None:
        candidato.Movilidad = body.movilidad
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
    if body.tipoContratoPreferido:
        tipo = _buscar_en_catalogo(db, TipoContrato, "Nombre", body.tipoContratoPreferido, "Tipo de contrato")
        candidato.IdTipoContratoPreferido = tipo.IdTipoContrato
    if body.jornadaPreferida:
        jornada = _buscar_en_catalogo(db, JornadaLaboral, "Nombre", body.jornadaPreferida, "Jornada")
        candidato.IdJornadaPreferida = jornada.IdJornada
    if body.modalidadPreferida:
        modalidad = _buscar_en_catalogo(db, Modalidad, "Nombre", body.modalidadPreferida, "Modalidad")
        candidato.IdModalidad = modalidad.IdModalidad
<<<<<<< HEAD
    if body.disponibilidad:
        disponibilidad = _buscar_en_catalogo(db, Disponibilidad, "Nombre", body.disponibilidad, "Disponibilidad")
        candidato.IdDisponibilidad = disponibilidad.IdDisponibilidad
=======
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
def actualizar_sobre_mi(id_candidato: int, body: SobreMiIn, db: Session = Depends(get_db)):
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.AcercaDe = body.about
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/foto", response_model=PerfilOut)
def actualizar_foto(id_candidato: int, body: FotoIn, db: Session = Depends(get_db)):
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.FotoUrl = body.fotoUrl
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


# ============================================================
# SECCIONES DEL CV (Habilidades, Educación, Proyectos, Idiomas)
<<<<<<< HEAD
# ============================================================

# ============================================================
# MI CV (HOJA DE VIDA DEL CANDIDATO)
# ============================================================

def _armar_cv(candidato: Candidato) -> dict:
    """Arma el objeto CV completo a partir de un candidato."""
    return {
        "idCandidato": candidato.IdCandidato,
        "nombres": candidato.Nombres,
        "apellidos": candidato.Apellidos,
        "tituloProfesional": candidato.TituloProfesional,
        "ciudad": candidato.municipio.Nombre if candidato.municipio else None,
        "correo": candidato.usuario.Correo,
        "telefono": candidato.Telefono,
        "about": candidato.AcercaDe,
        "fotoUrl": candidato.FotoUrl,
        "plantilla": candidato.PlantillaCV,
        "habilidades": [
            {"idHabilidad": h.IdHabilidad, "nombre": h.Nombre}
            for h in (candidato.habilidades or [])
        ],
        "educacion": [
            {"idEducacion": e.IdEducacion, "titulo": e.Titulo, "institucion": e.Institucion, "anio": e.Anio}
            for e in (candidato.educacion or [])
        ],
        "proyectos": [
            {"idProyecto": p.IdProyecto, "titulo": p.Titulo, "descripcion": p.Descripcion, "meta": p.Meta}
            for p in (candidato.proyectos or [])
        ],
        "idiomas": [
            {"idIdioma": i.IdIdioma, "descripcion": i.Descripcion}
            for i in (candidato.idiomas or [])
        ],
        "referencias": [
            {"idReferencia": r.IdReferencia, "nombre": r.Nombre, "cargo": r.Cargo, "contacto": r.Contacto}
            for r in (candidato.referencias or [])
        ],
        "secciones": [
            {"idSeccion": s.IdSeccion, "titulo": s.Titulo, "contenido": s.Contenido}
            for s in (candidato.secciones_cv or [])
        ],
    }


@app.get("/api/candidato/{id_candidato}/cv")
def obtener_cv(id_candidato: int, db: Session = Depends(get_db)):
    candidato = _obtener_candidato_completo(id_candidato, db)
    return _armar_cv(candidato)


@app.put("/api/candidato/{id_candidato}/cv/datos-personales")
def guardar_datos_personales_cv(id_candidato: int, body: dict, db: Session = Depends(get_db)):
    candidato = _obtener_candidato_completo(id_candidato, db)
    if body.get("nombres"):
        candidato.Nombres = body["nombres"]
    if body.get("apellidos"):
        candidato.Apellidos = body["apellidos"]
    if body.get("tituloProfesional"):
        candidato.TituloProfesional = body["tituloProfesional"]
    if body.get("ciudad"):
        candidato.IdMunicipio = _buscar_municipio(db, body["ciudad"]).IdMunicipio
    if body.get("correo") and body.get("correo") != candidato.usuario.Correo:
        candidato.usuario.Correo = body["correo"]
    if body.get("telefono"):
        candidato.Telefono = body["telefono"]
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/sobre-mi")
def guardar_sobre_mi(id_candidato: int, body: dict, db: Session = Depends(get_db)):
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.AcercaDe = body.get("about", candidato.AcercaDe)
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/habilidades")
def guardar_habilidades(id_candidato: int, body: dict, db: Session = Depends(get_db)):
    candidato = _obtener_candidato_completo(id_candidato, db)
    # Borrar habilidades existentes
    db.query(CandidatoHabilidad).filter(CandidatoHabilidad.IdCandidato == id_candidato).delete()
    # Insertar las nuevas
    for nombre in body.get("habilidades", []):
        db.add(CandidatoHabilidad(IdCandidato=id_candidato, Nombre=nombre.strip()))
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/educacion")
def agregar_educacion_cv(id_candidato: int, body: dict, db: Session = Depends(get_db)):
    educacion = CandidatoEducacion(
        IdCandidato=id_candidato,
        Titulo=body.get("titulo", ""),
        Institucion=body.get("institucion"),
        Anio=body.get("anio"),
    )
    db.add(educacion)
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/proyectos")
def agregar_proyecto_cv(id_candidato: int, body: dict, db: Session = Depends(get_db)):
    proyecto = CandidatoProyecto(
        IdCandidato=id_candidato,
        Titulo=body.get("titulo", ""),
        Descripcion=body.get("descripcion"),
        Meta=body.get("meta"),
    )
    db.add(proyecto)
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/idiomas")
def agregar_idioma_cv(id_candidato: int, body: dict, db: Session = Depends(get_db)):
    idioma = CandidatoIdioma(
        IdCandidato=id_candidato,
        Descripcion=body.get("descripcion", ""),
    )
    db.add(idioma)
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/referencias")
def agregar_referencia_cv(id_candidato: int, body: dict, db: Session = Depends(get_db)):
    referencia = CandidatoReferencia(
        IdCandidato=id_candidato,
        Nombre=body.get("nombre", ""),
        Cargo=body.get("cargo"),
        Contacto=body.get("contacto"),
    )
    db.add(referencia)
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/secciones")
def agregar_seccion_cv(id_candidato: int, body: dict, db: Session = Depends(get_db)):
    seccion = CandidatoSeccionCV(
        IdCandidato=id_candidato,
        Titulo=body.get("titulo", ""),
        Contenido=body.get("contenido"),
    )
    db.add(seccion)
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/secciones/{id_seccion}")
def actualizar_seccion_cv(id_candidato: int, id_seccion: int, body: dict, db: Session = Depends(get_db)):
    seccion = db.query(CandidatoSeccionCV).filter(CandidatoSeccionCV.IdSeccion == id_seccion).first()
    if not seccion:
        raise HTTPException(404, "Sección no encontrada")
    seccion.Contenido = body.get("contenido", seccion.Contenido)
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/plantilla")
def guardar_plantilla_cv(id_candidato: int, body: dict, db: Session = Depends(get_db)):
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.PlantillaCV = body.get("plantilla", "clasico")
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))


@app.put("/api/candidato/{id_candidato}/cv/foto")
def guardar_foto_cv(id_candidato: int, body: dict, db: Session = Depends(get_db)):
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.FotoUrl = body.get("fotoUrl", candidato.FotoUrl)
    db.commit()
    return _armar_cv(_obtener_candidato_completo(id_candidato, db))
=======
# Rutas bajo /cv/ para que coincidan con usePerfil.ts
# ============================================================

@app.get("/api/candidato/{id_candidato}/cv/habilidades", response_model=list[HabilidadOut])
def obtener_habilidades(id_candidato: int, db: Session = Depends(get_db)):
    return db.query(CandidatoHabilidad).filter(CandidatoHabilidad.IdCandidato == id_candidato).all()


@app.put("/api/candidato/{id_candidato}/cv/habilidades", response_model=PerfilOut)
def actualizar_habilidades(id_candidato: int, body: HabilidadesIn, db: Session = Depends(get_db)):
    _obtener_candidato_completo(id_candidato, db)  # valida que exista
    db.query(CandidatoHabilidad).filter(CandidatoHabilidad.IdCandidato == id_candidato).delete()
    for nombre in body.habilidades:
        db.add(CandidatoHabilidad(IdCandidato=id_candidato, Nombre=nombre.strip()))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/educacion", response_model=PerfilOut)
def crear_educacion(id_candidato: int, body: EducacionIn, db: Session = Depends(get_db)):
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
def eliminar_educacion(id_candidato: int, id_educacion: int, db: Session = Depends(get_db)):
    educacion = db.query(CandidatoEducacion).filter(CandidatoEducacion.IdEducacion == id_educacion).first()
    if not educacion:
        raise HTTPException(404, "Educación no encontrada")
    db.delete(educacion)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/proyectos", response_model=PerfilOut)
def crear_proyecto(id_candidato: int, body: ProyectoIn, db: Session = Depends(get_db)):
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
def eliminar_proyecto(id_candidato: int, id_proyecto: int, db: Session = Depends(get_db)):
    proyecto = db.query(CandidatoProyecto).filter(CandidatoProyecto.IdProyecto == id_proyecto).first()
    if not proyecto:
        raise HTTPException(404, "Proyecto no encontrado")
    db.delete(proyecto)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.post("/api/candidato/{id_candidato}/cv/idiomas", response_model=PerfilOut)
def crear_idioma(id_candidato: int, body: IdiomaIn, db: Session = Depends(get_db)):
    _obtener_candidato_completo(id_candidato, db)
    db.add(CandidatoIdioma(
        IdCandidato=id_candidato,
        Descripcion=body.descripcion,
    ))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))


@app.delete("/api/candidato/{id_candidato}/cv/idiomas/{id_idioma}", response_model=PerfilOut)
def eliminar_idioma(id_candidato: int, id_idioma: int, db: Session = Depends(get_db)):
    idioma = db.query(CandidatoIdioma).filter(CandidatoIdioma.IdIdioma == id_idioma).first()
    if not idioma:
        raise HTTPException(404, "Idioma no encontrado")
    db.delete(idioma)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0


# ============================================================
# ADMINISTRADOR: moderación de vacantes
# ============================================================

ESTADOS_PERMITIDOS = {"Publicada", "Rechazada", "Pausada"}


@app.get("/api/admin/vacantes")
def listar_vacantes_admin(db: Session = Depends(get_db)):
    ofertas = (
        db.query(Oferta)
        .options(joinedload(Oferta.empresa), joinedload(Oferta.modalidad),
                  joinedload(Oferta.municipio), joinedload(Oferta.estado))
        .order_by(Oferta.FechaPublicacion.desc())
        .all()
    )
    return [
        {
<<<<<<< HEAD
            "idOferta": o.IdOferta,
            "titulo": o.Titulo,
            "empresa": o.empresa.NombreEmpresa,
            "ciudad": o.municipio.Nombre,
            "modalidad": o.modalidad.Nombre,
            "estado": o.estado.Nombre,
=======
            "idOferta": o.IdOferta, 
            "titulo": o.Titulo, 
            "empresa": o.empresa.NombreEmpresa,
            "ciudad": o.municipio.Nombre, 
            "modalidad": o.modalidad.Nombre,
            "estado": o.estado.Nombre, 
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
            "fechaPublicacion": o.FechaPublicacion,
        }
        for o in ofertas
    ]


@app.patch("/api/admin/vacantes/{id_oferta}/estado")
def cambiar_estado_vacante(id_oferta: int, body: dict, db: Session = Depends(get_db)):
    nuevo_estado_nombre = body.get("nuevoEstado")
    if nuevo_estado_nombre not in ESTADOS_PERMITIDOS:
        raise HTTPException(400, f"Estado no permitido: {nuevo_estado_nombre}")

    oferta = db.query(Oferta).filter(Oferta.IdOferta == id_oferta).first()
    if not oferta:
        raise HTTPException(404, "Vacante no encontrada")

    nuevo_estado = db.query(EstadoOferta).filter(EstadoOferta.Nombre == nuevo_estado_nombre).first()
    oferta.IdEstadoOferta = nuevo_estado.IdEstadoOferta
    db.commit()
    return {"idOferta": oferta.IdOferta, "estado": nuevo_estado_nombre}

@app.get("/api/empresa/{id_empresa}/notificaciones")
def obtener_notificaciones_empresa(id_empresa: int, db: Session = Depends(get_db)):
    # Buscar notificaciones de la empresa (idEmpresa = id_empresa)
    notificaciones = (
        db.query(Notificacion)
        .filter(
            (Notificacion.IdEmpresa == id_empresa) |
            (Notificacion.IdEmpresa == None)  # Notificaciones generales
        )
        .order_by(Notificacion.Fecha.desc())
        .all()
    )
<<<<<<< HEAD
 
=======
    
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
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

@app.get("/api/empresa/{id_empresa}/resumen")
def obtener_resumen_empresa(id_empresa: int, db: Session = Depends(get_db)):
    # 1. Buscar todas las ofertas de la empresa
    ofertas = db.query(Oferta).filter(Oferta.IdEmpresa == id_empresa).all()
    oferta_ids = [o.IdOferta for o in ofertas]

    # 2. Buscar todas las postulaciones a esas ofertas
    postulaciones = db.query(Postulacion).filter(Postulacion.IdOferta.in_(oferta_ids)).all()
    postulacion_ids = [p.IdPostulacion for p in postulaciones]

    # 3. Buscar todos los candidatos que se han postulado (sin duplicar)
    candidatos_postulados = db.query(Postulacion.IdCandidato).filter(Postulacion.IdOferta.in_(oferta_ids)).distinct().all()
<<<<<<< HEAD
 
=======
    
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
    # 4. Buscar todos los estados de las postulaciones
    estados = db.query(EstadoPostulacion).all()
    estado_nombres = {e.IdEstadoPostulacion: e.Nombre for e in estados}

    # 5. Calcular los números
    # Nuevos candidatos (postulaciones en estado "Postulado")
    nuevos_candidatos = len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) == "Postulado"])
<<<<<<< HEAD
 
    # Candidatos recomendados (postulaciones en estado "En revisión" o "Preseleccionado")
    candidatos_recomendados = len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) in ["En revisión", "Preseleccionado"]])
 
    # Entrevistas (postulaciones en estado "Entrevista")
    entrevistas = len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) == "Entrevista"])
 
    # Nota: Oferta no tiene una columna de fecha de cierre/expiración en la BD.
    # Mientras no exista esa columna, usamos las ofertas "Pausadas" como proxy
    # de "vacantes que necesitan atención".
    estado_pausada = db.query(EstadoOferta).filter(EstadoOferta.Nombre == "Pausada").first()
    vacantes_por_vencer = (
        len([o for o in ofertas if estado_pausada and o.IdEstadoOferta == estado_pausada.IdEstadoOferta])
    )

    # Rendimiento (ofertas que están activas)
    estado_publicada = db.query(EstadoOferta).filter(EstadoOferta.Nombre == "Publicada").first()
    rendimiento = (
        len([o for o in ofertas if estado_publicada and o.IdEstadoOferta == estado_publicada.IdEstadoOferta])
    )
=======
    
    # Candidatos recomendados (postulaciones en estado "En revisión" o "Preseleccionado")
    candidatos_recomendados = len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) in ["En revisión", "Preseleccionado"]])
    
    # Entrevistas (postulaciones en estado "Entrevista")
    entrevistas = len([p for p in postulaciones if estado_nombres.get(p.IdEstadoPostulacion) == "Entrevista"])
    
    # Vacantes por vencer (ofertas con fecha de cierre o que están "Pausadas")
    vacantes_por_vencer = len([o for o in ofertas if o.FechaCierre is not None])
    
    # Rendimiento (ofertas que están activas)
    rendimiento = len([o for o in ofertas if o.IdEstadoOferta == 1])  # Suponiendo que 1 = Publicada
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0

    return {
        "nuevosCandidatos": nuevos_candidatos,
        "candidatosRecomendados": candidatos_recomendados,
        "entrevistas": entrevistas,
        "vacantesPorVencer": vacantes_por_vencer,
        "rendimiento": rendimiento,
    }

@app.delete("/api/postulaciones/{id_postulacion}")
def eliminar_postulacion(id_postulacion: int, db: Session = Depends(get_db)):
    postulacion = db.query(Postulacion).filter(Postulacion.IdPostulacion == id_postulacion).first()
    if not postulacion:
        raise HTTPException(404, "Postulación no encontrada")
    db.delete(postulacion)
    db.commit()
    return {"message": "Postulación eliminada"}
<<<<<<< HEAD

@app.get("/api/busquedas-guardadas")
def obtener_busquedas_guardadas(db: Session = Depends(get_db)):
    # Obtener todas las categorías
    categorias = db.query(CategoriaOferta).all()
    
    # Armar la lista de búsquedas guardadas
    busquedas = []
    for categoria in categorias:
        total = (
            db.query(Oferta)
            .filter(
                Oferta.IdCategoria == categoria.IdCategoria,
                Oferta.IdEstadoOferta == 1  # Solo publicadas
            )
            .count()
        )
        busquedas.append({
            "titulo": categoria.Nombre,
            "total": total,
        })
    
    return busquedas

=======
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
# ============================================================
# Endpoints extras para manejo interno (si no los tienes)
# ============================================================
@app.get("/api/municipios/")
def obtener_municipios(db: Session = Depends(get_db)):
    return db.query(Municipio).all()


@app.get("/api/roles/")
def obtener_roles(db: Session = Depends(get_db)):
    return db.query(Rol).all()

# ============================================================
# ADMINISTRADOR
# ============================================================
@app.post("/api/reportes")
def crear_reporte(body: dict, db: Session = Depends(get_db)):
    # Crear un reporte simple (se puede mejorar después)
    return {"message": "Reporte creado correctamente"}

# ============================================================
# Punto de entrada
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)