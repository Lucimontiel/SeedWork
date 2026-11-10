from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from models import Usuario, Candidato, Municipio
from schemas import PerfilOut, HabilidadOut, EducacionOut, ProyectoOut, IdiomaOut, ReferenciaOut, SeccionCVOut

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