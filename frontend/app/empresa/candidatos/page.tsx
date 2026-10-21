"use client";

import { useEffect, useState } from "react";
import EmpresaShell from "../EmpresaShell";
import { useAuth } from "@/app/lib/auth-context";
import { apiFetch } from "@/app/lib/api";

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
  const { user } = useAuth();
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  useEffect(() => {
    if (!user?.idEmpresa) return;

    apiFetch<Candidato[]>(`/api/empresa/${user.idEmpresa}/candidatos`)
      .then((data) => {
        if (Array.isArray(data)) setCandidatos(data);
      })
      .catch((err) => console.error("Error al cargar candidatos:", err));
  }, [user]);

  async function cambiarEstadoCandidato(idPostulacion: number, nuevoEstado: string) {
    try {
      await apiFetch(`/api/empresa/postulaciones/${idPostulacion}/estado`, {
        method: "PATCH",
        body: { nuevoEstado },
      });
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Error al cambiar estado");
    }
  }

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
      {/* ... (El resto del diseño visual queda igual que en tu archivo) ... */}
      <div className="misofertas-tabs" style={{ marginBottom: 18 }}>
        <button className="misofertas-tab active" onClick={() => setFiltroEstado("")}>
          <strong>Todos {candidatos.length}</strong>
        </button>
        {/* Botones de tab */}
      </div>

      <div className="vacantes-filters">
        <div className="search-input-wrap">
          <input type="text" placeholder="Buscar candidato u oferta..." value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} />
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

      <div className="candidatos-table-card">
        <div className="candidatos-body">
          {filtrarCandidatos().length === 0 ? (
            <p style={{ fontSize: 14, color: "#667085", padding: 16 }}>No hay candidatos postulados a tus ofertas.</p>
          ) : (
            filtrarCandidatos().map((candidato) => (
              <div className="candidato-row" key={candidato.idPostulacion}>
                <div className="candidato-avatar avatar-blue">
                  {candidato.nombres.charAt(0)}{candidato.apellidos.charAt(0)}
                </div>
                <div className="candidato-info">
                  <h4>{candidato.nombres} {candidato.apellidos}</h4>
                  <p>{candidato.correo}</p>
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
                <button className="btn-solid-sm candidato-ver-perfil" onClick={() => (window.location.href = "/empresa/candidatos")}>
                  Ver perfil
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </EmpresaShell>
  );
}