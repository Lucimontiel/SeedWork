"use client";

import { useEffect, useState } from "react";
import EmpresaShell from "../EmpresaShell";
import { useAuth } from "../../lib/auth-context";
import { apiFetch, ApiError } from "../../lib/api";

type Empresa = {
  idEmpresa: number;
  nombreEmpresa: string;
  correo: string;
  nit: string;
  sector?: string;
  ciudad?: string;
  telefono?: string;
  descripcion?: string;
  sitioweb?: string;
  correoCorporativo?: string;
  especialidades?: string;
  anioFundacion?: number;
  mision?: string;
  vision?: string;
  direccion?: string;
  logoUrl?: string | null;
};

const SECTORES = [
  "Tecnología", "Educación", "Salud", "Finanzas", "Construcción", "Otro",
];

function comprimirImagen(file: File, maxLado = 400, calidad = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxLado) {
          height = Math.round((height * maxLado) / width);
          width = maxLado;
        } else if (height > maxLado) {
          width = Math.round((width * maxLado) / height);
          height = maxLado;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo procesar la imagen"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PerfilEmpresaPage() {
  const { user, cargando: cargandoAuth } = useAuth();

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [draft, setDraft] = useState<Empresa | null>(null);
  const [logoDraft, setLogoDraft] = useState<string | null>(null);

  // ⬇️ STATS REALES ⬇️
  const [stats, setStats] = useState({ ofertas: 0, candidatos: 0 });
  
  useEffect(() => {
    if (empresa) {
      apiFetch<any>(`/api/empresa/${empresa.idEmpresa}/resumen`)
        .then(data => setStats({ 
          ofertas: data.rendimiento || 0, 
          candidatos: data.nuevosCandidatos || 0 
        }))
        .catch(() => {});
    }
  }, [empresa]);
  // ⬆️ FIN DE STATS REALES ⬆️

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    if (cargandoAuth) return;
    if (!user || user.tipo !== "empresa" || !user.idEmpresa) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    apiFetch<Empresa>(`/api/empresa/${user.idEmpresa}`)
      .then((data) => {
        setEmpresa(data);
      })
      .catch((err: ApiError) => {
        setError(err.message || "No se pudo cargar el perfil.");
      })
      .finally(() => setCargando(false));
  }, [user, cargandoAuth]);

  function iniciarEdicion() {
    if (!empresa) return;
    setDraft({ ...empresa });
    setLogoDraft(empresa.logoUrl || null);
    setEditando(true);
  }

  function cancelarEdicion() {
    setDraft(null);
    setLogoDraft(null);
    setEditando(false);
  }

  function updateDraft<K extends keyof Empresa>(campo: K, valor: Empresa[K]) {
    setDraft((d) => (d ? { ...d, [campo]: valor } : d));
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await comprimirImagen(file);
      setLogoDraft(dataUrl);
      mostrarToast("Logo listo. Guarda los cambios para aplicarlo.");
    } catch (err: any) {
      mostrarToast(err.message || "No se pudo procesar la imagen");
    } finally {
      e.target.value = "";
    }
  }

  async function guardarCambios() {
    if (!user || user.tipo !== "empresa" || !user.idEmpresa || !draft) return;

    setGuardando(true);
    try {
      const body: Record<string, any> = {
        nombreEmpresa: draft.nombreEmpresa?.trim() || undefined,
        nit: draft.nit?.trim() || undefined,
        ciudad: draft.ciudad?.trim() || undefined,
        sector: draft.sector?.trim() || undefined,
        telefono: draft.telefono?.trim() || undefined,
        descripcion: draft.descripcion?.trim() || undefined,
        direccion: draft.direccion?.trim() || undefined,
        mision: draft.mision?.trim() || undefined,
        vision: draft.vision?.trim() || undefined,
        sitioweb: draft.sitioweb?.trim() || undefined,
        especialidades: draft.especialidades?.trim() || undefined,
        anioFundacion: draft.anioFundacion ? Number(draft.anioFundacion) : undefined,
        correoCorporativo: draft.correoCorporativo?.trim() || undefined,
      };

      body.logoUrl = logoDraft;

      await apiFetch(`/api/empresa/${user.idEmpresa}`, {
        method: "PUT",
        body,
      });

      const actualizado = await apiFetch<Empresa>(`/api/empresa/${user.idEmpresa}`);
      setEmpresa(actualizado);
      setDraft(null);
      setLogoDraft(null);
      setEditando(false);
      mostrarToast("Perfil actualizado correctamente");
    } catch (err: any) {
      mostrarToast(err?.message || "Error al actualizar el perfil");
    } finally {
      setGuardando(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid #E6E9EF",
    borderRadius: 8,
    padding: 8,
    fontFamily: "inherit",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  };

  const logoActual = editando ? logoDraft : empresa?.logoUrl;

  return (
    <EmpresaShell pageTitle="Perfil" pageSubtitle="Información de tu empresa">
      {cargando && <p style={{ fontSize: 14, color: "#667085" }}>Cargando tu perfil...</p>}
      {error && !cargando && <p style={{ fontSize: 14, color: "#dc3545" }}>{error}</p>}

      {empresa && !cargando && (
        <>
          {/* Tarjeta principal */}
          <div className="empresa-profile-card">
            {/* Logo */}
            <div className="empresa-profile-logo" style={{ position: "relative" }}>
              {logoActual ? (
                <img
                  src={logoActual}
                  alt="Logo de la empresa"
                  style={{ width: "100%", height: "100%", borderRadius: 16, objectFit: "cover" }}
                />
              ) : (
                <svg viewBox="0 0 30 30" style={{ width: "100%", height: "100%", fill: "#fff" }}>
                  <path d="M15 3l7 7v10l-7 7-7-7V10z" />
                </svg>
              )}

              {editando && (
                <>
                  <button
                    className="empresa-logo-camera-btn"
                    type="button"
                    onClick={() => document.getElementById("empresaLogoInput")?.click()}
                    title="Cambiar logo"
                  >
                    <svg viewBox="0 0 20 20" style={{ width: 14, height: 14, stroke: "currentColor", fill: "none", strokeWidth: 1.5 }}>
                      <path d="M10 3l2 2h4v10H4V5h4l2-2z" />
                      <circle cx="10" cy="10" r="3" />
                    </svg>
                  </button>
                  <input
                    id="empresaLogoInput"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleLogoChange}
                  />

                  {logoDraft && (
                    <button
                      type="button"
                      onClick={() => setLogoDraft(null)}
                      title="Quitar logo"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 14,
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Info principal */}
            <div className="empresa-profile-main">
              <div className="empresa-profile-header-row">
                <div className="empresa-profile-name" style={{ flex: 1 }}>
                  {editando ? (
                    <>
                      <input
                        type="text"
                        value={draft?.nombreEmpresa || ""}
                        onChange={(e) => updateDraft("nombreEmpresa", e.target.value)}
                        placeholder="Nombre de la empresa"
                        style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }}
                      />
                      <select
                        value={draft?.sector || ""}
                        onChange={(e) => updateDraft("sector", e.target.value)}
                        style={{ ...inputStyle, marginTop: 6, fontSize: 13.5 }}
                      >
                        <option value="">Selecciona sector</option>
                        {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <h2>{empresa.nombreEmpresa}</h2>
                      <p className="empresa-profile-sector">{empresa.sector || "Sector no definido"}</p>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  {!editando ? (
                    <button className="btn-edit-profile" onClick={iniciarEdicion}>
                      <svg viewBox="0 0 20 20"><path d="M12 3l5 5-8 8H4v-5z"/></svg>
                      Editar
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-cancel-edit"
                        onClick={cancelarEdicion}
                        disabled={guardando}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn-edit-profile"
                        onClick={guardarCambios}
                        disabled={guardando}
                      >
                        {guardando ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="empresa-profile-about">
                <h3>Descripción empresa</h3>
                {editando ? (
                  <textarea
                    value={draft?.descripcion || ""}
                    onChange={(e) => updateDraft("descripcion", e.target.value)}
                    rows={3}
                    placeholder="Cuéntanos sobre tu empresa..."
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                ) : (
                  <p>{empresa.descripcion || "Descripción no definida."}</p>
                )}
              </div>

              {/* Meta: ciudad, sitio web, año */}
              <div className="empresa-profile-meta-row">
                <div className="empresa-meta-item">
                  <div className="empresa-meta-top">
                    <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2"/></svg>
                    {editando ? (
                      <input
                        type="text"
                        value={draft?.ciudad || ""}
                        onChange={(e) => updateDraft("ciudad", e.target.value)}
                        placeholder="Medellín"
                        style={inputStyle}
                      />
                    ) : (
                      <span>{empresa.ciudad || "—"}</span>
                    )}
                  </div>
                  <div className="empresa-meta-sub">Oficina principal</div>
                </div>

                <div className="empresa-meta-item">
                  <div className="empresa-meta-top">
                    <svg viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M3 5.5l7 5.5 7-5.5"/></svg>
                    {editando ? (
                      <input
                        type="text"
                        value={draft?.sitioweb || ""}
                        onChange={(e) => updateDraft("sitioweb", e.target.value)}
                        placeholder="www.empresa.com"
                        style={inputStyle}
                      />
                    ) : (
                      <span>{empresa.sitioweb || "—"}</span>
                    )}
                  </div>
                  <div className="empresa-meta-sub">Website</div>
                </div>

                <div className="empresa-meta-item">
                  <div className="empresa-meta-top">
                    <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2"/></svg>
                    {editando ? (
                      <input
                        type="number"
                        value={draft?.anioFundacion || ""}
                        onChange={(e) => updateDraft("anioFundacion", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="2018"
                        style={inputStyle}
                      />
                    ) : (
                      <span>{empresa.anioFundacion ? `${empresa.anioFundacion}` : "—"}</span>
                    )}
                  </div>
                  <div className="empresa-meta-sub">Año fundación</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Información y Sobre nosotros */}
          <div className="profile-grid-2">
            <div className="info-card">
              <h3 className="info-card-title">
                <svg viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M3 5.5l7 5.5 7-5.5"/></svg>
                Información de la empresa
              </h3>
              <div className="pref-list">
                <div className="pref-row">
                  <span className="k">NIT</span>
                  {editando ? (
                    <input type="text" value={draft?.nit || ""} onChange={(e) => updateDraft("nit", e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
                  ) : (
                    <span className="v">{empresa.nit}</span>
                  )}
                </div>
                <div className="pref-row">
                  <span className="k">Sector</span>
                  {editando ? (
                    <select value={draft?.sector || ""} onChange={(e) => updateDraft("sector", e.target.value)} style={{ ...inputStyle, maxWidth: 200 }}>
                      <option value="">Selecciona sector</option>
                      {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className="v">{empresa.sector || "—"}</span>
                  )}
                </div>
                <div className="pref-row">
                  <span className="k">Especialidades</span>
                  {editando ? (
                    <input type="text" value={draft?.especialidades || ""} onChange={(e) => updateDraft("especialidades", e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
                  ) : (
                    <span className="v">{empresa.especialidades || "—"}</span>
                  )}
                </div>
                <div className="pref-row">
                  <span className="k">Correo corporativo</span>
                  {editando ? (
                    <input type="email" value={draft?.correoCorporativo || ""} onChange={(e) => updateDraft("correoCorporativo", e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
                  ) : (
                    <span className="v">{empresa.correoCorporativo || "—"}</span>
                  )}
                </div>
                <div className="pref-row">
                  <span className="k">Dirección</span>
                  {editando ? (
                    <input type="text" value={draft?.direccion || ""} onChange={(e) => updateDraft("direccion", e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
                  ) : (
                    <span className="v">{empresa.direccion || "—"}</span>
                  )}
                </div>
                <div className="pref-row">
                  <span className="k">Teléfono</span>
                  {editando ? (
                    <input type="tel" value={draft?.telefono || ""} onChange={(e) => updateDraft("telefono", e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
                  ) : (
                    <span className="v">{empresa.telefono || "—"}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3 className="info-card-title">
                <svg viewBox="0 0 20 20"><path d="M10 2.5a5 5 0 00-3 9c.5.4.8 1 .8 1.6v1h4.4v-1c0-.6.3-1.2.8-1.6a5 5 0 00-3-9z"/></svg>
                Sobre nosotros
              </h3>

              <h4 className="empresa-about-subtitle">Misión</h4>
              {editando ? (
                <textarea
                  value={draft?.mision || ""}
                  onChange={(e) => updateDraft("mision", e.target.value)}
                  rows={2}
                  placeholder="Nuestra misión es..."
                  style={{ ...inputStyle, resize: "vertical", marginBottom: 12 }}
                />
              ) : (
                <p className="empresa-about-text">{empresa.mision || "—"}</p>
              )}

              <h4 className="empresa-about-subtitle">Visión</h4>
              {editando ? (
                <textarea
                  value={draft?.vision || ""}
                  onChange={(e) => updateDraft("vision", e.target.value)}
                  rows={2}
                  placeholder="Nuestra visión es..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              ) : (
                <p className="empresa-about-text">{empresa.vision || "—"}</p>
              )}
            </div>
          </div>

          {/* Bloque 3: Estadísticas (Datos Reales) */}
          <div className="empresa-stats-card">
            <div className="empresa-stat-item">
              <div className="empresa-stat-icon">
                <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg>
              </div>
              <div className="empresa-stat-info">
                <strong>{stats.ofertas}</strong>
                <span className="empresa-stat-title">Ofertas activas</span>
                <span className="empresa-stat-sub">Publicadas</span>
              </div>
            </div>
            <div className="empresa-stat-item">
              <div className="empresa-stat-icon">
                <svg viewBox="0 0 20 20"><circle cx="7" cy="6.5" r="2.3"/><path d="M2.8 15.5c0-2.4 1.9-4 4.2-4s4.2 1.6 4.2 4"/></svg>
              </div>
              <div className="empresa-stat-info">
                <strong>{stats.candidatos}</strong>
                <span className="empresa-stat-title">Candidatos</span>
                <span className="empresa-stat-sub">En proceso</span>
              </div>
            </div>
            <div className="empresa-stat-item">
              <div className="empresa-stat-icon">
                <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="2.6"/><path d="M2.5 10s3-5 7.5-5 7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5z"/></svg>
              </div>
              <div className="empresa-stat-info">
                <strong>0</strong>
                <span className="empresa-stat-title">Visualizaciones</span>
                <span className="empresa-stat-sub">Próximamente</span>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && <div className="sw-toast show">{toast}</div>}
    </EmpresaShell>
  );
}