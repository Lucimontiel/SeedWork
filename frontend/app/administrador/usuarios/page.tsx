"use client";

import { useEffect, useState } from "react";
import AdministradorShell from "../AdministradorShell";
import { apiFetch } from "../../lib/api";
import { useToast } from "../../lib/ToastProvider"; // ⬅️ Hook importado

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
  
  // ⬇️ Inicializamos el toast global
  const { showToast } = useToast(); 

  async function cargar() {
    try {
      const data = await apiFetch<Usuario[]>("/api/admin/usuarios");
      setUsuarios(data);
    } catch (e: any) {
      // ⬇️ Usamos showToast con tipo "error"
      showToast("Error cargando usuarios: " + e.message, "error");
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
      // ⬇️ Usamos showToast con tipo "success"
      showToast(`Usuario ${nuevoEstado === "Activo" ? "reactivado" : "suspendido"} correctamente`, "success");
      await cargar();
    } catch (e: any) {
      showToast(e.message || "Error al cambiar estado", "error");
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
      {/* ❌ ELIMINADO el {toast && ...} porque ahora el ToastProvider se encarga de todo */}
    </AdministradorShell>
  );
}