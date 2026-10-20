"use client";

import { useState } from "react";
import Link from "next/link";
import { API_BASE } from "../../lib/api";

export default function OlvidePasswordPage() {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!correo) return setError("Por favor, ingresa tu correo.");

    setCargando(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/olvide-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || "Error al procesar la solicitud.");
      }

      setExito(true);
    } catch (err: any) {
      setError(err?.message || "Error al procesar la solicitud.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="sw-brand-header">
        <img src="/logo_blanco.png" alt="SeedWork Logo" className="sw-logo-icon" />
        <h1 className="sw-brand-name">SEEDWORK</h1>
      </div>
      <h2>Recuperar Contraseña</h2>
      <p className="intro">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>

      <div className="container">
        {exito ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h3 style={{ color: "var(--sw-blue)", marginBottom: 12 }}>Revisa tu correo</h3>
            <p style={{ color: "var(--sw-text-muted)", marginBottom: 24, fontSize: 14 }}>
              Si el correo <strong>{correo}</strong> está registrado, recibirás un enlace en breve.
            </p>
            <Link href="/login" className="btn-submit" style={{ display: "inline-block", textDecoration: "none" }}>
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="ejemplo@gmail.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>

            {error && <div className="alert-error">{error}</div>}

            <button type="submit" className="btn-submit" disabled={cargando}>
              {cargando ? "Enviando..." : "Enviar enlace"}
            </button>
            
            <p className="footer-link" style={{ marginTop: 24 }}>
              <Link href="/login">← Volver al inicio de sesión</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}