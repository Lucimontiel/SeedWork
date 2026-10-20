"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "../../lib/api";

function VerificarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [estado, setEstado] = useState<"cargando" | "exito" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!token) {
      setEstado("error");
      setMensaje("No se encontró un token de verificación.");
      return;
    }

    async function verificar() {
      try {
        const resp = await fetch(`${API_BASE}/api/auth/verificar-correo?token=${token}`);
        const data = await resp.json();

        if (resp.ok) {
          setEstado("exito");
        } else {
          setEstado("error");
          setMensaje(data.detail || "El enlace es inválido o ha expirado.");
        }
      } catch (err) {
        setEstado("error");
        setMensaje("Error de conexión con el servidor.");
      }
    }
    verificar();
  }, [token]);

  return (
    <div className="login-wrapper">
      <div className="sw-brand-header">
        <img src="/logo-blanco.png" alt="SeedWork Logo" className="sw-logo-icon" />
        <h1 className="sw-brand-name">SEEDWORK</h1>
      </div>

      <div className="container" style={{ padding: 40, textAlign: "center" }}>
        {estado === "cargando" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={{ color: "var(--sw-blue)" }}>Verificando...</h2>
            <p style={{ color: "var(--sw-text-muted)" }}>Estamos validando tu correo electrónico.</p>
          </>
        )}

        {estado === "exito" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: "var(--sw-success)" }}>¡Correo verificado!</h2>
            <p style={{ color: "var(--sw-text-muted)", marginBottom: 24 }}>
              Tu cuenta está activa. Ya puedes iniciar sesión y empezar a crecer.
            </p>
            <Link href="/login" className="btn-submit" style={{ display: "inline-block", textDecoration: "none" }}>
              Ir al inicio de sesión
            </Link>
          </>
        )}

        {estado === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: "var(--sw-error)" }}>Error de verificación</h2>
            <p style={{ color: "var(--sw-text-muted)", marginBottom: 24 }}>{mensaje}</p>
            <Link href="/login" className="btn-secondary" style={{ display: "inline-block", textDecoration: "none" }}>
              Volver al login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerificarPage() {
  return (
    <Suspense fallback={<div className="auth-scope"><div className="container">Cargando...</div></div>}>
      <VerificarContent />
    </Suspense>
  );
}