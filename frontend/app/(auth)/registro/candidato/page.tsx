"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "../../../lib/api";

export default function RegistroCandidatoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombreCompleto: "", correo: "", contrasena: "", confirmar: "", telefono: "", ciudad: "",
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [showContrasena, setShowContrasena] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  function update(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nombreCompleto.trim()) return setError("Escribe tu nombre completo.");
    if (!form.correo.trim()) return setError("Escribe tu correo.");
    if (form.contrasena !== form.confirmar) return setError("Las contraseñas no coinciden.");
    if (form.contrasena.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (!form.telefono.trim()) return setError("Escribe tu teléfono.");
    if (!form.ciudad.trim()) return setError("Escribe tu ciudad.");
    if (!aceptaTerminos) return setError("Debes aceptar los términos y condiciones.");

    setCargando(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/registro/candidato`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto: form.nombreCompleto,
          correo: form.correo,
          contrasena: form.contrasena,
          telefono: form.telefono,
          ciudad: form.ciudad,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo crear la cuenta.");
      }

      setExito(true);
      //setTimeout(() => router.push("/login?registro=ok&tipo=candidato"), 1800);
    } catch (err: any) {
      setError(err?.message || "No se pudo crear la cuenta.");
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
  return (
    <div className="login-wrapper">
      <div className="container" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ color: "var(--sw-blue)" }}>¡Cuenta creada!</h2>
        <p style={{ color: "var(--sw-text-muted)", marginBottom: 12 }}>
          Enviamos un enlace de verificación a <strong>{form.correo}</strong>.
        </p>
        <p style={{ color: "var(--sw-text-muted)", fontSize: 13, marginBottom: 24 }}>
          Revisa tu bandeja (y spam). Puedes iniciar sesión ahora, pero verificar
          tu correo desbloquea todas las funciones.
        </p>
        <Link href="/login?registro=ok&tipo=candidato" className="btn-submit" style={{ display: "inline-block", textDecoration: "none" }}>
          Ir al login
        </Link>
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
      <p className="intro">Comienza a crecer con nosotros.</p>

      <div className="container">
        <div className="tabs">
          <button type="button" className="active">Soy Candidato</button>
          <button type="button" onClick={() => router.push("/registro/empresa")}>Soy Empresa</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          
          {/* ⬅️ FILA 1: Nombre y Correo */}
          <div className="form-row-2">
            <div className="input-group">
              <label>Nombre completo</label>
              <input type="text" placeholder="Ej. Juan Pérez" value={form.nombreCompleto} onChange={(e) => update("nombreCompleto", e.target.value)} />
            </div>
            <div className="input-group">
              <label>Correo electrónico</label>
              <input type="email" placeholder="ejemplo@gmail.com" value={form.correo} onChange={(e) => update("correo", e.target.value)} />
            </div>
          </div>

          {/* ⬅️ FILA 2: Contraseña y Confirmar */}
          <div className="form-row-2">
            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-group-password">
                <input
                  type={showContrasena ? "text" : "password"}
                  placeholder="Mín. 8 caracteres"
                  value={form.contrasena}
                  onChange={(e) => update("contrasena", e.target.value)}
                />
                <button type="button" className="btn-toggle-password" onClick={() => setShowContrasena(!showContrasena)} aria-label="Mostrar contraseña">
                  {showContrasena ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label>Confirmar contraseña</label>
              <div className="input-group-password">
                <input
                  type={showConfirmar ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={form.confirmar}
                  onChange={(e) => update("confirmar", e.target.value)}
                />
                <button type="button" className="btn-toggle-password" onClick={() => setShowConfirmar(!showConfirmar)} aria-label="Mostrar contraseña">
                  {showConfirmar ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ⬅️ FILA 3: Teléfono y Ciudad */}
          <div className="form-row-2">
            <div className="input-group">
              <label>Teléfono</label>
              <input type="tel" placeholder="300 123 4567" value={form.telefono} onChange={(e) => update("telefono", e.target.value)} />
            </div>
            <div className="input-group">
              <label>Ciudad</label>
              <select value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)}>
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

                    {/* ⬅️ ESTE ES EL BLOQUE CORREGIDO CON LOS ENLACES */}
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