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

  // Mensaje de registro exitoso (viene con ?registro=ok&tipo=...)
  const registroOk = searchParams.get("registro") === "ok";

  // Si viene del registro, auto-seleccionar el tab correcto
  useEffect(() => {
    const tipoParam = searchParams.get("tipo");
    if (tipoParam === "candidato" || tipoParam === "empresa") {
      setTipo(tipoParam);
    }
  }, [searchParams]);

  // Si ya hay sesión, redirigir al dashboard correspondiente
  useEffect(() => {
    if (cargandoAuth || !user) return;

    if (user.tipo === "candidato") router.replace("/candidato/inicio");
    else if (user.tipo === "empresa") router.replace("/empresa/inicio");
    else if (user.tipo === "administrador")
      router.replace("/administrador/inicio");
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
      else if (me.tipo === "administrador")
        router.push("/administrador/inicio");
    } catch (err: any) {
      setError(err?.message || "Correo o contraseña incorrectos.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-wrapper">
      <h2>¡Bienvenido/a!</h2>
      <p className="intro">
        {tipo === "candidato"
          ? "Nos alegra tenerte aquí. Conéctate para seguir creciendo y alcanzar tus metas."
          : "Nos alegra tenerte aquí. Conéctate para inspirar, crecer y transformar vidas desde tu empresa."}
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
          <div
            style={{
              background: "#d4edda",
              color: "#155724",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 12,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            ✅ Cuenta creada con éxito. Ahora inicia sesión.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            placeholder={
              tipo === "candidato"
                ? "ejemplo@gmail.com"
                : "empresa@correo.com"
            }
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password"
            required
          />
          <a href="#" className="forgot-password">
            ¿Olvidaste tu contraseña?
          </a>

          {error && (
            <p
              style={{
                color: "#dc3545",
                fontSize: 13,
                margin: "4px 0",
              }}
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={cargando}>
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>

          <p>
            ¿Eres nuevo/a?{" "}
            <Link
              href={
                tipo === "candidato"
                  ? "/registro/candidato"
                  : "/registro/empresa"
              }
            >
              Crea tu cuenta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

// Next.js 14+ requiere <Suspense> para useSearchParams
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-wrapper">
          <div className="container" style={{ padding: 40, textAlign: "center" }}>
            Cargando...
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}