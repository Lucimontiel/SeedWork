"""Schemas Pydantic: la 'forma' del JSON que entra y sale de la API."""
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, date


# --- Autenticación y Registro ---
class RegistroCandidatoIn(BaseModel):
    nombreCompleto: str
    correo: EmailStr
    contrasena: str
    telefono: str
    ciudad: str  # nombre del municipio, ej. "Medellín"


class RegistroEmpresaIn(BaseModel):
    nombreEmpresa: str
    correo: EmailStr
    contrasena: str
    nit: str
    sector: str  # nombre del sector, ej. "Tecnología"
    ciudad: str


class LoginIn(BaseModel):
    correo: EmailStr
    contrasena: str
    tipo: str  # "candidato" | "empresa"


class UsuarioOut(BaseModel):
    idUsuario: int
    rol: str
    correo: str


class CandidatoOut(BaseModel):
    idCandidato: int
    idUsuario: int
    nombres: str
    apellidos: str
    correo: str
    ciudad: Optional[str] = None
    telefono: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EmpresaOut(BaseModel):
    idEmpresa: int
    idUsuario: int
    nombreEmpresa: str
    correo: str
    nit: str
    sector: Optional[str] = None
    ciudad: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Secciones del CV (Entradas y Salidas) ---
class HabilidadOut(BaseModel):
    idHabilidad: int
    nombre: str
    model_config = ConfigDict(from_attributes=True)


class EducacionOut(BaseModel):
    idEducacion: int
    titulo: str
    institucion: Optional[str] = None
    anio: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class EducacionIn(BaseModel):
    titulo: str
    institucion: Optional[str] = None
    anio: Optional[str] = None


class ProyectoOut(BaseModel):
    idProyecto: int
    titulo: str
    descripcion: Optional[str] = None
    meta: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ProyectoIn(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    meta: Optional[str] = None


class IdiomaOut(BaseModel):
    idIdioma: int
    descripcion: str
    model_config = ConfigDict(from_attributes=True)


class IdiomaIn(BaseModel):
    descripcion: str


class ReferenciaOut(BaseModel):
    idReferencia: int
    nombre: str
    cargo: Optional[str] = None
    contacto: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ReferenciaIn(BaseModel):
    nombre: str
    cargo: Optional[str] = None
    contacto: Optional[str] = None


class SeccionCVOut(BaseModel):
    idSeccion: int
    titulo: str
    contenido: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class SeccionCVIn(BaseModel):
    titulo: str
    contenido: Optional[str] = None


class SeccionCVUpdateIn(BaseModel):
    contenido: str


# --- Actualizaciones del CV ---
class HabilidadesIn(BaseModel):
    habilidades: List[str]   # reemplaza la lista completa, igual que el form original (separadas por coma)


class DatosPersonalesIn(BaseModel):
    nombres: str
    apellidos: str
    tituloProfesional: Optional[str] = None
    ciudad: Optional[str] = None
    correo: Optional[EmailStr] = None
    telefono: Optional[str] = None


class SobreMiIn(BaseModel):
    about: str


class PlantillaIn(BaseModel):
    plantilla: str  # "clasico" | "moderno" | "elegante"


class FotoIn(BaseModel):
    fotoUrl: str  # data URI base64, igual que el FileReader original


# --- CV Completo ---
class CVOut(BaseModel):
    idCandidato: int
    nombres: str
    apellidos: str
    tituloProfesional: Optional[str] = None
    ciudad: Optional[str] = None
    correo: str
    telefono: Optional[str] = None
    about: Optional[str] = None
    fotoUrl: Optional[str] = None
    plantilla: str
    habilidades: List[HabilidadOut]
    educacion: List[EducacionOut]
    proyectos: List[ProyectoOut]
    idiomas: List[IdiomaOut]
    referencias: List[ReferenciaOut]
    secciones: List[SeccionCVOut]

    model_config = ConfigDict(from_attributes=True)


# --- Ofertas ---
class OfertaOut(BaseModel):
    idOferta: int
    titulo: str
    idEmpresa: int
    empresa: str
    ciudad: str
    modalidad: str
    categoria: str
    tipoContrato: str
    descripcion: str
    experienciaMinima: int
    fechaPublicacion: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Postulaciones ---
class PostulacionIn(BaseModel):
    idCandidato: int
    idOferta: int

class PostulacionOut(BaseModel):
    idPostulacion: int
    idOferta: int
    idCandidato: int
    titulo: Optional[str] = None
    empresa: Optional[str] = None
    ciudad: Optional[str] = None
    modalidad: Optional[str] = None
    estado: Optional[str] = None
    vista: bool = False
    fechaPostulacion: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Perfil y Preferencias ---
# NOTA: estos 3 se completaron para que el Perfil del candidato funcione
# de punta a punta (coinciden con lo que usePerfil.ts pide y con lo que
# _armar_perfil()/actualizar_preferencias() en main.py usan). Se
# conservan los campos que ya ten\u00edas (idModalidad/idDisponibilidad,
# modalidad/disponibilidad) por si algo m\u00e1s los sigue usando.

class PerfilDatosIn(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    ciudad: Optional[str] = None  # Nombre del municipio
    tituloProfesional: Optional[str] = None
    correo: Optional[EmailStr] = None
    fechaNacimiento: Optional[date] = None


class PreferenciasIn(BaseModel):
    idModalidad: Optional[int] = None
    idDisponibilidad: Optional[int] = None
    areaInteres: Optional[str] = None
    salarioEsperado: Optional[str] = None
    tipoContratoPreferido: Optional[str] = None  # nombre en catálogo TipoContrato
    jornadaPreferida: Optional[str] = None       # nombre en catálogo JornadaLaboral
    movilidad: Optional[str] = None
    modalidadPreferida: Optional[str] = None     # nombre en catálogo Modalidad
    disponibilidad: Optional[str] = None         # nombre en catálogo Disponibilidad


class PerfilOut(BaseModel):
    idCandidato: int
    idUsuario: int
    nombres: str
    apellidos: str
    correo: str
    telefono: Optional[str] = None
    ciudad: Optional[str] = None
    modalidad: Optional[str] = None
    disponibilidad: Optional[str] = None
    tituloProfesional: Optional[str] = None
    fechaNacimiento: Optional[date] = None
    about: Optional[str] = None
    fotoUrl: Optional[str] = None
    areaInteres: Optional[str] = None
    salarioEsperado: Optional[str] = None
    tipoContratoPreferido: Optional[str] = None
    jornadaPreferida: Optional[str] = None
    movilidad: Optional[str] = None
    modalidadPreferida: Optional[str] = None
    habilidades: List[HabilidadOut] = []
    educacion: List[EducacionOut] = []
    experiencia: List[ProyectoOut] = []
    idiomas: List[IdiomaOut] = []

    model_config = ConfigDict(from_attributes=True)