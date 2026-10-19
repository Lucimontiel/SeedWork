"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, cargando: cargandoAuth, login } = useAuth();

  const [tipo, setTipo] = useState<"candidato" | "empresa">("candidato");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const registroOk = searchParams.get("registro") === "ok";

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

    if (!correo || !contrasena) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setCargando(true);
    try {
      const me = await login(correo, contrasena, tipo);
      if (me.tipo === "candidato") router.push("/candidato/inicio");
      else if (me.tipo === "empresa") router.push("/empresa/inicio");
    } catch (err: any) {
      setError(err?.message || "Correo o contraseña incorrectos.");
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

        <form onSubmit={handleSubmit} noValidate>
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
          
          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          
          <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>

          {error && <div className="alert-error">{error}</div>}

          <button type="submit" className="btn-submit" disabled={cargando}>
            {cargando ? "Ingresando..." : "Iniciar sesión"}
            {!cargando && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            )}
          </button>

          <p className="footer-link">
            ¿Eres nuevo/a?{" "}
            <Link href={tipo === "candidato" ? "/registro/candidato" : "/registro/empresa"}>
              Crea tu cuenta
            </Link>
          </p>
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