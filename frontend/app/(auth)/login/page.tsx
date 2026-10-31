"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, cargando: cargandoAuth, login, login2FA } = useAuth();
  const [tipo, setTipo] = useState<"candidato" | "empresa">("candidato");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showContrasena, setShowContrasena] = useState(false);
  const [recordarme, setRecordarme] = useState(false); // ⬅️ NUEVO
  
  const [error, setError] = useState<string | null>(null);
  const [tipoError, setTipoError] = useState<"error" | "warning">("error");
  const [cargando, setCargando] = useState(false);

  const [paso, setPaso] = useState<"credenciales" | "2fa">("credenciales");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [codigo2FA, setCodigo2FA] = useState("");

  const registroOk = searchParams.get("registro") === "ok";
  const passwordChanged = searchParams.get("password-changed") === "1";


  // ⬅️ NUEVO: Al cargar la página, buscar si hay un correo guardado
  useEffect(() => {
    const correoGuardado = localStorage.getItem("seedwork_remember_email");
    if (correoGuardado) {
      setCorreo(correoGuardado);
      setRecordarme(true);
    }
  }, []);

  useEffect(() => {
    const tipoParam = searchParams.get("tipo");
    if (tipoParam === "candidato" || tipoParam === "empresa") {
      setTipo(tipoParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (cargandoAuth || !user) return;
    if (user.tipo === "candidato") router.replace("/candidato/inicio");
    else if (user.tipo === "empresa") router.replace("/empresa/inicio");
    else if (user.tipo === "administrador") router.replace("/administrador/inicio");
  }, [user, cargandoAuth, router]);

   async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTipoError("error");

    if (!correo || !contrasena) return setError("Por favor, completa todos los campos.");

    setCargando(true);
    try {
      // Paso 1: Credenciales
      if (paso === "credenciales") {
        const resp = await login(correo, contrasena, tipo);
        
        if (resp && "dos_fa_requerido" in resp && resp.dos_fa_requerido) {
          setChallengeToken(resp.challenge_token);
          setPaso("2fa");
          return;
        }
        
        // Si no pide 2FA, redirigimos
        if (recordarme) localStorage.setItem("seedwork_remember_email", correo);
        else localStorage.removeItem("seedwork_remember_email");
        
        // El AuthProvider ya actualizó el user, el useEffect de arriba redirigirá.
      } 
      // Paso 2: Código 2FA
      else if (paso === "2fa") {
        if (!challengeToken) throw new Error("Sesión expirada. Vuelve a intentarlo.");
        const me = await login2FA(challengeToken, codigo2FA.trim());
        
        if (me.tipo === "candidato") router.push("/candidato/inicio");
        else if (me.tipo === "empresa") router.push("/empresa/inicio");
      }
    } catch (err: any) {
      if (err?.status === 429) setTipoError("warning");
      setError(err?.message || "Ocurrió un error.");
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

      <h2>¡Bienvenido/a!</h2>
      <p className="intro">
        {tipo === "candidato"
          ? "Conéctate para seguir creciendo y alcanzar tus metas."
          : "Conéctate para inspirar, crecer y transformar vidas desde tu empresa."}
      </p>

      <div className="container">
        <div className="tabs" role="tablist">
          <button
            type="button"
            className={tipo === "candidato" ? "active" : ""}
            onClick={() => setTipo("candidato")}
          >
            Soy Candidato
          </button>
          <button
            type="button"
            className={tipo === "empresa" ? "active" : ""}
            onClick={() => setTipo("empresa")}
          >
            Soy Empresa
          </button>
        </div>

        {registroOk && (
          <div className="alert-success">
            ✅ Cuenta creada con éxito. Ahora inicia sesión.
          </div>
        )}

        {passwordChanged && (
          <div className="alert-success">
            ✅ Contraseña actualizada. Inicia sesión con tu nueva contraseña.
          </div>
        )}

                <form onSubmit={handleSubmit} noValidate>
          
          {paso === "credenciales" ? (
            <>
              {/* INPUT DE CORREO */}
              <div className="input-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  placeholder={tipo === "candidato" ? "ejemplo@gmail.com" : "empresa@correo.com"}
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              
              {/* INPUT DE CONTRASEÑA */}
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
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* RECORDARME Y OLVIDÉ CONTRASEÑA */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "-4px" }}>
                <div className="checkbox-group" style={{ margin: 0 }}>
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={recordarme} 
                    onChange={(e) => setRecordarme(e.target.checked)} 
                  />
                  <label htmlFor="remember">Recordarme</label>
                </div>
                <Link href="/olvide-password" className="forgot-password" style={{ margin: 0 }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </>
          ) : (
            /* PANTALLA 2FA */
            <div className="input-group" style={{ textAlign: "center" }}>
              <label style={{ marginBottom: 10, display: "block" }}>
                Ingresa el código de tu app autenticadora
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={codigo2FA}
                onChange={(e) => setCodigo2FA(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoFocus
                required
                style={{ fontSize: 24, letterSpacing: 8, textAlign: "center", fontWeight: 600 }}
              />
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => { setPaso("credenciales"); setCodigo2FA(""); setError(null); }}
                style={{ marginTop: 10 }}
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* MENSAJES DE ERROR */}
          {error && (
            <div className={tipoError === "warning" ? "alert-warning" : "alert-error"}>
              {tipoError === "warning" && "⏳ "}
              {error}
            </div>
          )}

          {/* BOTÓN DE ENVIAR */}
          <button type="submit" className="btn-submit" disabled={cargando || (paso === "2fa" && codigo2FA.length < 6)}>
            {cargando ? "Verificando..." : paso === "credenciales" ? "Iniciar sesión" : "Verificar código"}
          </button>

          {/* LINK DE REGISTRO (Solo se muestra si no estamos en el paso 2FA) */}
          {paso === "credenciales" && (
            <p className="footer-link">
              ¿Eres nuevo/a?{" "}
              <Link href={tipo === "candidato" ? "/registro/candidato" : "/registro/empresa"}>
                Crea tu cuenta
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-scope"><div className="container">Cargando...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}