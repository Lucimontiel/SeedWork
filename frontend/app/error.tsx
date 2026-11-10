"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    // Opcional: Aquí podrías enviar el error a Sentry o a tu propio backend
    console.error("Error capturado por Next.js:", error);
  }, [error]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F4F6F9", textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 80, marginBottom: 20 }}>⚠️</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#101828", margin: "0 0 10px" }}>Algo salió mal</h1>
      <p style={{ color: "#667085", fontSize: 16, marginBottom: 30 }}>Ha ocurrido un error inesperado en la aplicación.</p>
      <div style={{ display: "flex", gap: 16 }}>
        <button onClick={() => reset()} style={{ background: "#2D6CDF", color: "#fff", padding: "12px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 }}>
          Intentar de nuevo
        </button>
        <a href="/" style={{ background: "#fff", color: "#101828", border: "1px solid #E6E9EF", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
          Ir al inicio
        </a>
      </div>
    </div>
  );
}