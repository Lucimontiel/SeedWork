# pylint: disable=not-callable
"""Modelos SQLAlchemy para el flujo de autenticación y los dashboards."""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Numeric,
    ForeignKey, Boolean, func
)
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.dialects.mysql import LONGTEXT


class Rol(Base):
    __tablename__ = "rol"
    IdRol = Column(Integer, primary_key=True)
    Nombre = Column(String(30), unique=True, nullable=False)


class EstadoUsuario(Base):
    __tablename__ = "estadousuario"
    IdEstadoUsuario = Column(Integer, primary_key=True)
    Nombre = Column(String(30), unique=True, nullable=False)


class Municipio(Base):
    __tablename__ = "municipio"
    IdMunicipio = Column(Integer, primary_key=True)
    IdDepartamento = Column(Integer, ForeignKey("departamento.IdDepartamento"))
    Nombre = Column(String(120), nullable=False)


class Departamento(Base):
    __tablename__ = "departamento"
    IdDepartamento = Column(Integer, primary_key=True)
    IdPais = Column(Integer, ForeignKey("pais.IdPais"))
    Nombre = Column(String(100), nullable=False)


class Pais(Base):
    __tablename__ = "pais"
    IdPais = Column(Integer, primary_key=True)
    Nombre = Column(String(100), nullable=False)


class SectorEmpresa(Base):
    __tablename__ = "sectorempresa"
    IdSectorEmpresa = Column(Integer, primary_key=True)
    Nombre = Column(String(80), unique=True, nullable=False)


class TamanoEmpresa(Base):
    __tablename__ = "tamanoempresa"
    IdTamanoEmpresa = Column(Integer, primary_key=True)
    Rango = Column(String(40), unique=True, nullable=False)


class Modalidad(Base):
    __tablename__ = "modalidad"
    IdModalidad = Column(Integer, primary_key=True)
    Nombre = Column(String(50), unique=True, nullable=False)


class Disponibilidad(Base):
    __tablename__ = "disponibilidad"
    IdDisponibilidad = Column(Integer, primary_key=True)
    Nombre = Column(String(50), unique=True, nullable=False)


# ============================================================
# USUARIO (con columnas de seguridad)
# ============================================================
class Usuario(Base):
    __tablename__ = "usuario"
    IdUsuario = Column(Integer, primary_key=True)
    IdRol = Column(Integer, ForeignKey("rol.IdRol"), nullable=False)
    IdEstadoUsuario = Column(Integer, ForeignKey("estadousuario.IdEstadoUsuario"), nullable=False)
    Correo = Column(String(150), unique=True, nullable=False)
    Contrasena = Column(String(255), nullable=False)
    FechaCreacion: datetime = Column(DateTime, server_default=func.now())

    # ⬅️ NUEVO: columnas de seguridad
    IntentosFallidos = Column(Integer, nullable=False, default=0)
    BloqueadoHasta = Column(DateTime, nullable=True)
    TotpSecret = Column(String(64), nullable=True)
    TotpHabilitado = Column(Boolean, nullable=False, default=False)
    UltimoLogin = Column(DateTime, nullable=True)
    UltimoLoginIP = Column(String(45), nullable=True)

    rol = relationship("Rol", lazy="joined")
    estado = relationship("EstadoUsuario", lazy="joined")
    candidato = relationship("Candidato", back_populates="usuario", uselist=False, lazy="selectin")
    empresa = relationship("Empresa", back_populates="usuario", uselist=False, lazy="selectin")
    administrador = relationship("Administrador", back_populates="usuario", uselist=False, lazy="selectin")

    # ⬅️ NUEVO: relaciones con tokens y códigos
    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="usuario",
        cascade="all, delete-orphan",
        foreign_keys="RefreshToken.IdUsuario",
    )
    codigos_respaldo = relationship(
        "CodigoRespaldo",
        back_populates="usuario",
        cascade="all, delete-orphan",
    )


# ============================================================
# NUEVO: RefreshToken
# ============================================================
class RefreshToken(Base):
    __tablename__ = "refreshtoken"
    IdRefreshToken = Column(Integer, primary_key=True)
    IdUsuario = Column(Integer, ForeignKey("usuario.IdUsuario", ondelete="CASCADE"), nullable=False)
    TokenHash = Column(String(255), unique=True, nullable=False)
    UserAgent = Column(String(255), nullable=True)
    IP = Column(String(45), nullable=True)
    ExpiraEn = Column(DateTime, nullable=False)
    Revocado = Column(Boolean, nullable=False, default=False)
    RevocadoEn = Column(DateTime, nullable=True)
    ReemplazadoPor = Column(Integer, ForeignKey("refreshtoken.IdRefreshToken"), nullable=True)
    FechaCreacion = Column(DateTime, server_default=func.now())

    usuario = relationship("Usuario", back_populates="refresh_tokens", foreign_keys=[IdUsuario])


# ============================================================
# NUEVO: CodigoRespaldo (para 2FA)
# ============================================================
class CodigoRespaldo(Base):
    __tablename__ = "codigorespaldo"
    IdCodigo = Column(Integer, primary_key=True)
    IdUsuario = Column(Integer, ForeignKey("usuario.IdUsuario", ondelete="CASCADE"), nullable=False)
    CodigoHash = Column(String(255), nullable=False)
    Usado = Column(Boolean, nullable=False, default=False)
    UsadoEn = Column(DateTime, nullable=True)

    usuario = relationship("Usuario", back_populates="codigos_respaldo")


# ============================================================
# NUEVO: AuditLog
# ============================================================
class AuditLog(Base):
    __tablename__ = "auditlog"
    IdAudit = Column(Integer, primary_key=True)
    IdUsuario = Column(Integer, ForeignKey("usuario.IdUsuario", ondelete="SET NULL"), nullable=True)
    CorreoIntentado = Column(String(150), nullable=True)
    Evento = Column(String(50), nullable=False)
    Exito = Column(Boolean, nullable=False)
    IP = Column(String(45), nullable=True)
    UserAgent = Column(String(255), nullable=True)
    Detalles = Column(Text, nullable=True)
    Fecha = Column(DateTime, server_default=func.now())


# ============================================================
# ADMINISTRADOR / EMPRESA / CANDIDATO
# ============================================================
class Administrador(Base):
    __tablename__ = "administrador"
    IdAdministrador = Column(Integer, primary_key=True)
    IdUsuario = Column(Integer, ForeignKey("usuario.IdUsuario"), unique=True, nullable=False)
    Nombres = Column(String(100), nullable=False)
    Apellidos = Column(String(100), nullable=False)
    Documento = Column(String(20))
    Telefono = Column(String(20))

    usuario = relationship("Usuario", back_populates="administrador", lazy="selectin")


class Candidato(Base):
    __tablename__ = "candidato"
    IdCandidato = Column(Integer, primary_key=True)
    IdUsuario = Column(Integer, ForeignKey("usuario.IdUsuario"), unique=True, nullable=False)
    IdMunicipio = Column(Integer, ForeignKey("municipio.IdMunicipio"))
    IdModalidad = Column(Integer, ForeignKey("modalidad.IdModalidad"))
    IdDisponibilidad = Column(Integer, ForeignKey("disponibilidad.IdDisponibilidad"))
    IdTipoContratoPreferido = Column(Integer, ForeignKey("tipocontrato.IdTipoContrato"))
    IdJornadaPreferida = Column(Integer, ForeignKey("jornadalaboral.IdJornada"))
    Nombres = Column(String(100), nullable=False)
    Apellidos = Column(String(100), nullable=False)
    Telefono = Column(String(20))
    AcercaDe = Column(Text)
    TituloProfesional = Column(String(150))
    FotoUrl = Column(LONGTEXT)
    PlantillaCV = Column(String(20), default="clasico")
    FechaNacimiento = Column(Date)
    AreaInteres = Column(String(255))
    SalarioEsperado = Column(String(100))
    Movilidad = Column(String(100))
    FechaCreacion: datetime = Column(DateTime, server_default=func.now())

    usuario = relationship("Usuario", back_populates="candidato", lazy="selectin")
    municipio = relationship("Municipio", lazy="joined")
    modalidad_preferida = relationship("Modalidad", foreign_keys=[IdModalidad], lazy="joined")
    disponibilidad = relationship("Disponibilidad", foreign_keys=[IdDisponibilidad], lazy="joined")
    tipo_contrato_preferido = relationship("TipoContrato", foreign_keys=[IdTipoContratoPreferido], lazy="joined")
    jornada_preferida = relationship("JornadaLaboral", foreign_keys=[IdJornadaPreferida], lazy="joined")
    habilidades = relationship("CandidatoHabilidad", cascade="all, delete-orphan", lazy="selectin")
    educacion = relationship("CandidatoEducacion", cascade="all, delete-orphan", order_by="CandidatoEducacion.IdEducacion", lazy="selectin")
    proyectos = relationship("CandidatoProyecto", cascade="all, delete-orphan", order_by="CandidatoProyecto.IdProyecto", lazy="selectin")
    idiomas = relationship("CandidatoIdioma", cascade="all, delete-orphan", order_by="CandidatoIdioma.IdIdioma", lazy="selectin")
    referencias = relationship("CandidatoReferencia", cascade="all, delete-orphan", order_by="CandidatoReferencia.IdReferencia", lazy="selectin")
    secciones_cv = relationship("CandidatoSeccionCV", cascade="all, delete-orphan", order_by="CandidatoSeccionCV.Orden", lazy="selectin")


class Empresa(Base):
    __tablename__ = "empresa"
    IdEmpresa = Column(Integer, primary_key=True)
    IdUsuario = Column(Integer, ForeignKey("usuario.IdUsuario"), unique=True, nullable=False)
    IdMunicipio = Column(Integer, ForeignKey("municipio.IdMunicipio"), nullable=False)
    IdSectorEmpresa = Column(Integer, ForeignKey("sectorempresa.IdSectorEmpresa"))
    IdTamanoEmpresa = Column(Integer, ForeignKey("tamanoempresa.IdTamanoEmpresa"))
    NombreEmpresa = Column(String(150), nullable=False)
    NIT = Column(String(20), unique=True, nullable=False)
    Descripcion = Column(Text)
    
    # Columnas nuevas
    SitioWeb = Column(String(255))
    CorreoCorporativo = Column(String(150))
    Especialidades = Column(String(255))
    AnioFundacion = Column(Integer)
    Mision = Column(Text)
    Vision = Column(Text)
    LogoUrl = Column(Text)
    
    Direccion = Column(String(150))
    Telefono = Column(String(20))
    FechaRegistro: datetime = Column(DateTime, server_default=func.now())

    usuario = relationship("Usuario", back_populates="empresa", lazy="selectin")
    municipio = relationship("Municipio", lazy="joined")
    sector = relationship("SectorEmpresa", lazy="joined")
    tamano = relationship("TamanoEmpresa", lazy="joined")


class EstadoOferta(Base):
    __tablename__ = "estadooferta"
    IdEstadoOferta = Column(Integer, primary_key=True)
    Nombre = Column(String(50), unique=True, nullable=False)


class CategoriaOferta(Base):
    __tablename__ = "categoriaoferta"
    IdCategoria = Column(Integer, primary_key=True)
    Nombre = Column(String(100), unique=True, nullable=False)


class TipoContrato(Base):
    __tablename__ = "tipocontrato"
    IdTipoContrato = Column(Integer, primary_key=True)
    Nombre = Column(String(80), unique=True, nullable=False)


class JornadaLaboral(Base):
    __tablename__ = "jornadalaboral"
    IdJornada = Column(Integer, primary_key=True)
    Nombre = Column(String(80), unique=True, nullable=False)


class Oferta(Base):
    __tablename__ = "oferta"
    IdOferta = Column(Integer, primary_key=True)
    IdEmpresa = Column(Integer, ForeignKey("empresa.IdEmpresa"), nullable=False)
    IdCategoria = Column(Integer, ForeignKey("categoriaoferta.IdCategoria"), nullable=False)
    IdTipoContrato = Column(Integer, ForeignKey("tipocontrato.IdTipoContrato"), nullable=False)
    IdModalidad = Column(Integer, ForeignKey("modalidad.IdModalidad"), nullable=False)
    IdJornada = Column(Integer, ForeignKey("jornadalaboral.IdJornada"), nullable=False)
    IdEstadoOferta = Column(Integer, ForeignKey("estadooferta.IdEstadoOferta"), nullable=False)
    IdMunicipio = Column(Integer, ForeignKey("municipio.IdMunicipio"), nullable=False)
    Titulo = Column(String(200), nullable=False)
    Descripcion = Column(Text, nullable=False)
    Vacantes = Column(Integer, default=1)
    ExperienciaMinima = Column(Integer, default=0)
    FechaCierre = Column(Date)
    FechaPublicacion: datetime = Column(DateTime, server_default=func.now())

    empresa = relationship("Empresa", lazy="joined")
    modalidad = relationship("Modalidad", lazy="joined")
    estado = relationship("EstadoOferta", lazy="joined")
    municipio = relationship("Municipio", lazy="joined")
    categoria = relationship("CategoriaOferta", lazy="joined")
    tipo_contrato = relationship("TipoContrato", lazy="joined")
    jornada = relationship("JornadaLaboral", lazy="joined")


class EstadoPostulacion(Base):
    __tablename__ = "estadopostulacion"
    IdEstadoPostulacion = Column(Integer, primary_key=True)
    Nombre = Column(String(80), unique=True, nullable=False)


class Postulacion(Base):
    __tablename__ = "postulacion"
    IdPostulacion = Column(Integer, primary_key=True)
    IdOferta = Column(Integer, ForeignKey("oferta.IdOferta"), nullable=False)
    IdCandidato = Column(Integer, ForeignKey("candidato.IdCandidato"), nullable=False)
    IdEstadoPostulacion = Column(Integer, ForeignKey("estadopostulacion.IdEstadoPostulacion"), nullable=False)
    Vista = Column(Boolean, default=False)
    FechaPostulacion: datetime = Column(DateTime, server_default=func.now())

    oferta = relationship("Oferta", lazy="selectin")
    candidato = relationship("Candidato", lazy="selectin")
    estado = relationship("EstadoPostulacion", lazy="selectin")


class TipoNotificacion(Base):
    __tablename__ = "tiponotificacion"
    IdTipoNotificacion = Column(Integer, primary_key=True)
    Nombre = Column(String(80), unique=True)


class Notificacion(Base):
    __tablename__ = "notificacion"
    IdNotificacion = Column(Integer, primary_key=True)
    IdTipoNotificacion = Column(Integer, ForeignKey("tiponotificacion.IdTipoNotificacion"), nullable=False)
    IdEmpresa = Column(Integer, ForeignKey("empresa.IdEmpresa"))
    IdCandidato = Column(Integer, ForeignKey("candidato.IdCandidato"))
    IdAdministrador = Column(Integer, ForeignKey("administrador.IdAdministrador"))
    Titulo = Column(String(150))
    Mensaje = Column(Text)
    Leida = Column(Boolean, default=False)
    Fecha = Column(DateTime, server_default=func.now())

    tipo = relationship("TipoNotificacion", lazy="joined")
    empresa = relationship("Empresa", lazy="joined")
    candidato = relationship("Candidato", lazy="joined")
    administrador = relationship("Administrador", lazy="joined")


class CandidatoHabilidad(Base):
    __tablename__ = "candidatohabilidad"
    IdHabilidad = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("candidato.IdCandidato"), nullable=False)
    Nombre = Column(String(80), nullable=False)


class CandidatoEducacion(Base):
    __tablename__ = "candidatoeducacion"
    IdEducacion = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("candidato.IdCandidato"), nullable=False)
    Titulo = Column(String(150), nullable=False)
    Institucion = Column(String(150))
    Anio = Column(String(20))


class CandidatoProyecto(Base):
    __tablename__ = "candidatoproyecto"
    IdProyecto = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("candidato.IdCandidato"), nullable=False)
    Titulo = Column(String(150), nullable=False)
    Descripcion = Column(Text)
    Meta = Column(String(120))


class CandidatoIdioma(Base):
    __tablename__ = "candidatoidioma"
    IdIdioma = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("candidato.IdCandidato"), nullable=False)
    Descripcion = Column(String(120), nullable=False)


class CandidatoReferencia(Base):
    __tablename__ = "candidatoreferencia"
    IdReferencia = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("candidato.IdCandidato"), nullable=False)
    Nombre = Column(String(120), nullable=False)
    Cargo = Column(String(150))
    Contacto = Column(String(120))


class CandidatoSeccionCV(Base):
    __tablename__ = "candidatoseccioncv"
    IdSeccion = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("candidato.IdCandidato"), nullable=False)
    Titulo = Column(String(120), nullable=False)
    Contenido = Column(Text)
    Orden = Column(Integer, default=0)