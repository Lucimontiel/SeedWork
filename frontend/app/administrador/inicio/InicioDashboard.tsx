"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type Pendiente = {
  tipo: "vacante" | "empresa";
  id: number;
  titulo: string;
  subtitulo: string;
  ubicacion: string;
  modalidad: string | null;
  fecha: string | null;
};

type DashboardData = {
  tarjetas: {
    usuarios_nuevos: number;
    vacantes_pendientes: number;
    reportes_activos: number;
    postulaciones_activas: number;
  };
  salud: {
    disponibilidad: number;
    candidatos_activos: number;
    empresas_activas: number;
    vacantes_cubiertas_pct: number;
  };
  pendientes: Pendiente[];
};

const formatoNumero = new Intl.NumberFormat("es-CO");
const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function fechaLegible(fecha: string | null) {
  if (!fecha) return "Fecha no disponible";
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? "Fecha no disponible" : formatoFecha.format(valor);
}

function iniciales(texto: string) {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toLocaleUpperCase("es-CO"))
    .join("");
}

export default function InicioDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [actualizando, setActualizando] = useState(false);
  const [accionando, setAccionando] = useState<string | null>(null);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setActualizando(true);
    setError("");
    try {
      const resultado = await apiFetch<DashboardData>("/api/admin/dashboard", {
        method: "GET",
        silencioso,
      });
      setData(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el panel.");
    } finally {
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function resolver(pendiente: Pendiente, accion: "aprobar" | "rechazar" | "verificar") {
    const clave = `${pendiente.tipo}-${pendiente.id}`;
    setAccionando(clave);
    setError("");
    try {
      const ruta = pendiente.tipo === "vacante"
        ? `/api/admin/vacantes/${pendiente.id}/${accion}`
        : `/api/admin/empresas/${pendiente.id}/verificar`;
      await apiFetch(ruta, { method: "PATCH" });
      await cargar(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible completar la acción.");
    } finally {
      setAccionando(null);
    }
  }

  if (!data) {
    return (
      <div className="admin-dashboard-state" role="status" aria-live="polite">
        {error ? (
          <>
            <p>{error}</p>
            <button className="btn btn-solid" onClick={() => void cargar()}>Reintentar</button>
          </>
        ) : <p>Cargando datos del panel…</p>}
      </div>
    );
  }

  const { tarjetas, salud, pendientes } = data;

  return (
    <div aria-busy={actualizando}>
      {error && <p className="admin-dashboard-error" role="alert">{error}</p>}

      <div className="quick-grid">
        <div className="quick-card"><div><h3>Usuarios nuevos</h3><div className="stat">{formatoNumero.format(tarjetas.usuarios_nuevos)}</div><p>Candidatos y empresas registrados esta semana</p></div><span className="quick-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5" /></svg></span></div>
        <div className="quick-card"><div><h3>Vacantes pendientes</h3><div className="stat">{formatoNumero.format(tarjetas.vacantes_pendientes)}</div><p>Esperan aprobación antes de publicarse</p></div><span className="quick-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5" /></svg></span></div>
        <div className="quick-card"><div><h3>Reportes activos</h3><div className="stat">{formatoNumero.format(tarjetas.reportes_activos)}</div><p>Casos abiertos sin resolver</p></div><span className="quick-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5" /></svg></span></div>
        <div className="quick-card"><div><h3>Postulaciones activas</h3><div className="stat">{formatoNumero.format(tarjetas.postulaciones_activas)}</div><p>Postulaciones en curso entre candidatos y empresas</p></div><span className="quick-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5" /></svg></span></div>
      </div>

      <section>
        <div className="section-head"><h2>Salud de la plataforma</h2></div>
        <div className="health-row">
          <div className="ring-wrap">
            <svg width="72" height="72" viewBox="0 0 36 36" role="img" aria-label={`Disponibilidad ${salud.disponibilidad}%`}>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EAF1FF" strokeWidth="4" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1C9A5B" strokeWidth="4" strokeDasharray={`${salud.disponibilidad} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
              <text x="18" y="21" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1B2130">{salud.disponibilidad}%</text>
            </svg>
            <div className="ring-label"><b>Estable</b>Disponibilidad últimos 30 días</div>
          </div>
          <div className="metric-strip">
            <div className="metric"><div className="num">{formatoNumero.format(salud.candidatos_activos)}</div><div className="lbl">Candidatos activos</div></div>
            <div className="metric"><div className="num">{formatoNumero.format(salud.empresas_activas)}</div><div className="lbl">Empresas activas</div></div>
            <div className="metric"><div className="num">{formatoNumero.format(salud.vacantes_cubiertas_pct)}%</div><div className="lbl">Vacantes cubiertas</div></div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-head"><h2>Pendientes por revisar</h2><span>{pendientes.length} recientes</span></div>
        {pendientes.length === 0 ? (
          <div className="admin-dashboard-empty">No hay vacantes ni empresas pendientes de revisión.</div>
        ) : pendientes.map((pendiente) => {
          const clave = `${pendiente.tipo}-${pendiente.id}`;
          const ocupado = accionando === clave;
          return (
            <article className="row-card" key={clave}>
              <div className="row-icon" style={{ background: pendiente.tipo === "vacante" ? "#3B6BF5" : "#8B5CF6" }} aria-hidden="true">
                {iniciales(pendiente.tipo === "vacante" ? pendiente.subtitulo.split(" · ")[0] : pendiente.titulo) || (pendiente.tipo === "vacante" ? "VA" : "EM")}
              </div>
              <div className="row-body">
                <p className="row-title">{pendiente.titulo}</p>
                <p className="row-sub">{pendiente.subtitulo}</p>
                <div className="row-meta">
                  <span>{pendiente.ubicacion}</span>
                  {pendiente.modalidad && <span>{pendiente.modalidad}</span>}
                  <span>{pendiente.tipo === "vacante" ? "Publicada" : "Registrada"}: {fechaLegible(pendiente.fecha)}</span>
                </div>
              </div>
              <div className="row-actions">
                <span className="badge badge-amber">{pendiente.tipo === "vacante" ? "Por aprobar" : "Sin verificar"}</span>
                {pendiente.tipo === "vacante" ? (
                  <>
                    <button className="btn btn-solid" disabled={ocupado} onClick={() => void resolver(pendiente, "aprobar")}>{ocupado ? "Guardando…" : "Aprobar"}</button>
                    <button className="btn btn-ghost-red" disabled={ocupado} onClick={() => void resolver(pendiente, "rechazar")}>Rechazar</button>
                  </>
                ) : (
                  <button className="btn btn-solid" disabled={ocupado} onClick={() => void resolver(pendiente, "verificar")}>{ocupado ? "Guardando…" : "Verificar"}</button>
                )}
              </div>
            </article>
          );
        })}
        {pendientes.length > 0 && <p className="admin-dashboard-note">Se muestran hasta cinco vacantes y cinco empresas pendientes.</p>}
      </section>
    </div>
  );
}
