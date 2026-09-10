"use client";

import { useEffect, useState } from "react";
import EmpresaShell from "../EmpresaShell";
import { getSession } from "../../lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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
  logoUrl?: string; // 👈 AGREGA ESTE CAMPO
};

export default function PerfilEmpresaPage() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [editando, setEditando] = useState(false);
  const [empresaLogo, setEmpresaLogo] = useState<string | null>(null); // 👈 ESTADO PARA LA FOTO

  const [form, setForm] = useState({
    nombreEmpresa: "",
    nit: "",
    ciudad: "",
    sector: "",
    telefono: "",
    descripcion: "",
    direccion: "",
    mision: "",
    vision: "",
    sitioweb: "",
    especialidades: "",
    anioFundacion: "",
    correoCorporativo: "",
  });

  useEffect(() => {
    const session = getSession();
    if (!session) return;

    fetch(`${API_BASE}/api/empresa/${session.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setEmpresa(data);
          setEmpresaLogo(data.logoUrl || null); // 👈 CARGA LA FOTO
          setForm({
            nombreEmpresa: data.nombreEmpresa || "",
            nit: data.nit || "",
            ciudad: data.ciudad || "",
            sector: data.sector || "",
            telefono: data.telefono || "",
            descripcion: data.descripcion || "",
            direccion: data.direccion || "",
            mision: data.mision || "",
            vision: data.vision || "",
            sitioweb: data.sitioweb || "",
            especialidades: data.especialidades || "",
            anioFundacion: data.anioFundacion ? String(data.anioFundacion) : "",
            correoCorporativo: data.correoCorporativo || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  // 👇 CONVERTIR LA IMAGEN A BASE64
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEmpresaLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) return;

    const resp = await fetch(`${API_BASE}/api/empresa/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        anioFundacion: form.anioFundacion ? Number(form.anioFundacion) : null,
        logoUrl: empresaLogo || empresa?.logoUrl || null, // 👈 ENVÍA LA FOTO
      }),
    });

    if (resp.ok) {
      setEditando(false);
      window.location.reload();
    } else {
      const data = await resp.json().catch(() => null);
      alert(data?.detail || "Error al actualizar");
    }
  }

  return (
    <EmpresaShell pageTitle="Perfil" pageSubtitle="Información de tu empresa">
      {empresa && (
        <>
          {/* Bloque 1: Información principal */}
          <div className="empresa-profile-card">
            <div className="empresa-profile-logo" style={{ position: "relative" }}>
              {/* 👇 AQUÍ SE MUESTRA LA FOTO */}
              {empresaLogo ? (
                <img
                  src={empresaLogo}
                  alt="Logo de la empresa"
                  style={{ width: "100%", height: "100%", borderRadius: 16, objectFit: "cover" }}
                />
              ) : (
                <svg viewBox="0 0 30 30" style={{ width: "100%", height: "100%", fill: "#fff" }}>
                  <path d="M15 3l7 7v10l-7 7-7-7V10z" />
                </svg>
              )}

              <div className="empresa-logo-name">{empresa.nombreEmpresa}</div>
              <div className="empresa-logo-tagline">SeedWork</div>

              {/* 👇 BOTÓN DE LA CÁMARA PARA SUBIR LA FOTO */}
              <button
                className="empresa-logo-camera-btn"
                onClick={() => document.getElementById("empresaLogoInput")?.click()}
              >
                <svg viewBox="0 0 20 20" style={{ width: 14, height: 14, stroke: "currentColor", fill: "none", strokeWidth: 1.5 }}>
                  <path d="M10 3l2 2h4v10H4V5h4l2-2z" />
                  <circle cx="10" cy="10" r="3" />
                </svg>
              </button>

              {/* 👇 INPUT OCULTO PARA SUBIR LA FOTO */}
              <input
                id="empresaLogoInput"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleLogoChange}
              />
            </div>

            <div className="empresa-profile-main">
              <div className="empresa-profile-header-row">
                <div className="empresa-profile-name">
                  <h2>{empresa.nombreEmpresa}</h2>
                  <p className="empresa-profile-sector">{empresa.sector || "Sector no definido"}</p>
                </div>
                <button className="btn-edit-profile" onClick={() => setEditando(true)}>
                  <svg viewBox="0 0 20 20"><path d="M12 3l5 5-8 8H4v-5z"/></svg>
                  Editar
                </button>
              </div>

              <div className="empresa-profile-about">
                <h3>Descripción empresa</h3>
                <p>{empresa.descripcion || "Descripción no definida."}</p>
              </div>

              <div className="empresa-profile-meta-row">
                <div className="empresa-meta-item">
                  <div className="empresa-meta-top">
                    <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2"/></svg>
                    <span>{empresa.ciudad || "—"}</span>
                  </div>
                  <div className="empresa-meta-sub">Oficina principal</div>
                </div>
                <div className="empresa-meta-item">
                  <div className="empresa-meta-top">
                    <svg viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M3 5.5l7 5.5 7-5.5"/></svg>
                    <span>{empresa.sitioweb || "—"}</span>
                  </div>
                  <div className="empresa-meta-sub">Website</div>
                </div>
                <div className="empresa-meta-item">
                  <div className="empresa-meta-top">
                    <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2"/></svg>
                    <span>{empresa.anioFundacion ? `${empresa.anioFundacion}` : "—"}</span>
                  </div>
                  <div className="empresa-meta-sub">Año fundación</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Información de la empresa y Sobre nosotros */}
          <div className="profile-grid-2">
            <div className="info-card">
              <h3 className="info-card-title">
                <svg viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M3 5.5l7 5.5 7-5.5"/></svg>
                Información de la empresa
              </h3>
              <div className="pref-list">
                <div className="pref-row">
                  <span className="k">NIT</span>
                  <span className="v">{empresa.nit}</span>
                </div>
                <div className="pref-row">
                  <span className="k">Sector</span>
                  <span className="v">{empresa.sector || "—"}</span>
                </div>
                <div className="pref-row">
                  <span className="k">Especialidades</span>
                  <span className="v">{empresa.especialidades || "—"}</span>
                </div>
                <div className="pref-row">
                  <span className="k">Correo corporativo</span>
                  <span className="v">{empresa.correoCorporativo || "—"}</span>
                </div>
                <div className="pref-row">
                  <span className="k">Dirección</span>
                  <span className="v">{empresa.direccion || "—"}</span>
                </div>
                <div className="pref-row">
                  <span className="k">Teléfono</span>
                  <span className="v">{empresa.telefono || "—"}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3 className="info-card-title">
                <svg viewBox="0 0 20 20"><path d="M10 2.5a5 5 0 00-3 9c.5.4.8 1 .8 1.6v1h4.4v-1c0-.6.3-1.2.8-1.6a5 5 0 00-3-9z"/></svg>
                Sobre nosotros
              </h3>
              <p className="empresa-about-intro">{empresa.descripcion || "Descripción no definida."}</p>
              <h4 className="empresa-about-subtitle">Misión</h4>
              <p className="empresa-about-text">{empresa.mision || "—"}</p>
              <h4 className="empresa-about-subtitle">Visión</h4>
              <p className="empresa-about-text">{empresa.vision || "—"}</p>
            </div>
          </div>

          {/* Bloque 3: Estadísticas */}
          <div className="empresa-stats-card">
            <div className="empresa-stat-item">
              <div className="empresa-stat-icon">
                <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg>
              </div>
              <div className="empresa-stat-info">
                <strong>12</strong>
                <span className="empresa-stat-title">Ofertas activas</span>
                <span className="empresa-stat-sub">Publicadas</span>
              </div>
            </div>
            <div className="empresa-stat-item">
              <div className="empresa-stat-icon">
                <svg viewBox="0 0 20 20"><circle cx="7" cy="6.5" r="2.3"/><path d="M2.8 15.5c0-2.4 1.9-4 4.2-4s4.2 1.6 4.2 4"/></svg>
              </div>
              <div className="empresa-stat-info">
                <strong>128</strong>
                <span className="empresa-stat-title">Candidatos</span>
                <span className="empresa-stat-sub">En proceso</span>
              </div>
            </div>
            <div className="empresa-stat-item">
              <div className="empresa-stat-icon">
                <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="2.6"/><path d="M2.5 10s3-5 7.5-5 7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5z"/></svg>
              </div>
              <div className="empresa-stat-info">
                <strong>5.4K</strong>
                <span className="empresa-stat-title">Visualizaciones</span>
                <span className="empresa-stat-sub">Último 1 hora</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Formulario de edición */}
      {editando && (
        <form onSubmit={handleUpdate} style={{ background: "#fff", border: "1px solid #E6E9EF", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Editar Perfil</h3>

          {/* 👇 CAMPOS DEL FORMULARIO */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input
              type="text"
              placeholder="Nombre empresa"
              value={form.nombreEmpresa}
              onChange={(e) => setForm({ ...form, nombreEmpresa: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
            <input
              type="text"
              placeholder="NIT"
              value={form.nit}
              onChange={(e) => setForm({ ...form, nit: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <input
              type="text"
              placeholder="Ciudad"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
            <input
              type="text"
              placeholder="Sector"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <input
              type="text"
              placeholder="Sitio web"
              value={form.sitioweb}
              onChange={(e) => setForm({ ...form, sitioweb: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
            <input
              type="text"
              placeholder="Año fundación"
              value={form.anioFundacion}
              onChange={(e) => setForm({ ...form, anioFundacion: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <input
              type="text"
              placeholder="Especialidades"
              value={form.especialidades}
              onChange={(e) => setForm({ ...form, especialidades: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
            <input
              type="text"
              placeholder="Correo corporativo"
              value={form.correoCorporativo}
              onChange={(e) => setForm({ ...form, correoCorporativo: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              placeholder="Dirección"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              placeholder="Telefono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={3}
              style={{ width: "100%", border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Misión"
              value={form.mision}
              onChange={(e) => setForm({ ...form, mision: e.target.value })}
              rows={2}
              style={{ width: "100%", border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Visión"
              value={form.vision}
              onChange={(e) => setForm({ ...form, vision: e.target.value })}
              rows={2}
              style={{ width: "100%", border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <button type="submit" className="btn-empresa-solid" style={{ marginTop: 12 }}>
            Guardar cambios
          </button>
        </form>
      )}
    </EmpresaShell>
  );
}