"use client";

import { useEffect, useState } from "react";
import AdministradorShell from "../AdministradorShell";
import { apiFetch } from "../../lib/api";
import { Pagination } from "../../lib/Pagination";

type Vacante = {
  idOferta: number;
  titulo: string;
  empresa: string;
  ciudad: string;
  modalidad: string;
  estado: string;
};

const AVATAR_COLORS = ["#3B6BF5", "#1C9A5B", "#8B5CF6", "#6B7385", "#B5750C"];

function colorForEmpresa(nombre: string) {
  let hash = 0;
  for (const ch of nombre) hash = (hash + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}
function inicialesEmpresa(nombre: string) {
  return nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}
function badgeClaseParaEstado(estado: string) {
  if (estado === "Publicada") return "badge-green";
  if (estado === "Por aprobar" || estado === "Pausada") return "badge-amber";
  return "badge-red";
}

export default function VacantesAdminPage() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroModalidad, setFiltroModalidad] = useState("");
  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function cargar() {
    try {
      // Ahora esperamos un objeto con items y pages
      const data = await apiFetch<{ items: Vacante[], pages: number }>(`/api/admin/vacantes?page=${page}&limit=15`);
      setVacantes(data.items);
      setTotalPages(data.pages);
    } catch (e: any) {
      mostrarToast("Error al cargar vacantes: " + e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [page]);

  async function cambiarEstado(idOferta: number, nuevoEstado: string) {
    if (nuevoEstado === "Rechazada" && !confirm("¿Seguro que deseas rechazar esta vacante?")) return;
    
    setProcesando(idOferta);
    try {
      await apiFetch(`/api/admin/vacantes/${idOferta}/estado`, {
        method: "PATCH",
        body: { nuevoEstado },
      });
      const mensajes: Record<string, string> = {
        Publicada: "Vacante aprobada y publicada",
        Rechazada: "Vacante rechazada",
        Pausada: "Vacante pausada",
      };
      mostrarToast(mensajes[nuevoEstado] || "Vacante actualizada");
      await cargar();
    } catch (e: any) {
      mostrarToast("Error: " + e.message);
    } finally {
      setProcesando(null);
    }
  }

  // Filtrado local
  const vacantesFiltradas = vacantes.filter((v) => {
    const coincideBusqueda = v.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             v.empresa.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado ? v.estado === filtroEstado : true;
    const coincideModalidad = filtroModalidad ? v.modalidad === filtroModalidad : true;
    return coincideBusqueda && coincideEstado && coincideModalidad;
  });

  return (
    <AdministradorShell pageTitle="Vacantes" pageSubtitle="Modera y supervisa todas las vacantes publicadas por las empresas">
      <div className="toolbar">
        <div className="search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" placeholder="Buscar por cargo o empresa" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <select className="adm-filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="Por aprobar">Por aprobar</option>
          <option value="Publicada">Publicada</option>
          <option value="Pausada">Pausada</option>
          <option value="Rechazada">Rechazada</option>
        </select>
        <select className="adm-filter-select" value={filtroModalidad} onChange={(e) => setFiltroModalidad(e.target.value)}>
          <option value="">Toda modalidad</option>
          <option value="Presencial">Presencial</option>
          <option value="Híbrido">Híbrido</option>
          <option value="Remoto">Remoto</option>
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Vacante</th><th>Modalidad</th><th>Ubicación</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 24 }}>Cargando vacantes...</td></tr>
            ) : vacantesFiltradas.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 24 }}>No se encontraron vacantes.</td></tr>
            ) : (
              vacantesFiltradas.map((v) => (
                <tr key={v.idOferta}>
                  <td>
                    <div className="cell-entity">
                      <div className="mini-avatar" style={{ background: colorForEmpresa(v.empresa) }}>{inicialesEmpresa(v.empresa)}</div>
                      <div><div className="name">{v.titulo}</div><div className="sub">{v.empresa}</div></div>
                    </div>
                  </td>
                  <td>{v.modalidad}</td>
                  <td>{v.ciudad}</td>
                  <td><span className={"badge " + badgeClaseParaEstado(v.estado)}>{v.estado}</span></td>
                  <td>
                    <div className="table-actions">
                      {v.estado === "Por aprobar" && (
                        <>
                          <button className="btn btn-sm btn-solid" disabled={procesando === v.idOferta} onClick={() => cambiarEstado(v.idOferta, "Publicada")}>
                            {procesando === v.idOferta ? "..." : "Aprobar"}
                          </button>
                          <button className="btn btn-sm btn-ghost-red" disabled={procesando === v.idOferta} onClick={() => cambiarEstado(v.idOferta, "Rechazada")}>
                            Rechazar
                          </button>
                        </>
                      )}
                      {v.estado === "Publicada" && (
                        <button className="btn btn-sm" disabled={procesando === v.idOferta} onClick={() => cambiarEstado(v.idOferta, "Pausada")}>
                          Pausar
                        </button>
                      )}
                      {v.estado === "Pausada" && (
                        <button className="btn btn-sm btn-solid" disabled={procesando === v.idOferta} onClick={() => cambiarEstado(v.idOferta, "Publicada")}>
                          Reactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={(newPage) => setPage(newPage)} 
      />

      {toast && <div className="toast show">{toast}</div>}
    </AdministradorShell>
  );
}