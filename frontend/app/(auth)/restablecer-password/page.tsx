"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "../../lib/api";

function RestablecerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showContrasena, setShowContrasena] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) return setError("Enlace inválido. Falta el token de seguridad.");
    if (contrasena !== confirmar) return setError("Las contraseñas no coinciden.");
    if (contrasena.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");

    setCargando(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/restablecer-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, contrasena }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || "El enlace es inválido o ha expirado.");
      }

      setExito(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err?.message || "Error al restablecer la contraseña.");
    } finally {
      setCargando(false);
    }
  }

  if (!token) {
    return (
      <div className="login-wrapper">
        <div className="container" style={{ padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: "var(--sw-error)", marginBottom: 12 }}>Enlace inválido</h2>
          <p style={{ color: "var(--sw-text-muted)", marginBottom: 24 }}>
            El enlace no contiene un token de recuperación válido.
          </p>
          <Link href="/login" className="btn-submit" style={{ display: "inline-block", textDecoration: "none" }}>
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="login-wrapper">
        <div className="container" style={{ padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: "var(--sw-success)", marginBottom: 12 }}>¡Contraseña actualizada!</h2>
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
      <h2>Nueva Contraseña</h2>
      <p className="intro">Ingresa y confirma tu nueva contraseña para recuperar el acceso.</p>

      <div className="container">
        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label>Nueva contraseña</label>
            <div className="input-group-password">
              <input
                type={showContrasena ? "text" : "password"}
                placeholder="Mín. 8 caracteres"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
              <button type="button" className="btn-toggle-password" onClick={() => setShowContrasena(!showContrasena)} aria-label={showContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showContrasena ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>Confirmar nueva contraseña</label>
            <div className="input-group-password">
              <input
                type={showConfirmar ? "text" : "password"}
                placeholder="Repite tu contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
              />
              <button type="button" className="btn-toggle-password" onClick={() => setShowConfirmar(!showConfirmar)} aria-label={showConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showConfirmar ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button type="submit" className="btn-submit" disabled={cargando}>
            {cargando ? "Actualizando..." : "Restablecer contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RestablecerPage() {
  return (
    <Suspense fallback={<div className="auth-scope"><div className="container">Cargando...</div></div>}>
      <RestablecerContent />
    </Suspense>
  );
}