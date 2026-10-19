"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";

type Paso = "credenciales" | "2fa";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, cargando: cargandoAuth, adminLoginStep1, adminLoginStep2 } = useAuth();

  const [paso, setPaso] = useState<Paso>("credenciales");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [codigo, setCodigo] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null); // ⬅️ NUEVO
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (cargandoAuth || !user) return;
    if (user.tipo === "administrador") router.replace("/administrador/inicio");
  }, [user, cargandoAuth, router]);

  async function handleCredenciales(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!correo || !contrasena) return setError("Completa todos los campos.");

    setCargando(true);
    try {
      const { requiere2FA, challengeToken } = await adminLoginStep1(correo, contrasena);
      if (requiere2FA && challengeToken) {
        setChallengeToken(challengeToken); // ⬅️ Guardamos el token
        setPaso("2fa");
      } else {
        router.replace("/administrador/inicio");
      }
    } catch (err: any) {
      setError(err?.message || "Credenciales incorrectas.");
    } finally {
      setCargando(false);
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!codigo || codigo.trim().length < 6) return setError("Ingresa el código de 6 dígitos.");
    if (!challengeToken) return setError("Sesión de 2FA expirada. Vuelve a iniciar sesión.");

    setCargando(true);
    try {
      await adminLoginStep2(challengeToken, codigo.trim()); // ⬅️ Usamos el token
      router.replace("/administrador/inicio");
    } catch (err: any) {
      setError(err?.message || "Código inválido.");
      setCodigo("");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-wrapper">
            <div className="sw-brand-header">
        {/* Logo Blanco para Auth */}
        <img 
          src="/logo_blanco.png" 
          alt="SeedWork Logo" 
          className="sw-logo-icon" 
        />
        <h1 className="sw-brand-name">SEEDWORK</h1>
      </div>
      <h2>Panel Administrador</h2>
      <p className="intro">
        {paso === "credenciales" ? "Ingresa tus credenciales." : "Ingresa el código de tu aplicación de autenticación."}
      </p>

      <div className="container">
        {error && <div className="alert-error">{error}</div>}

        {paso === "credenciales" ? (
          <form onSubmit={handleCredenciales} noValidate>
            <div className="input-group">
              <label>Correo electrónico</label>
              <input type="email" placeholder="admin@seedwork.com" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" required />
            </div>
            <div className="input-group">
              <label>Contraseña</label>
              <input type="password" placeholder="••••••••" value={contrasena} onChange={(e) => setContrasena(e.target.value)} autoComplete="current-password" required />
            </div>
            <button type="submit" className="btn-submit" disabled={cargando}>
              {cargando ? "Verificando..." : "Continuar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FA} noValidate>
            <p style={{ fontSize: 14, color: "var(--sw-text-muted)", marginBottom: 12 }}>
              Abre <strong>Google Authenticator</strong> e ingresa el código para <strong>{correo}</strong>.
            </p>
            <div className="input-group">
              <label>Código de 6 dígitos</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                autoFocus
                required
                style={{ fontSize: 24, letterSpacing: 8, textAlign: "center", fontWeight: 600 }}
              />
            </div>
            <button type="submit" className="btn-submit" disabled={cargando || codigo.length < 6}>
              {cargando ? "Verificando..." : "Verificar e ingresar"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setPaso("credenciales"); setCodigo(""); setChallengeToken(null); setError(null); }}>
              ← Volver
            </button>
          </form>
        )}
      </div>
    </div>
  );
}