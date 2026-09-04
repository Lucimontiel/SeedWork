# pylint: disable=not-callable
"""Modelos SQLAlchemy para el flujo de autenticación y los dashboards."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Numeric, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from database import Base

class Rol(Base):
    __tablename__ = "Rol"
    IdRol = Column(Integer, primary_key=True)
    Nombre = Column(String(30), unique=True, nullable=False)


class EstadoUsuario(Base):
    __tablename__ = "EstadoUsuario"
    IdEstadoUsuario = Column(Integer, primary_key=True)
    Nombre = Column(String(30), unique=True, nullable=False)


class Municipio(Base):
    __tablename__ = "Municipio"
    IdMunicipio = Column(Integer, primary_key=True)
    IdDepartamento = Column(Integer, ForeignKey("Departamento.IdDepartamento"))
    Nombre = Column(String(120), nullable=False)


class Departamento(Base):
    __tablename__ = "Departamento"
    IdDepartamento = Column(Integer, primary_key=True)
    IdPais = Column(Integer, ForeignKey("Pais.IdPais"))
    Nombre = Column(String(100), nullable=False)


class Pais(Base):
    __tablename__ = "Pais"
    IdPais = Column(Integer, primary_key=True)
    Nombre = Column(String(100), nullable=False)


class SectorEmpresa(Base):
    __tablename__ = "SectorEmpresa"
    IdSectorEmpresa = Column(Integer, primary_key=True)
    Nombre = Column(String(80), unique=True, nullable=False)


class TamanoEmpresa(Base):
    __tablename__ = "TamanoEmpresa"
    IdTamanoEmpresa = Column(Integer, primary_key=True)
    Rango = Column(String(40), unique=True, nullable=False)


class Modalidad(Base):
    __tablename__ = "Modalidad"
    IdModalidad = Column(Integer, primary_key=True)
    Nombre = Column(String(50), unique=True, nullable=False)


class Disponibilidad(Base):
    __tablename__ = "Disponibilidad"
    IdDisponibilidad = Column(Integer, primary_key=True)
    Nombre = Column(String(50), unique=True, nullable=False)


class Usuario(Base):
    __tablename__ = "Usuario"
    IdUsuario = Column(Integer, primary_key=True)
    IdRol = Column(Integer, ForeignKey("Rol.IdRol"), nullable=False)
    IdEstadoUsuario = Column(Integer, ForeignKey("EstadoUsuario.IdEstadoUsuario"), nullable=False)
    Correo = Column(String(150), unique=True, nullable=False)
    Contrasena = Column(String(255), nullable=False)
    FechaCreacion: datetime = Column(DateTime, server_default=func.now())

    rol = relationship("Rol", lazy="joined")
    estado = relationship("EstadoUsuario", lazy="joined")
    candidato = relationship("Candidato", back_populates="usuario", uselist=False, lazy="selectin")
    empresa = relationship("Empresa", back_populates="usuario", uselist=False, lazy="selectin")
    administrador = relationship("Administrador", back_populates="usuario", uselist=False, lazy="selectin")


class Administrador(Base):
    __tablename__ = "Administrador"
    IdAdministrador = Column(Integer, primary_key=True)
    IdUsuario = Column(Integer, ForeignKey("Usuario.IdUsuario"), unique=True, nullable=False)
    Nombres = Column(String(100), nullable=False)
    Apellidos = Column(String(100), nullable=False)
    Documento = Column(String(20))
    Telefono = Column(String(20))

    usuario = relationship("Usuario", back_populates="administrador", lazy="selectin")


class Candidato(Base):
    __tablename__ = "Candidato"
    IdCandidato = Column(Integer, primary_key=True)
    IdUsuario = Column(Integer, ForeignKey("Usuario.IdUsuario"), unique=True, nullable=False)
    IdMunicipio = Column(Integer, ForeignKey("Municipio.IdMunicipio"))
    IdModalidad = Column(Integer, ForeignKey("Modalidad.IdModalidad"))
    IdDisponibilidad = Column(Integer, ForeignKey("Disponibilidad.IdDisponibilidad"))
    IdTipoContratoPreferido = Column(Integer, ForeignKey("TipoContrato.IdTipoContrato"))
    IdJornadaPreferida = Column(Integer, ForeignKey("JornadaLaboral.IdJornada"))
    Nombres = Column(String(100), nullable=False)
    Apellidos = Column(String(100), nullable=False)
    Telefono = Column(String(20))
    AcercaDe = Column(Text)
    TituloProfesional = Column(String(150))
    FotoUrl = Column(Text)
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
    __tablename__ = "Empresa"
    IdEmpresa = Column(Integer, primary_key=True)
    IdUsuario = Column(Integer, ForeignKey("Usuario.IdUsuario"), unique=True, nullable=False)
    IdMunicipio = Column(Integer, ForeignKey("Municipio.IdMunicipio"), nullable=False)
    IdSectorEmpresa = Column(Integer, ForeignKey("SectorEmpresa.IdSectorEmpresa"))
    IdTamanoEmpresa = Column(Integer, ForeignKey("TamanoEmpresa.IdTamanoEmpresa"))
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
    __tablename__ = "EstadoOferta"
    IdEstadoOferta = Column(Integer, primary_key=True)
    Nombre = Column(String(50), unique=True, nullable=False)


class CategoriaOferta(Base):
    __tablename__ = "CategoriaOferta"
    IdCategoria = Column(Integer, primary_key=True)
    Nombre = Column(String(100), unique=True, nullable=False)


class TipoContrato(Base):
    __tablename__ = "TipoContrato"
    IdTipoContrato = Column(Integer, primary_key=True)
    Nombre = Column(String(80), unique=True, nullable=False)


class JornadaLaboral(Base):
    __tablename__ = "JornadaLaboral"
    IdJornada = Column(Integer, primary_key=True)
    Nombre = Column(String(80), unique=True, nullable=False)


class Oferta(Base):
    __tablename__ = "Oferta"
    IdOferta = Column(Integer, primary_key=True)
    IdEmpresa = Column(Integer, ForeignKey("Empresa.IdEmpresa"), nullable=False)
    IdCategoria = Column(Integer, ForeignKey("CategoriaOferta.IdCategoria"), nullable=False)
    IdTipoContrato = Column(Integer, ForeignKey("TipoContrato.IdTipoContrato"), nullable=False)
    IdModalidad = Column(Integer, ForeignKey("Modalidad.IdModalidad"), nullable=False)
    IdJornada = Column(Integer, ForeignKey("JornadaLaboral.IdJornada"), nullable=False)
    IdEstadoOferta = Column(Integer, ForeignKey("EstadoOferta.IdEstadoOferta"), nullable=False)
    IdMunicipio = Column(Integer, ForeignKey("Municipio.IdMunicipio"), nullable=False)
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
    __tablename__ = "EstadoPostulacion"
    IdEstadoPostulacion = Column(Integer, primary_key=True)
    Nombre = Column(String(80), unique=True, nullable=False)


class Postulacion(Base):
    __tablename__ = "Postulacion"
    IdPostulacion = Column(Integer, primary_key=True)
    IdOferta = Column(Integer, ForeignKey("Oferta.IdOferta"), nullable=False)
    IdCandidato = Column(Integer, ForeignKey("Candidato.IdCandidato"), nullable=False)
    IdEstadoPostulacion = Column(Integer, ForeignKey("EstadoPostulacion.IdEstadoPostulacion"), nullable=False)
    Vista = Column(Boolean, default=False)
    FechaPostulacion: datetime = Column(DateTime, server_default=func.now())

    # Relaciones nuevas
    oferta = relationship("Oferta", lazy="selectin")
    candidato = relationship("Candidato", lazy="selectin")
    estado = relationship("EstadoPostulacion", lazy="selectin")

class TipoNotificacion(Base):
    __tablename__ = "TipoNotificacion"
    IdTipoNotificacion = Column(Integer, primary_key=True)
    Nombre = Column(String(80), unique=True)


class Notificacion(Base):
    __tablename__ = "Notificacion"
    IdNotificacion = Column(Integer, primary_key=True)
    IdTipoNotificacion = Column(Integer, ForeignKey("TipoNotificacion.IdTipoNotificacion"), nullable=False)
    IdEmpresa = Column(Integer, ForeignKey("Empresa.IdEmpresa"))
    IdCandidato = Column(Integer, ForeignKey("Candidato.IdCandidato"))
    IdAdministrador = Column(Integer, ForeignKey("Administrador.IdAdministrador"))
    Titulo = Column(String(150))
    Mensaje = Column(Text)
    Leida = Column(Boolean, default=False)
    Fecha = Column(DateTime, server_default=func.now())

    tipo = relationship("TipoNotificacion", lazy="joined")
    empresa = relationship("Empresa", lazy="joined")
    candidato = relationship("Candidato", lazy="joined")
    administrador = relationship("Administrador", lazy="joined")


class CandidatoHabilidad(Base):
    __tablename__ = "CandidatoHabilidad"
    IdHabilidad = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("Candidato.IdCandidato"), nullable=False)
    Nombre = Column(String(80), nullable=False)


class CandidatoEducacion(Base):
    __tablename__ = "CandidatoEducacion"
    IdEducacion = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("Candidato.IdCandidato"), nullable=False)
    Titulo = Column(String(150), nullable=False)
    Institucion = Column(String(150))
    Anio = Column(String(20))


class CandidatoProyecto(Base):
    __tablename__ = "CandidatoProyecto"
    IdProyecto = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("Candidato.IdCandidato"), nullable=False)
    Titulo = Column(String(150), nullable=False)
    Descripcion = Column(Text)
    Meta = Column(String(120))


class CandidatoIdioma(Base):
    __tablename__ = "CandidatoIdioma"
    IdIdioma = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("Candidato.IdCandidato"), nullable=False)
    Descripcion = Column(String(120), nullable=False)


class CandidatoReferencia(Base):
    __tablename__ = "CandidatoReferencia"
    IdReferencia = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("Candidato.IdCandidato"), nullable=False)
    Nombre = Column(String(120), nullable=False)
    Cargo = Column(String(150))
    Contacto = Column(String(120))


class CandidatoSeccionCV(Base):
    __tablename__ = "CandidatoSeccionCV"
    IdSeccion = Column(Integer, primary_key=True)
    IdCandidato = Column(Integer, ForeignKey("Candidato.IdCandidato"), nullable=False)
    Titulo = Column(String(120), nullable=False)
    Contenido = Column(Text)
    Orden = Column(Integer, default=0)