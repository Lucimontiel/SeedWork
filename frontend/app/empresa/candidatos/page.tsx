"use client";

import { useEffect, useState } from "react";
import EmpresaShell from "../EmpresaShell";
import { getSession } from "../../lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type Candidato = {
  idPostulacion: number;
  idCandidato: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  tituloOferta: string;
  estado: string;
  fechaPostulacion: string;
};

export default function CandidatosEmpresaPage() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) return;

    fetch(`${API_BASE}/api/empresa/${session.id}/candidatos`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCandidatos(data);
      })
      .catch(() => {});
  }, []);

  // Función para cambiar el estado
  async function cambiarEstadoCandidato(idPostulacion: number, nuevoEstado: string) {
    const resp = await fetch(`${API_BASE}/api/empresa/postulaciones/${idPostulacion}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuevoEstado }),
    });

    if (resp.ok) {
      window.location.reload();
    } else {
      const data = await resp.json().catch(() => null);
      alert(data?.detail || "Error al cambiar estado");
    }
  }

  // Función para filtrar
  function filtrarCandidatos() {
    return candidatos.filter((candidato) => {
      const coincideNombre = (candidato.nombres + " " + candidato.apellidos).toLowerCase().includes(filtroBusqueda.toLowerCase());
      const coincideTitulo = candidato.tituloOferta.toLowerCase().includes(filtroBusqueda.toLowerCase());
      const coincideEstado = filtroEstado ? candidato.estado === filtroEstado : true;
      return (coincideNombre || coincideTitulo) && coincideEstado;
    });
  }

  return (
    <EmpresaShell pageTitle="Candidatos" pageSubtitle="Explora y gestiona los candidatos que se han postulado a tus ofertas">
      {/* Tabs por estado */}
      <div className="misofertas-tabs" style={{ marginBottom: 18 }}>
        <button className="misofertas-tab active" onClick={() => setFiltroEstado("")}>
          <strong>Todos {candidatos.length}</strong>
        </button>
        <button className="misofertas-tab" onClick={() => setFiltroEstado("Nuevo")}>
          <strong>Nuevos</strong>
        </button>
        <button className="misofertas-tab" onClick={() => setFiltroEstado("En proceso")}>
          <strong>En proceso</strong>
        </button>
        <button className="misofertas-tab" onClick={() => setFiltroEstado("Preseleccionado")}>
          <strong>Preseleccionados</strong>
        </button>
        <button className="misofertas-tab" onClick={() => setFiltroEstado("Rechazado")}>
          <strong>Rechazados</strong>
        </button>
      </div>

      {/* Filtros */}
      <div className="vacantes-filters">
        <div className="search-input-wrap">
          <input
            type="text"
            placeholder="Buscar candidato u oferta..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
          />
          <svg viewBox="0 0 20 20"><circle cx="9" cy="9" r="6"/><path d="M17 17l-4-4"/></svg>
        </div>
        <select className="filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Estado</option>
          <option value="En revisión">En revisión</option>
          <option value="Entrevista">Entrevista</option>
          <option value="Preseleccionado">Preseleccionado</option>
          <option value="Contratado">Contratado</option>
          <option value="Rechazado">Rechazado</option>
        </select>
      </div>

      {/* Lista de candidatos */}
      <div className="candidatos-table-card">
        <div className="candidatos-body" id="candidatosBody">
          {filtrarCandidatos().length === 0 ? (
            <p style={{ fontSize: 14, color: "#667085", padding: 16 }}>No hay candidatos postulados a tus ofertas.</p>
          ) : (
            <>
              {filtrarCandidatos().map((candidato) => (
                <div className="candidato-row" key={candidato.idPostulacion}>
                  <div className="candidato-avatar avatar-blue">
                    {candidato.nombres.charAt(0)}{candidato.apellidos.charAt(0)}
                  </div>
                  <div className="candidato-info">
                    <h4>{candidato.nombres} {candidato.apellidos}</h4>
                    <p>{candidato.correo}</p>
                    <div className="tag-row">
                      <span className="tag">Sin experiencia</span>
                      <span className="tag">Estudiante</span>
                    </div>
                  </div>
                  <div className="candidato-offer">
                    <strong>{candidato.tituloOferta}</strong>
                    <span>Publicado el {new Date(candidato.fechaPostulacion).toLocaleDateString()}</span>
                  </div>
                  <select className="candidato-estado-select" value="" onChange={(e) => cambiarEstadoCandidato(candidato.idPostulacion, e.target.value)}>
                    <option value="">Estado</option>
                    <option value="En revisión">En revisión</option>
                    <option value="Entrevista">Entrevista</option>
                    <option value="Preseleccionado">Preseleccionado</option>
                    <option value="Contratado">Contratado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                  <button className="btn-solid-sm candidato-ver-perfil" onClick={() => (window.location.href = "/candidato/perfil")}>
                    Ver perfil
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Paginación */}
        <div className="misofertas-pagination">
          <button className="misofertas-page-arrow" aria-label="Página anterior"><svg viewBox="0 0 20 20"><path d="M12 5l-5 5 5 5"/></svg></button>
          <button className="misofertas-page-num active">1</button>
          <button className="misofertas-page-num">2</button>
          <button className="misofertas-page-num">3</button>
          <button className="misofertas-page-arrow" aria-label="Página siguiente"><svg viewBox="0 0 20 20"><path d="M8 5l5 5-5 5"/></svg></button>
        </div>
      </div>
    </EmpresaShell>
  );
}