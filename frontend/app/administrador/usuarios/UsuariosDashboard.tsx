"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type TipoUsuario = "candidatos" | "empresas";

type UsuarioAdmin = {
  id_usuario: number;
  id_perfil: number;
  tipo: "candidato" | "empresa";
  nombre: string;
  correo: string;
  municipio: string | null;
  ciudad: string | null;
  estado: string;
  registro: string | null;
  sector: string | null;
  vacantes_activas: number | null;
  verificacion: string | null;
};

type UsuariosResponse = {
  items: UsuarioAdmin[];
  total: number;
  pagina: number;
  paginas: number;
  ciudades: string[];
};

const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function fechaLegible(fecha: string | null) {
  if (!fecha) return "—";
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? "—" : formatoFecha.format(valor);
}

function iniciales(nombre: string) {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0].toLocaleUpperCase("es-CO")).join("") || "U";
}

function claseEstado(estado: string) {
  if (estado === "Activo" || estado === "Verificada") return "badge-green";
  if (estado === "Pendiente" || estado === "Sin verificar") return "badge-amber";
  return "badge-red";
}

export default function UsuariosDashboard() {
  const [tipo, setTipo] = useState<TipoUsuario>("candidatos");
  const [busqueda, setBusqueda] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recargar, setRecargar] = useState(0);
  const [resultado, setResultado] = useState<UsuariosResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [accionando, setAccionando] = useState<number | null>(null);
  const [seleccionado, setSeleccionado] = useState<UsuarioAdmin | null>(null);

  useEffect(() => {
    let vigente = true;
    const parametros = new URLSearchParams({
      tipo,
      q: busqueda.trim(),
      ciudad,
      estado,
      pagina: String(pagina),
      limite: "20",
    });

    setCargando(true);
    setError("");
    const espera = window.setTimeout(() => {
      void apiFetch<UsuariosResponse>(`/api/admin/usuarios?${parametros.toString()}`)
        .then((data) => { if (vigente) setResultado(data); })
        .catch((err) => { if (vigente) setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios."); })
        .finally(() => { if (vigente) setCargando(false); });
    }, 200);

    return () => {
      vigente = false;
      window.clearTimeout(espera);
    };
  }, [tipo, busqueda, ciudad, estado, pagina, recargar]);

  async function ejecutarAccion(usuario: UsuarioAdmin, accion: "estado" | "verificar") {
    setAccionando(usuario.id_usuario);
    setError("");
    setMensaje("");
    try {
      if (accion === "verificar") {
        await apiFetch(`/api/admin/empresas/${usuario.id_perfil}/verificar`, { method: "PATCH" });
        setMensaje(`${usuario.nombre} quedó verificada.`);
      } else {
        const nuevoEstado = usuario.estado === "Activo" ? "Suspendido" : "Activo";
        await apiFetch(`/api/admin/usuarios/${usuario.id_usuario}/estado`, {
          method: "PATCH",
          body: { estado: nuevoEstado },
        });
        setMensaje(nuevoEstado === "Activo" ? `La cuenta de ${usuario.nombre} fue activada.` : `La cuenta de ${usuario.nombre} fue suspendida.`);
      }
      setSeleccionado(null);
      setRecargar((valor) => valor + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setAccionando(null);
    }
  }

  function cambiarTipo(nuevoTipo: TipoUsuario) {
    setTipo(nuevoTipo);
    setCiudad("");
    setEstado("");
    setPagina(1);
  }

  const items = resultado?.items ?? [];

  return (
    <>
      <div className="adm-tabs" role="tablist" aria-label="Tipo de usuario">
        <button type="button" className={`adm-tab${tipo === "candidatos" ? " active" : ""}`} role="tab" aria-selected={tipo === "candidatos"} onClick={() => cambiarTipo("candidatos")}>Candidatos</button>
        <button type="button" className={`adm-tab${tipo === "empresas" ? " active" : ""}`} role="tab" aria-selected={tipo === "empresas"} onClick={() => cambiarTipo("empresas")}>Empresas</button>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="search" placeholder="Buscar por nombre o correo" value={busqueda} onChange={(event) => { setBusqueda(event.target.value); setPagina(1); }} aria-label="Buscar por nombre o correo" />
        </label>
        <select className="adm-filter-select" value={ciudad} onChange={(event) => { setCiudad(event.target.value); setPagina(1); }} aria-label="Filtrar por ciudad">
          <option value="">Todas las ciudades</option>
          {(resultado?.ciudades ?? []).map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
        </select>
        <select className="adm-filter-select" value={estado} onChange={(event) => { setEstado(event.target.value); setPagina(1); }} aria-label="Filtrar por estado de cuenta">
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Suspendido">Suspendido</option>
          <option value="Bloqueado">Bloqueado</option>
        </select>
      </div>

      {mensaje && <p className="admin-dashboard-success" role="status">{mensaje}</p>}
      {error && <p className="admin-dashboard-error" role="alert">{error}</p>}

      <div className="table-card usuarios-table-card">
        <div className="usuarios-table-summary" aria-live="polite">
          {cargando ? "Cargando usuarios…" : `${resultado?.total ?? 0} ${tipo === "candidatos" ? "candidatos" : "empresas"}`}
        </div>
        <div className="usuarios-table-scroll">
          <table className="data-table">
            {tipo === "candidatos" ? (
              <>
                <thead><tr><th>Candidato</th><th>Ciudad</th><th>Estado de cuenta</th><th>Registro</th><th>Acciones</th></tr></thead>
                <tbody>
                  {items.map((usuario) => (
                    <tr key={usuario.id_usuario}>
                      <td><div className="cell-entity"><div className="mini-avatar" style={{ background: "#2F5FEA" }}>{iniciales(usuario.nombre)}</div><div><div className="name">{usuario.nombre}</div><div className="sub">{usuario.correo}</div></div></div></td>
                      <td>{usuario.ciudad || "—"}</td>
                      <td><span className={`badge ${claseEstado(usuario.estado)}`}>{usuario.estado}</span></td>
                      <td>{fechaLegible(usuario.registro)}</td>
                      <td><div className="table-actions"><button type="button" className="btn btn-sm" onClick={() => setSeleccionado(usuario)}>Ver perfil</button><button type="button" className="btn btn-sm" disabled={accionando === usuario.id_usuario} onClick={() => void ejecutarAccion(usuario, "estado")}>{usuario.estado === "Activo" ? "Suspender" : "Activar"}</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <>
                <thead><tr><th>Empresa</th><th>Sector</th><th>Cuenta</th><th>Vacantes activas</th><th>Verificación</th><th>Acciones</th></tr></thead>
                <tbody>
                  {items.map((usuario) => (
                    <tr key={usuario.id_usuario}>
                      <td><div className="cell-entity"><div className="mini-avatar" style={{ background: "#1C9A5B" }}>{iniciales(usuario.nombre)}</div><div><div className="name">{usuario.nombre}</div><div className="sub">{usuario.correo}</div></div></div></td>
                      <td>{usuario.sector || "—"}<div className="sub">{usuario.ciudad || "Ciudad no registrada"}</div></td>
                      <td><span className={`badge ${claseEstado(usuario.estado)}`}>{usuario.estado}</span></td>
                      <td>{usuario.vacantes_activas ?? 0}</td>
                      <td><span className={`badge ${claseEstado(usuario.verificacion || "Pendiente")}`}>{usuario.verificacion || "Pendiente"}</span></td>
                      <td><div className="table-actions"><button type="button" className="btn btn-sm" onClick={() => setSeleccionado(usuario)}>Ver perfil</button>{usuario.verificacion === "Pendiente" && <button type="button" className="btn btn-sm btn-solid" disabled={accionando === usuario.id_usuario} onClick={() => void ejecutarAccion(usuario, "verificar")}>Verificar</button>}<button type="button" className="btn btn-sm" disabled={accionando === usuario.id_usuario} onClick={() => void ejecutarAccion(usuario, "estado")}>{usuario.estado === "Activo" ? "Suspender" : "Activar"}</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
          {!cargando && items.length === 0 && <div className="admin-dashboard-empty">No hay resultados para los filtros seleccionados.</div>}
        </div>
      </div>

      <div className="usuarios-pagination">
        <span>Página {resultado?.pagina ?? pagina} de {resultado?.paginas ?? 1}</span>
        <div>
          <button type="button" className="btn btn-sm" disabled={pagina <= 1 || cargando} onClick={() => setPagina((actual) => Math.max(1, actual - 1))}>Anterior</button>
          <button type="button" className="btn btn-sm" disabled={pagina >= (resultado?.paginas ?? 1) || cargando} onClick={() => setPagina((actual) => actual + 1)}>Siguiente</button>
        </div>
      </div>

      {seleccionado && (
        <div className="modal-overlay open" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSeleccionado(null); }}>
          <section className="modal-box usuarios-profile-modal" role="dialog" aria-modal="true" aria-labelledby="usuario-modal-titulo">
            <button type="button" className="usuarios-modal-close" onClick={() => setSeleccionado(null)} aria-label="Cerrar">×</button>
            <div className="cell-entity usuarios-profile-heading"><div className="mini-avatar" style={{ background: seleccionado.tipo === "empresa" ? "#1C9A5B" : "#2F5FEA" }}>{iniciales(seleccionado.nombre)}</div><div><h2 id="usuario-modal-titulo">{seleccionado.nombre}</h2><p>{seleccionado.tipo === "empresa" ? "Empresa" : "Candidato"}</p></div></div>
            <dl className="usuarios-profile-details">
              <div><dt>Correo</dt><dd>{seleccionado.correo}</dd></div>
              <div><dt>Ciudad</dt><dd>{seleccionado.ciudad || "No registrada"}</dd></div>
              <div><dt>Estado de cuenta</dt><dd>{seleccionado.estado}</dd></div>
              <div><dt>Fecha de registro</dt><dd>{fechaLegible(seleccionado.registro)}</dd></div>
              {seleccionado.tipo === "empresa" && <>
                <div><dt>Sector</dt><dd>{seleccionado.sector || "No registrado"}</dd></div>
                <div><dt>Vacantes activas</dt><dd>{seleccionado.vacantes_activas ?? 0}</dd></div>
                <div><dt>Verificación</dt><dd>{seleccionado.verificacion || "Pendiente"}</dd></div>
              </>}
            </dl>
            <div className="modal-actions"><button type="button" className="btn" onClick={() => setSeleccionado(null)}>Cerrar</button></div>
          </section>
        </div>
      )}
    </>
  );
}
