"use client";

import { useEffect, useState } from "react";
import AdministradorShell from "../AdministradorShell";
import { apiFetch } from "../../lib/api";

type Usuario = {
  idUsuario: number;
  nombre: string;
  correo: string;
  tipo: "candidato" | "empresa";
  estado: string;
};

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<"candidato" | "empresa">("candidato");
  const [toast, setToast] = useState<string | null>(null);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function cargar() {
    try {
      const data = await apiFetch<Usuario[]>("/api/admin/usuarios");
      setUsuarios(data);
    } catch (e: any) {
      mostrarToast("Error cargando usuarios: " + e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function cambiarEstado(idUsuario: number, estadoActual: string) {
    const nuevoEstado = estadoActual === "Activo" ? "Suspendido" : "Activo";
    try {
      await apiFetch(`/api/admin/usuarios/${idUsuario}/estado`, {
        method: "PATCH",
        body: { estado: nuevoEstado },
      });
      mostrarToast(`Usuario ${nuevoEstado === "Activo" ? "reactivado" : "suspendido"}`);
      await cargar();
    } catch (e: any) {
      mostrarToast("Error al cambiar estado");
    }
  }

  const filtrados = usuarios.filter(u => u.tipo === tab);

  return (
    <AdministradorShell pageTitle="Usuarios" pageSubtitle="Gestiona las cuentas de candidatos y empresas">
      <div className="adm-tabs">
        <div className={`adm-tab ${tab === "candidato" ? "active" : ""}`} onClick={() => setTab("candidato")}>Candidatos</div>
        <div className={`adm-tab ${tab === "empresa" ? "active" : ""}`} onClick={() => setTab("empresa")}>Empresas</div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Nombre / Correo</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: 24 }}>Cargando usuarios...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: 24 }}>No hay usuarios en esta categoría.</td></tr>
            ) : (
              filtrados.map((u) => (
                <tr key={u.idUsuario}>
                  <td>
                    <div className="cell-entity">
                      <div className="mini-avatar" style={{ background: tab === "candidato" ? "#2F5FEA" : "#1C9A5B" }}>
                        {u.nombre.charAt(0)}
                      </div>
                      <div>
                        <div className="name">{u.nombre}</div>
                        <div className="sub">{u.correo}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.estado === "Activo" ? "badge-green" : "badge-red"}`}>
                      {u.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className={`btn btn-sm ${u.estado === "Activo" ? "btn-ghost-red" : "btn-solid"}`} 
                        onClick={() => cambiarEstado(u.idUsuario, u.estado)}
                      >
                        {u.estado === "Activo" ? "Suspender" : "Reactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {toast && <div className="toast show">{toast}</div>}
    </AdministradorShell>
  );
}