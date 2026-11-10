from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from dependencies import get_current_user
from models import Usuario, CandidatoHabilidad, CandidatoEducacion, CandidatoProyecto, CandidatoIdioma, CandidatoReferencia, CandidatoSeccionCV, Notificacion, Postulacion, Oferta, TipoContrato, JornadaLaboral, Modalidad, Disponibilidad
from schemas import PerfilOut, PerfilDatosIn, PreferenciasIn, HabilidadesIn, EducacionIn, ProyectoIn, IdiomaIn, ReferenciaIn, SeccionCVIn, SeccionCVUpdateIn, SobreMiIn, FotoIn, DatosPersonalesIn, PlantillaIn, PostulacionOut, HabilidadOut
from utils import _obtener_candidato_completo, _armar_perfil, _buscar_municipio, _verificar_ownership_candidato, _buscar_en_catalogo
from models import CategoriaOferta, EstadoOferta

router = APIRouter(prefix="/api/candidato", tags=["Candidato"])

@router.get("/{id_candidato}/perfil", response_model=PerfilOut)
def obtener_perfil(id_candidato: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    if usuario.rol and usuario.rol.Nombre == "Empresa":
        if not usuario.empresa: raise HTTPException(403, "No tienes permiso.")
        existe = db.query(Postulacion).join(Oferta).filter(Postulacion.IdCandidato == id_candidato, Oferta.IdEmpresa == usuario.empresa.IdEmpresa).first()
        if not existe: raise HTTPException(403, "No tienes permiso para ver este perfil.")
    else:
        _verificar_ownership_candidato(usuario, id_candidato)
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.get("/{id_candidato}/postulaciones", response_model=list[PostulacionOut])
def listar_postulaciones_candidato(id_candidato: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    postulaciones = db.query(Postulacion).options(joinedload(Postulacion.oferta).joinedload(Oferta.empresa), joinedload(Postulacion.oferta).joinedload(Oferta.municipio), joinedload(Postulacion.oferta).joinedload(Oferta.modalidad), joinedload(Postulacion.estado)).filter(Postulacion.IdCandidato == id_candidato).order_by(Postulacion.FechaPostulacion.desc()).all()
    return [PostulacionOut(idPostulacion=p.IdPostulacion, idOferta=p.oferta.IdOferta, idCandidato=id_candidato, titulo=p.oferta.Titulo, empresa=p.oferta.empresa.NombreEmpresa, ciudad=p.oferta.municipio.Nombre, modalidad=p.oferta.modalidad.Nombre, estado=p.estado.Nombre, vista=p.Vista, fechaPostulacion=p.FechaPostulacion, categoria=p.oferta.categoria.Nombre) for p in postulaciones]

@router.put("/{id_candidato}/perfil/datos", response_model=PerfilOut)
def actualizar_datos_perfil(id_candidato: int, body: PerfilDatosIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    if body.nombres is not None: candidato.Nombres = body.nombres
    if body.apellidos is not None: candidato.Apellidos = body.apellidos
    if body.tituloProfesional is not None: candidato.TituloProfesional = body.tituloProfesional
    if body.telefono is not None: candidato.Telefono = body.telefono
    if body.fechaNacimiento is not None: candidato.FechaNacimiento = body.fechaNacimiento
    if body.correo and body.correo != candidato.usuario.Correo:
        if db.query(Usuario).filter(Usuario.Correo == body.correo, Usuario.IdUsuario != candidato.IdUsuario).first(): raise HTTPException(400, "Ese correo ya está en uso")
        candidato.usuario.Correo = body.correo
    if body.ciudad: candidato.IdMunicipio = _buscar_municipio(db, body.ciudad).IdMunicipio
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.put("/{id_candidato}/perfil/preferencias", response_model=PerfilOut)
def actualizar_preferencias(id_candidato: int, body: PreferenciasIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    if body.areaInteres is not None: candidato.AreaInteres = body.areaInteres
    if body.salarioEsperado is not None: candidato.SalarioEsperado = body.salarioEsperado
    if body.movilidad is not None: candidato.Movilidad = body.movilidad
    if body.tipoContratoPreferido: candidato.IdTipoContratoPreferido = _buscar_en_catalogo(db, TipoContrato, "Nombre", body.tipoContratoPreferido, "Tipo de contrato").IdTipoContrato
    if body.jornadaPreferida: candidato.IdJornadaPreferida = _buscar_en_catalogo(db, JornadaLaboral, "Nombre", body.jornadaPreferida, "Jornada").IdJornada
    if body.modalidadPreferida: candidato.IdModalidad = _buscar_en_catalogo(db, Modalidad, "Nombre", body.modalidadPreferida, "Modalidad").IdModalidad
    elif body.idModalidad is not None: candidato.IdModalidad = body.idModalidad
    if body.disponibilidad: candidato.IdDisponibilidad = _buscar_en_catalogo(db, Disponibilidad, "Nombre", body.disponibilidad, "Disponibilidad").IdDisponibilidad
    elif body.idDisponibilidad is not None: candidato.IdDisponibilidad = body.idDisponibilidad
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.put("/{id_candidato}/cv/sobre-mi", response_model=PerfilOut)
def actualizar_sobre_mi(id_candidato: int, body: SobreMiIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.AcercaDe = body.about
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.put("/{id_candidato}/cv/foto", response_model=PerfilOut)
def actualizar_foto(id_candidato: int, body: FotoIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.FotoUrl = body.fotoUrl
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.get("/{id_candidato}/cv/habilidades", response_model=list[HabilidadOut])
def obtener_habilidades(id_candidato: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    return db.query(CandidatoHabilidad).filter(CandidatoHabilidad.IdCandidato == id_candidato).all()

@router.put("/{id_candidato}/cv/habilidades", response_model=PerfilOut)
def actualizar_habilidades(id_candidato: int, body: HabilidadesIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    db.query(CandidatoHabilidad).filter(CandidatoHabilidad.IdCandidato == id_candidato).delete()
    for nombre in body.habilidades: db.add(CandidatoHabilidad(IdCandidato=id_candidato, Nombre=nombre.strip()))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.post("/{id_candidato}/cv/educacion", response_model=PerfilOut)
def crear_educacion(id_candidato: int, body: EducacionIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    db.add(CandidatoEducacion(IdCandidato=id_candidato, Titulo=body.titulo, Institucion=body.institucion, Anio=body.anio))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.delete("/{id_candidato}/cv/educacion/{id_educacion}", response_model=PerfilOut)
def eliminar_educacion(id_candidato: int, id_educacion: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    educacion = db.query(CandidatoEducacion).filter(CandidatoEducacion.IdEducacion == id_educacion, CandidatoEducacion.IdCandidato == id_candidato).first()
    if not educacion: raise HTTPException(404, "Educación no encontrada")
    db.delete(educacion)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.put("/{id_candidato}/cv/educacion/{id_educacion}", response_model=PerfilOut)
def actualizar_educacion(id_candidato: int, id_educacion: int, body: EducacionIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    educacion = db.query(CandidatoEducacion).filter(CandidatoEducacion.IdEducacion == id_educacion, CandidatoEducacion.IdCandidato == id_candidato).first()
    if not educacion: raise HTTPException(404, "Educación no encontrada")
    educacion.Titulo = body.titulo
    educacion.Institucion = body.institucion
    educacion.Anio = body.anio
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.post("/{id_candidato}/cv/proyectos", response_model=PerfilOut)
def crear_proyecto(id_candidato: int, body: ProyectoIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    db.add(CandidatoProyecto(IdCandidato=id_candidato, Titulo=body.titulo, Descripcion=body.descripcion, Meta=body.meta))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.delete("/{id_candidato}/cv/proyectos/{id_proyecto}", response_model=PerfilOut)
def eliminar_proyecto(id_candidato: int, id_proyecto: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    proyecto = db.query(CandidatoProyecto).filter(CandidatoProyecto.IdProyecto == id_proyecto, CandidatoProyecto.IdCandidato == id_candidato).first()
    if not proyecto: raise HTTPException(404, "Proyecto no encontrado")
    db.delete(proyecto)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.put("/{id_candidato}/cv/proyectos/{id_proyecto}", response_model=PerfilOut)
def actualizar_proyecto(id_candidato: int, id_proyecto: int, body: ProyectoIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    proyecto = db.query(CandidatoProyecto).filter(CandidatoProyecto.IdProyecto == id_proyecto, CandidatoProyecto.IdCandidato == id_candidato).first()
    if not proyecto: raise HTTPException(404, "Proyecto no encontrado")
    proyecto.Titulo = body.titulo
    proyecto.Descripcion = body.descripcion
    proyecto.Meta = body.meta
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.post("/{id_candidato}/cv/idiomas", response_model=PerfilOut)
def crear_idioma(id_candidato: int, body: IdiomaIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    db.add(CandidatoIdioma(IdCandidato=id_candidato, Descripcion=body.descripcion))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.delete("/{id_candidato}/cv/idiomas/{id_idioma}", response_model=PerfilOut)
def eliminar_idioma(id_candidato: int, id_idioma: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    idioma = db.query(CandidatoIdioma).filter(CandidatoIdioma.IdIdioma == id_idioma, CandidatoIdioma.IdCandidato == id_candidato).first()
    if not idioma: raise HTTPException(404, "Idioma no encontrado")
    db.delete(idioma)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.put("/{id_candidato}/cv/idiomas/{id_idioma}", response_model=PerfilOut)
def actualizar_idioma(id_candidato: int, id_idioma: int, body: IdiomaIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    idioma = db.query(CandidatoIdioma).filter(CandidatoIdioma.IdIdioma == id_idioma, CandidatoIdioma.IdCandidato == id_candidato).first()
    if not idioma: raise HTTPException(404, "Idioma no encontrado")
    idioma.Descripcion = body.descripcion
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.get("/{id_candidato}/cv", response_model=PerfilOut)
def obtener_cv(id_candidato: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.put("/{id_candidato}/cv/datos-personales", response_model=PerfilOut)
def actualizar_datos_personales_cv(id_candidato: int, body: DatosPersonalesIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.Nombres = body.nombres
    candidato.Apellidos = body.apellidos
    candidato.TituloProfesional = body.tituloProfesional
    candidato.Telefono = body.telefono
    if body.correo and body.correo != candidato.usuario.Correo:
        if db.query(Usuario).filter(Usuario.Correo == body.correo, Usuario.IdUsuario != candidato.IdUsuario).first(): raise HTTPException(400, "Ese correo ya está en uso")
        candidato.usuario.Correo = body.correo
    if body.ciudad: candidato.IdMunicipio = _buscar_municipio(db, body.ciudad).IdMunicipio
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.put("/{id_candidato}/cv/plantilla", response_model=PerfilOut)
def actualizar_plantilla(id_candidato: int, body: PlantillaIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    candidato.PlantillaCV = body.plantilla
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.post("/{id_candidato}/cv/referencias", response_model=PerfilOut)
def crear_referencia(id_candidato: int, body: ReferenciaIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    db.add(CandidatoReferencia(IdCandidato=id_candidato, Nombre=body.nombre, Cargo=body.cargo, Contacto=body.contacto))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.delete("/{id_candidato}/cv/referencias/{id_referencia}", response_model=PerfilOut)
def eliminar_referencia(id_candidato: int, id_referencia: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    referencia = db.query(CandidatoReferencia).filter(CandidatoReferencia.IdReferencia == id_referencia, CandidatoReferencia.IdCandidato == id_candidato).first()
    if not referencia: raise HTTPException(404, "Referencia no encontrada")
    db.delete(referencia)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.put("/{id_candidato}/cv/referencias/{id_referencia}", response_model=PerfilOut)
def actualizar_referencia(id_candidato: int, id_referencia: int, body: ReferenciaIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    referencia = db.query(CandidatoReferencia).filter(CandidatoReferencia.IdReferencia == id_referencia, CandidatoReferencia.IdCandidato == id_candidato).first()
    if not referencia: raise HTTPException(404, "Referencia no encontrada")
    referencia.Nombre = body.nombre
    referencia.Cargo = body.cargo
    referencia.Contacto = body.contacto
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.post("/{id_candidato}/cv/secciones", response_model=PerfilOut)
def crear_seccion(id_candidato: int, body: SeccionCVIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    candidato = _obtener_candidato_completo(id_candidato, db)
    siguiente_orden = len(candidato.secciones_cv or []) + 1
    db.add(CandidatoSeccionCV(IdCandidato=id_candidato, Titulo=body.titulo, Contenido=body.contenido, Orden=siguiente_orden))
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.put("/{id_candidato}/cv/secciones/{id_seccion}", response_model=PerfilOut)
def actualizar_seccion(id_candidato: int, id_seccion: int, body: SeccionCVUpdateIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    seccion = db.query(CandidatoSeccionCV).filter(CandidatoSeccionCV.IdSeccion == id_seccion, CandidatoSeccionCV.IdCandidato == id_candidato).first()
    if not seccion: raise HTTPException(404, "Sección no encontrada")
    if body.titulo is not None: seccion.Titulo = body.titulo
    if body.contenido is not None: seccion.Contenido = body.contenido
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.delete("/{id_candidato}/cv/secciones/{id_seccion}", response_model=PerfilOut)
def eliminar_seccion(id_candidato: int, id_seccion: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    seccion = db.query(CandidatoSeccionCV).filter(CandidatoSeccionCV.IdSeccion == id_seccion, CandidatoSeccionCV.IdCandidato == id_candidato).first()
    if not seccion: raise HTTPException(404, "Sección no encontrada")
    db.delete(seccion)
    db.commit()
    return _armar_perfil(_obtener_candidato_completo(id_candidato, db))

@router.get("/{id_candidato}/notificaciones")
def obtener_notificaciones_candidato(id_candidato: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    notificaciones = db.query(Notificacion).filter((Notificacion.IdCandidato == id_candidato) | (Notificacion.IdCandidato == None)).order_by(Notificacion.Fecha.desc()).all()
    return [{"idNotificacion": n.IdNotificacion, "titulo": n.Titulo, "mensaje": n.Mensaje, "leida": n.Leida, "fecha": n.Fecha} for n in notificaciones]

@router.patch("/{id_candidato}/notificaciones/{id_notificacion}/leer")
def marcar_notificacion_leida_candidato(id_candidato: int, id_notificacion: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    noti = db.query(Notificacion).filter(Notificacion.IdNotificacion == id_notificacion, Notificacion.IdCandidato == id_candidato).first()
    if not noti: raise HTTPException(404, "Notificación no encontrada.")
    noti.Leida = True
    db.commit()
    return {"idNotificacion": noti.IdNotificacion, "leida": True}

@router.patch("/{id_candidato}/notificaciones/leer-todas")
def marcar_todas_leidas_candidato(id_candidato: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    _verificar_ownership_candidato(usuario, id_candidato)
    actualizadas = db.query(Notificacion).filter(Notificacion.IdCandidato == id_candidato, Notificacion.Leida == False).update({"Leida": True})
    db.commit()
    return {"actualizadas": actualizadas}

@router.get("/busquedas-guardadas")
def obtener_busquedas_guardadas(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    categorias = db.query(CategoriaOferta).all()
    publicada = db.query(EstadoOferta).filter(EstadoOferta.Nombre == "Publicada").first()
    return [
        {
            "titulo": c.Nombre,
            "total": db.query(Oferta).filter(
                Oferta.IdCategoria == c.IdCategoria,
                Oferta.IdEstadoOferta == publicada.IdEstadoOferta if publicada else None,
            ).count(),
        }
        for c in categorias
    ]