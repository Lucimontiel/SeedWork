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
  const [showContrasena, setShowContrasena] = useState(false);
  const [codigo, setCodigo] = useState("");
  
  // Estado para el token temporal de 2FA
  const [challengeTokenState, setChallengeTokenState] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Redirección si ya está logueado como admin
  useEffect(() => {
    if (cargandoAuth || !user) return;
    if (user.tipo === "administrador") router.replace("/administrador/inicio");
  }, [user, cargandoAuth, router]);

  async function handleCredenciales(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!correo.trim() || !contrasena.trim()) {
      return setError("Completa todos los campos.");
    }

    setCargando(true);
    try {
      // Asumimos que adminLoginStep1 devuelve un objeto con requiere2FA y challengeToken
      const response = await adminLoginStep1(correo, contrasena);
      
      if (response.requiere2FA && response.challengeToken) {
        setChallengeTokenState(response.challengeToken);
        setPaso("2fa");
      } else {
        router.replace("/administrador/inicio");
      }
    } catch (err: unknown) {
      // Manejo de error seguro para TypeScript
      const mensaje = err instanceof Error ? err.message : "Credenciales incorrectas.";
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    const codigoLimpio = codigo.trim();
    if (codigoLimpio.length < 6) return setError("Ingresa el código de 6 dígitos.");
    if (!challengeTokenState) return setError("Sesión de 2FA expirada. Vuelve a iniciar sesión.");

    setCargando(true);
    try {
      await adminLoginStep2(challengeTokenState, codigoLimpio);
      router.replace("/administrador/inicio");
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "Código inválido.";
      setError(mensaje);
      setCodigo("");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="sw-brand-header">
        {/* Agregamos width y height recomendados para evitar saltos de diseño */}
        <img src="/logo_blanco.png" alt="SeedWork Logo" className="sw-logo-icon" width={80} height={80} />
        <h1 className="sw-brand-name">SEEDWORK</h1>
      </div>
      
      <h2>Panel Administrador</h2>
      <p className="intro">
        {paso === "credenciales" 
          ? "Ingresa tus credenciales." 
          : "Ingresa el código de tu aplicación de autenticación."}
      </p>

      <div className="container">
        {error && <div className="alert-error">{error}</div>}

        {paso === "credenciales" ? (
          <form onSubmit={handleCredenciales} noValidate>
            <div className="input-group">
              <label>Correo electrónico</label>
              <input 
                type="email" 
                placeholder="admin@seedwork.com" 
                value={correo} 
                onChange={(e) => setCorreo(e.target.value)} 
                autoComplete="email" 
                required 
              />
            </div>
            
            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-group-password">
                <input
                  type={showContrasena ? "text" : "password"}
                  placeholder="••••••••"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  autoComplete="current-password"
                  required
                />
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
              </div>
            </div>
            
            <button type="submit" className="btn-submit" disabled={cargando}>
              {cargando ? "Verificando..." : "Continuar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FA} noValidate>
            <p style={{ fontSize: 14, color: "var(--sw-text-muted)", marginBottom: 12, textAlign: "center" }}>
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
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => { 
                setPaso("credenciales"); 
                setCodigo(""); 
                setChallengeTokenState(null); 
                setError(null); 
              }}
            >
              ← Volver
            </button>
          </form>
        )}
      </div>
    </div>
  );
}