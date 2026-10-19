"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "../../../lib/api";

const SECTORES = ["Tecnología", "Educación", "Salud", "Finanzas", "Construcción", "Otro"];

export default function RegistroEmpresaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombreEmpresa: "", correo: "", contrasena: "", confirmar: "", nit: "", sector: "", ciudad: "",
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  function update(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nombreEmpresa.trim()) return setError("Escribe el nombre de la empresa.");
    if (!form.correo.trim()) return setError("Escribe el correo.");
    if (form.contrasena !== form.confirmar) return setError("Las contraseñas no coinciden.");
    if (form.contrasena.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (!form.nit.trim()) return setError("Escribe el NIT.");
    if (!form.sector) return setError("Selecciona un sector.");
    if (!form.ciudad.trim()) return setError("Escribe la ciudad.");
    if (!aceptaTerminos) return setError("Debes aceptar los términos y condiciones.");

    setCargando(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/registro/empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreEmpresa: form.nombreEmpresa,
          correo: form.correo,
          contrasena: form.contrasena,
          nit: form.nit,
          sector: form.sector,
          ciudad: form.ciudad,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo crear la cuenta.");
      }

      setExito(true);
      setTimeout(() => router.push("/login?registro=ok&tipo=empresa"), 1800);
    } catch (err: any) {
      setError(err?.message || "No se pudo crear la cuenta.");
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <div className="login-wrapper">
        <div className="container" style={{ padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: "var(--sw-blue)" }}>¡Cuenta creada!</h2>
          <p style={{ color: "var(--sw-text-muted)" }}>Redirigiendo a inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
        <h1 className="sw-brand-name">SEEDWORK</h1>
      <h2>Crear Cuenta</h2>
      <p className="intro">Tu empresa es parte del futuro del empleo.</p>

      <div className="container">
        <div className="tabs">
          <button type="button" onClick={() => router.push("/registro/candidato")}>Soy Candidato</button>
          <button type="button" className="active">Soy Empresa</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label>Nombre de la empresa</label>
            <input type="text" placeholder="Ej. Tech Solutions" value={form.nombreEmpresa} onChange={(e) => update("nombreEmpresa", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Correo corporativo</label>
            <input type="email" placeholder="contacto@empresa.com" value={form.correo} onChange={(e) => update("correo", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" placeholder="Mín. 8 caracteres" value={form.contrasena} onChange={(e) => update("contrasena", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Confirmar contraseña</label>
            <input type="password" placeholder="Repite tu contraseña" value={form.confirmar} onChange={(e) => update("confirmar", e.target.value)} />
          </div>
          <div className="input-group">
            <label>NIT / RUT</label>
            <input type="text" placeholder="900.123.456-7" value={form.nit} onChange={(e) => update("nit", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Sector</label>
            <select value={form.sector} onChange={(e) => update("sector", e.target.value)}>
              <option value="">Selecciona un sector</option>
              {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Ciudad</label>
            <input type="text" placeholder="Medellín" value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)} />
          </div>

          <div className="checkbox-group">
            <input type="checkbox" id="terms" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} />
            <label htmlFor="terms" style={{ fontWeight: "normal", fontSize: "14px", color: "var(--sw-text-muted)" }}>
              Aceptar términos y condiciones
            </label>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button type="submit" className="btn-submit" disabled={cargando}>
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
          <p className="footer-link">
            ¿Ya tienes cuenta? <Link href="/login">Inicia sesión aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}