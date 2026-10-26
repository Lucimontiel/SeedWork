"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../lib/api";

type Estado = "verificando" | "exito" | "error";

function VerificarContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [estado, setEstado] = useState<Estado>("verificando");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!token) {
      setEstado("error");
      setMensaje("El enlace no contiene un token.");
      return;
    }

    let activo = true;
    apiFetch<{ message: string }>("/api/auth/verificar-correo", {
      method: "POST",
      body: { token },
    })
      .then((data) => {
        if (!activo) return;
        setEstado("exito");
        setMensaje(data.message);
      })
      .catch((err: any) => {
        if (!activo) return;
        setEstado("error");
        setMensaje(err?.message || "No se pudo verificar el correo.");
      });

    return () => { activo = false; };
  }, [token]);

  if (estado === "verificando") {
    return (
      <div className="login-wrapper">
        <div className="container" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h2 style={{ color: "var(--sw-blue)" }}>Verificando tu correo...</h2>
          <p style={{ color: "var(--sw-text-muted)" }}>Un momento por favor.</p>
        </div>
      </div>
    );
  }

  if (estado === "exito") {
    return (
      <div className="login-wrapper">
        <div className="container" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: "var(--sw-success)" }}>¡Correo verificado!</h2>
          <p style={{ color: "var(--sw-text-muted)", marginBottom: 24 }}>{mensaje}</p>
          <Link href="/login" className="btn-submit" style={{ display: "inline-block", textDecoration: "none" }}>
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="container" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: "var(--sw-error)" }}>Enlace inválido</h2>
        <p style={{ color: "var(--sw-text-muted)", marginBottom: 24 }}>{mensaje}</p>
        <Link href="/login" className="btn-submit" style={{ display: "inline-block", textDecoration: "none" }}>
          Volver al login
        </Link>
      </div>
    </div>
  );
}

export default function VerificarCorreoPage() {
  return (
    <Suspense fallback={<div className="auth-scope"><div className="container">Cargando...</div></div>}>
      <VerificarContent />
    </Suspense>
  );
}