"""
SeedWork - Router del panel de administrador (Inicio).

Usa SQL directo con sqlalchemy.text(), de modo que NO depende de tus modelos.
Adaptado a tu proyecto: usa get_db (database.py) y get_current_admin (dependencies.py).
"""
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_admin

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)


def id_administrador(admin) -> int:
    """get_current_admin devuelve la tupla (usuario, administrador)."""
    _usuario, administrador = admin
    return administrador.IdAdministrador


class RechazoIn(BaseModel):
    motivo: Optional[str] = None


class EstadoUsuarioAdminIn(BaseModel):
    estado: Literal["Activo", "Suspendido"]


def uno(db: Session, sql: str, **params):
    return db.execute(text(sql), params).scalar() or 0


@router.get("/usuarios")
def listar_usuarios(
    tipo: Literal["candidatos", "empresas"] = "candidatos",
    q: str = Query("", max_length=100),
    ciudad: str = Query("", max_length=120),
    estado: str = Query("", max_length=30),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Lista candidatos o empresas con búsqueda, filtros y paginación."""
    if tipo == "candidatos":
        fuente = """
            SELECT u.IdUsuario AS id_usuario, c.IdCandidato AS id_perfil,
                   'candidato' AS tipo, CONCAT_WS(' ', c.Nombres, c.Apellidos) AS nombre,
                   u.Correo AS correo, m.Nombre AS municipio,
                   CONCAT_WS(', ', m.Nombre, d.Nombre) AS ciudad,
                   eu.Nombre AS estado, u.FechaCreacion AS registro,
                   NULL AS sector, NULL AS vacantes_activas, NULL AS verificacion
            FROM Candidato c
            JOIN Usuario u ON u.IdUsuario = c.IdUsuario
            LEFT JOIN EstadoUsuario eu ON eu.IdEstadoUsuario = u.IdEstadoUsuario
            LEFT JOIN Municipio m ON m.IdMunicipio = c.IdMunicipio
            LEFT JOIN Departamento d ON d.IdDepartamento = m.IdDepartamento
        """
    else:
        fuente = """
            SELECT u.IdUsuario AS id_usuario, em.IdEmpresa AS id_perfil,
                   'empresa' AS tipo, em.NombreEmpresa AS nombre,
                   u.Correo AS correo, m.Nombre AS municipio,
                   CONCAT_WS(', ', m.Nombre, d.Nombre) AS ciudad,
                   eu.Nombre AS estado, u.FechaCreacion AS registro,
                   se.Nombre AS sector,
                   (SELECT COUNT(*) FROM Oferta o
                    JOIN EstadoOferta eo ON eo.IdEstadoOferta = o.IdEstadoOferta
                    WHERE o.IdEmpresa = em.IdEmpresa AND eo.Nombre = 'Publicada') AS vacantes_activas,
                   ev.Nombre AS verificacion
            FROM Empresa em
            JOIN Usuario u ON u.IdUsuario = em.IdUsuario
            LEFT JOIN EstadoUsuario eu ON eu.IdEstadoUsuario = u.IdEstadoUsuario
            LEFT JOIN Municipio m ON m.IdMunicipio = em.IdMunicipio
            LEFT JOIN Departamento d ON d.IdDepartamento = m.IdDepartamento
            LEFT JOIN SectorEmpresa se ON se.IdSectorEmpresa = em.IdSectorEmpresa
            LEFT JOIN EstadoVerificacionEmpresa ev ON ev.IdEstadoVerificacion = em.IdEstadoVerificacion
        """

    filtros = """
        WHERE (:q = '' OR nombre LIKE :busqueda OR correo LIKE :busqueda)
          AND (:ciudad = '' OR municipio = :ciudad)
          AND (:estado = '' OR estado = :estado)
    """
    params = {
        "q": q.strip(),
        "busqueda": f"%{q.strip()}%",
        "ciudad": ciudad,
        "estado": estado,
        "limite": limite,
        "offset": (pagina - 1) * limite,
    }
    total = db.execute(
        text(f"SELECT COUNT(*) FROM ({fuente}) AS usuarios {filtros}"), params
    ).scalar() or 0
    filas = db.execute(
        text(f"SELECT * FROM ({fuente}) AS usuarios {filtros} "
             "ORDER BY registro DESC LIMIT :limite OFFSET :offset"),
        params,
    ).mappings().all()

    if tipo == "candidatos":
        sql_ciudades = """
            SELECT DISTINCT m.Nombre FROM Candidato c
            JOIN Usuario u ON u.IdUsuario = c.IdUsuario
            JOIN Municipio m ON m.IdMunicipio = c.IdMunicipio
            ORDER BY m.Nombre
        """
    else:
        sql_ciudades = """
            SELECT DISTINCT m.Nombre FROM Empresa em
            JOIN Usuario u ON u.IdUsuario = em.IdUsuario
            JOIN Municipio m ON m.IdMunicipio = em.IdMunicipio
            ORDER BY m.Nombre
        """
    ciudades = db.execute(text(sql_ciudades)).scalars().all()

    items = []
    for fila in filas:
        item = dict(fila)
        item["registro"] = item["registro"].isoformat() if item["registro"] else None
        items.append(item)

    return {
        "items": items,
        "total": total,
        "pagina": pagina,
        "paginas": max(1, (total + limite - 1) // limite),
        "ciudades": ciudades,
    }


@router.patch("/usuarios/{id_usuario}/estado")
def cambiar_estado_usuario(
    id_usuario: int,
    datos: EstadoUsuarioAdminIn,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Activa o suspende una cuenta candidata/empresa; evita bloquear al admin actual."""
    if id_usuario == admin[1].IdUsuario:
        raise HTTPException(400, "No puedes cambiar el estado de tu propia cuenta.")

    usuario = db.execute(text("""
        SELECT u.IdUsuario, eu.Nombre AS estado, r.Nombre AS rol
        FROM Usuario u
        JOIN Rol r ON r.IdRol = u.IdRol
        JOIN EstadoUsuario eu ON eu.IdEstadoUsuario = u.IdEstadoUsuario
        WHERE u.IdUsuario = :id
    """), {"id": id_usuario}).mappings().first()
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado.")
    if usuario["rol"] not in ("Candidato", "Empresa"):
        raise HTTPException(403, "Solo puedes cambiar el estado de candidatos o empresas.")
    if usuario["estado"] == datos.estado:
        return {"id_usuario": id_usuario, "estado": datos.estado}

    db.execute(text("""
        UPDATE Usuario
        SET IdEstadoUsuario = (
            SELECT IdEstadoUsuario FROM EstadoUsuario WHERE Nombre = :estado
        )
        WHERE IdUsuario = :id
    """), {"estado": datos.estado, "id": id_usuario})
    db.commit()
    return {"id_usuario": id_usuario, "estado": datos.estado}


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    tarjetas = {
        # Candidatos y empresas registrados en los últimos 7 días (sin contar admins)
        "usuarios_nuevos": uno(db, """
            SELECT COUNT(*) FROM Usuario u
            JOIN Rol r ON r.IdRol = u.IdRol
            WHERE r.Nombre IN ('Empresa', 'Candidato')
              AND u.FechaCreacion >= NOW() - INTERVAL 7 DAY
        """),
        "vacantes_pendientes": uno(db, """
            SELECT COUNT(*) FROM Oferta o
            JOIN EstadoOferta e ON e.IdEstadoOferta = o.IdEstadoOferta
            WHERE e.Nombre = 'Por aprobar'
        """),
        "reportes_activos": uno(db, """
            SELECT COUNT(*) FROM Reporte r
            JOIN EstadoReporte er ON er.IdEstadoReporte = r.IdEstadoReporte
            WHERE er.Nombre IN ('Pendiente', 'En revisión')
        """),
        "postulaciones_activas": uno(db, """
            SELECT COUNT(*) FROM Postulacion p
            JOIN EstadoPostulacion ep ON ep.IdEstadoPostulacion = p.IdEstadoPostulacion
            WHERE ep.Nombre NOT IN ('Contratado', 'Rechazado')
        """),
    }

    # Vacante "cubierta" = ya tiene tantos contratados como cupos (Oferta.Vacantes).
    # Se mide sobre las ofertas que ya pasaron por aprobación.
    total_ofertas = uno(db, """
        SELECT COUNT(*) FROM Oferta o
        JOIN EstadoOferta e ON e.IdEstadoOferta = o.IdEstadoOferta
        WHERE e.Nombre IN ('Publicada', 'Pausada', 'Cerrada')
    """)
    cubiertas = uno(db, """
        SELECT COUNT(*) FROM (
            SELECT o.IdOferta
            FROM Oferta o
            JOIN EstadoOferta e ON e.IdEstadoOferta = o.IdEstadoOferta
            LEFT JOIN Postulacion p ON p.IdOferta = o.IdOferta
            LEFT JOIN EstadoPostulacion ep
                   ON ep.IdEstadoPostulacion = p.IdEstadoPostulacion AND ep.Nombre = 'Contratado'
            WHERE e.Nombre IN ('Publicada', 'Pausada', 'Cerrada')
            GROUP BY o.IdOferta, o.Vacantes
            HAVING COUNT(ep.IdEstadoPostulacion) >= o.Vacantes
        ) t
    """)

    salud = {
        "disponibilidad": 97,  # valor fijo: no sale de la BD (monitoreo del servidor)
        "candidatos_activos": uno(db, """
            SELECT COUNT(*) FROM Candidato c
            JOIN Usuario u ON u.IdUsuario = c.IdUsuario
            JOIN EstadoUsuario eu ON eu.IdEstadoUsuario = u.IdEstadoUsuario
            WHERE eu.Nombre = 'Activo'
        """),
        "empresas_activas": uno(db, """
            SELECT COUNT(*) FROM Empresa em
            JOIN Usuario u ON u.IdUsuario = em.IdUsuario
            JOIN EstadoUsuario eu ON eu.IdEstadoUsuario = u.IdEstadoUsuario
            WHERE eu.Nombre = 'Activo'
        """),
        "vacantes_cubiertas_pct": round(cubiertas * 100 / total_ofertas) if total_ofertas else 0,
    }

    vacantes = db.execute(text("""
        SELECT o.IdOferta AS id, o.Titulo AS titulo, em.NombreEmpresa AS empresa,
               m.Nombre AS ciudad, d.Nombre AS departamento, mo.Nombre AS modalidad,
               o.FechaPublicacion AS fecha
        FROM Oferta o
        JOIN EstadoOferta e  ON e.IdEstadoOferta = o.IdEstadoOferta
        JOIN Empresa em      ON em.IdEmpresa = o.IdEmpresa
        JOIN Municipio m     ON m.IdMunicipio = o.IdMunicipio
        JOIN Departamento d  ON d.IdDepartamento = m.IdDepartamento
        JOIN Modalidad mo    ON mo.IdModalidad = o.IdModalidad
        WHERE e.Nombre = 'Por aprobar'
        ORDER BY o.FechaPublicacion DESC
        LIMIT 5
    """)).mappings().all()

    empresas = db.execute(text("""
        SELECT em.IdEmpresa AS id, em.NombreEmpresa AS titulo,
               m.Nombre AS ciudad, d.Nombre AS departamento,
               em.FechaRegistro AS fecha
        FROM Empresa em
        JOIN Municipio m     ON m.IdMunicipio = em.IdMunicipio
        JOIN Departamento d  ON d.IdDepartamento = m.IdDepartamento
        WHERE em.IdEstadoVerificacion = (
            SELECT IdEstadoVerificacion FROM EstadoVerificacionEmpresa WHERE Nombre = 'Pendiente')
        ORDER BY em.FechaRegistro DESC
        LIMIT 5
    """)).mappings().all()

    pendientes = [
        {
            "tipo": "vacante",
            "id": v["id"],
            "titulo": v["titulo"],
            "subtitulo": f'{v["empresa"]} · Vacante nueva',
            "ubicacion": f'{v["ciudad"]}, {v["departamento"]}',
            "modalidad": v["modalidad"],
            "fecha": v["fecha"].isoformat() if v["fecha"] else None,
        }
        for v in vacantes
    ] + [
        {
            "tipo": "empresa",
            "id": e["id"],
            "titulo": e["titulo"],
            "subtitulo": "Empresa nueva · Solicita verificación",
            "ubicacion": f'{e["ciudad"]}, {e["departamento"]}',
            "modalidad": None,
            "fecha": e["fecha"].isoformat() if e["fecha"] else None,
        }
        for e in empresas
    ]
    pendientes.sort(key=lambda p: p["fecha"] or "", reverse=True)

    return {"tarjetas": tarjetas, "salud": salud, "pendientes": pendientes}


def _revisar_vacante(db: Session, admin, oferta_id: int, nuevo_estado: str, motivo: Optional[str]):
    res = db.execute(text("""
        UPDATE Oferta
        SET IdEstadoOferta = (SELECT IdEstadoOferta FROM EstadoOferta WHERE Nombre = :nuevo),
            MotivoRechazo  = :motivo,
            RevisadaPor    = :adm,
            FechaRevision  = NOW()
        WHERE IdOferta = :id
          AND IdEstadoOferta = (SELECT IdEstadoOferta FROM EstadoOferta WHERE Nombre = 'Por aprobar')
    """), {"nuevo": nuevo_estado, "motivo": motivo, "adm": id_administrador(admin), "id": oferta_id})
    db.commit()

    if res.rowcount == 0:
        raise HTTPException(404, "La vacante no existe o ya no está por aprobar")
    return {"id": oferta_id, "estado": nuevo_estado}


@router.patch("/vacantes/{oferta_id}/aprobar")
def aprobar_vacante(
    oferta_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return _revisar_vacante(db, admin, oferta_id, "Publicada", None)


@router.patch("/vacantes/{oferta_id}/rechazar")
def rechazar_vacante(
    oferta_id: int,
    datos: Optional[RechazoIn] = None,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return _revisar_vacante(db, admin, oferta_id, "Rechazada", datos.motivo if datos else None)


@router.patch("/empresas/{empresa_id}/verificar")
def verificar_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    res = db.execute(text("""
        UPDATE Empresa
        SET IdEstadoVerificacion = (
                SELECT IdEstadoVerificacion FROM EstadoVerificacionEmpresa WHERE Nombre = 'Verificada'),
            Verificada = TRUE,
            FechaVerificacion = NOW(),
            VerificadaPor = :adm,
            MotivoRechazoVerificacion = NULL
        WHERE IdEmpresa = :id
          AND IdEstadoVerificacion = (
                SELECT IdEstadoVerificacion FROM EstadoVerificacionEmpresa WHERE Nombre = 'Pendiente')
    """), {"adm": id_administrador(admin), "id": empresa_id})
    db.commit()

    if res.rowcount == 0:
        raise HTTPException(404, "La empresa no existe o ya fue revisada")
    return {"id": empresa_id, "verificada": True}
