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

  // 👇 Estados para mostrar/ocultar las contraseñas
  const [showContrasena, setShowContrasena] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

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
    if (!form.ciudad.trim()) return setError("Selecciona tu ciudad.");
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
      <div className="sw-brand-header">
        <img src="/logo_blanco.png" alt="SeedWork Logo" className="sw-logo-icon" />
        <h1 className="sw-brand-name">SEEDWORK</h1>
      </div>
      
      <h2>Crear Cuenta</h2>
      <p className="intro">Tu empresa es parte del futuro del empleo.</p>

      <div className="container">
        <div className="tabs">
          <button type="button" onClick={() => router.push("/registro/candidato")}>Soy Candidato</button>
          <button type="button" className="active">Soy Empresa</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          
          {/* 👇 Fila: Nombre y Correo lado a lado 👇 */}
          <div className="form-row-2">
            <div className="input-group">
              <label>Nombre de la empresa</label>
              <input type="text" placeholder="Ej. Tech Solutions" value={form.nombreEmpresa} onChange={(e) => update("nombreEmpresa", e.target.value)} />
            </div>
            <div className="input-group">
              <label>Correo corporativo</label>
              <input type="email" placeholder="contacto@empresa.com" value={form.correo} onChange={(e) => update("correo", e.target.value)} />
            </div>
          </div>

          {/* 👇 Contraseña con Ojo 👇 */}
          <div className="input-group">
            <label>Contraseña</label>
            <div className="input-group-password">
              <input 
                type={showContrasena ? "text" : "password"} 
                placeholder="Mín. 8 caracteres" 
                value={form.contrasena} 
                onChange={(e) => update("contrasena", e.target.value)} 
              />
              {form.contrasena.length > 0 && (
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowContrasena(!showContrasena)}
                  aria-label={showContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showContrasena ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 👇 Confirmar Contraseña con Ojo 👇 */}
          <div className="input-group">
            <label>Confirmar contraseña</label>
            <div className="input-group-password">
              <input 
                type={showConfirmar ? "text" : "password"} 
                placeholder="Repite tu contraseña" 
                value={form.confirmar} 
                onChange={(e) => update("confirmar", e.target.value)} 
              />
              {form.confirmar.length > 0 && (
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowConfirmar(!showConfirmar)}
                  aria-label={showConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmar ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 👇 Fila: NIT y Ciudad lado a lado 👇 */}
          <div className="form-row-2">
            <div className="input-group">
              <label>NIT / RUT</label>
              <input type="text" placeholder="900.123.456-7" value={form.nit} onChange={(e) => update("nit", e.target.value)} />
            </div>
            <div className="input-group">
              <label>Ciudad</label>
              <select 
                value={form.ciudad} 
                onChange={(e) => update("ciudad", e.target.value)}
              >
                <option value="">Selecciona tu ciudad</option>
                <option value="Medellín">Medellín</option>
                <option value="Bello">Bello</option>
                <option value="Itagüí">Itagüí</option>
                <option value="Envigado">Envigado</option>
                <option value="Sabaneta">Sabaneta</option>
                <option value="Rionegro">Rionegro</option>
                <option value="Bogotá">Bogotá</option>
                <option value="Cali">Cali</option>
              </select>
            </div>
          </div>

          {/* Sector queda de ancho completo */}
          <div className="input-group">
            <label>Sector</label>
            <select value={form.sector} onChange={(e) => update("sector", e.target.value)}>
              <option value="">Selecciona un sector</option>
              {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="checkbox-group">
            <input 
              type="checkbox" 
              id="terms" 
              checked={aceptaTerminos} 
              onChange={(e) => setAceptaTerminos(e.target.checked)} 
            />
            <label htmlFor="terms" style={{ fontWeight: "normal", fontSize: "14px", color: "var(--sw-text-muted)", lineHeight: "1.4" }}>
              Acepto los{" "}
              <a href="/terminos" target="_blank" style={{ color: "var(--sw-blue)", textDecoration: "underline" }}>
                términos y condiciones
              </a>{" "}
              y la{" "}
              <a href="/privacidad" target="_blank" style={{ color: "var(--sw-blue)", textDecoration: "underline" }}>
                política de privacidad
              </a>
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