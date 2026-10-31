"""Schemas Pydantic: la 'forma' del JSON que entra y sale de la API."""
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, List, Literal
from datetime import datetime, date

# ============================================================
# AUTENTICACIÓN Y REGISTRO
# ============================================================
class RegistroCandidatoIn(BaseModel):
    nombreCompleto: str
    correo: EmailStr
    contrasena: str = Field(min_length=8, max_length=128)
    telefono: str
    ciudad: str  # nombre del municipio, ej. "Medellín"

class RegistroEmpresaIn(BaseModel):
    nombreEmpresa: str
    correo: EmailStr
    contrasena: str = Field(min_length=8, max_length=128)
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
    fotoUrl: Optional[str] = None

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

# ============================================================
# NUEVOS SCHEMAS DE AUTENTICACIÓN (Tokens y 2FA)
# ============================================================
class LoginTokenIn(BaseModel):
    correo: EmailStr
    contrasena: str
    tipo: Literal["candidato", "empresa"]

class AdminLoginIn(BaseModel):
    correo: EmailStr
    contrasena: str

class AdminLoginChallengeOut(BaseModel):
    dos_fa_requerido: bool = True
    challenge_token: str
    message: Optional[str] = None

class AdminLogin2FAIn(BaseModel):
    challenge_token: str = Field(min_length=20)
    codigo: str = Field(min_length=6, max_length=20)

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class MeOut(BaseModel):
    idUsuario: int
    correo: str
    rol: str
    tipo: str
    idCandidato: Optional[int] = None
    idEmpresa: Optional[int] = None
    idAdministrador: Optional[int] = None
    totpHabilitado: bool = False

class Setup2FAOut(BaseModel):
    secreto: str
    qr_uri: str

class Enable2FAIn(BaseModel):
    codigo: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")

class Enable2FAOut(BaseModel):
    message: str
    backup_codes: list[str]

class Disable2FAIn(BaseModel):
    contrasena: str = Field(min_length=1)
    codigo: str = Field(min_length=6, max_length=20)

class RegenerateBackupOut(BaseModel):
    message: str
    backup_codes: list[str]

# ============================================================
# RECUPERACIÓN DE CONTRASEÑA
# ============================================================
class OlvidePasswordIn(BaseModel):
    correo: EmailStr

class RestablecerPasswordIn(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    contrasena: str = Field(min_length=8, max_length=128)

# ============================================================
# SECCIONES DEL CV (Entradas y Salidas)
# ============================================================
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
    titulo: Optional[str] = None
    contenido: Optional[str] = None

# ============================================================
# ACTUALIZACIONES DEL CV
# ============================================================
class HabilidadesIn(BaseModel):
    habilidades: List[str]

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
    plantilla: str

class FotoIn(BaseModel):
    fotoUrl: str

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

# ============================================================
# OFERTAS Y POSTULACIONES
# ============================================================
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

# ============================================================
# PERFIL Y PREFERENCIAS
# ============================================================
class PerfilDatosIn(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    ciudad: Optional[str] = None
    tituloProfesional: Optional[str] = None
    correo: Optional[EmailStr] = None
    fechaNacimiento: Optional[date] = None

class PreferenciasIn(BaseModel):
    idModalidad: Optional[int] = None
    idDisponibilidad: Optional[int] = None
    areaInteres: Optional[str] = None
    salarioEsperado: Optional[str] = None
    tipoContratoPreferido: Optional[str] = None
    jornadaPreferida: Optional[str] = None
    movilidad: Optional[str] = None
    modalidadPreferida: Optional[str] = None
    disponibilidad: Optional[str] = None

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
    plantilla: str = "clasico"
    proyectos: List[ProyectoOut] = []
    referencias: List[ReferenciaOut] = []
    secciones: List[SeccionCVOut] = []

    model_config = ConfigDict(from_attributes=True)