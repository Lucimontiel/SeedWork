"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";

type Paso = "credenciales" | "2fa";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, cargando: cargandoAuth, adminLoginStep1, adminLoginStep2 } =
    useAuth();

  const [paso, setPaso] = useState<Paso>("credenciales");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Si ya hay sesión de admin, redirigir directo
  useEffect(() => {
    if (cargandoAuth || !user) return;
    if (user.tipo === "administrador") {
      router.replace("/administrador/inicio");
    }
  }, [user, cargandoAuth, router]);

  // Paso 1: credenciales
  async function handleCredenciales(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!correo || !contrasena) {
      setError("Completa todos los campos.");
      return;
    }

    setCargando(true);
    try {
      const { requiere2FA } = await adminLoginStep1(correo, contrasena);

      if (requiere2FA) {
        setPaso("2fa");
      } else {
        router.replace("/administrador/inicio");
      }
    } catch (err: any) {
      // Mensaje genérico del backend (no revela si el correo existe)
      setError(err?.message || "Credenciales incorrectas.");
    } finally {
      setCargando(false);
    }
  }

  // Paso 2: código TOTP
  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!codigo || codigo.trim().length < 6) {
      setError("Ingresa el código de 6 dígitos.");
      return;
    }

    setCargando(true);
    try {
      await adminLoginStep2(correo, codigo.trim());
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
      <h2>Panel Administrador</h2>
      <p className="intro">
        {paso === "credenciales"
          ? "Ingresa tus credenciales para continuar."
          : "Ingresa el código de tu aplicación de autenticación."}
      </p>

      <div className="container">
        {error && (
          <div
            style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {paso === "credenciales" ? (
          <form onSubmit={handleCredenciales} noValidate>
            <input
              type="email"
              placeholder="admin@seedwork.com"
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
            <button type="submit" disabled={cargando}>
              {cargando ? "Verificando..." : "Continuar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FA} noValidate>
            <p
              style={{
                fontSize: 14,
                color: "#555",
                marginBottom: 12,
                textAlign: "left",
              }}
            >
              Abre <strong>Google Authenticator</strong> (o tu app de 2FA) e
              ingresa el código de 6 dígitos para{" "}
              <strong>{correo}</strong>.
            </p>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(e) =>
                setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              autoComplete="one-time-code"
              autoFocus
              required
              style={{
                fontSize: 24,
                letterSpacing: 8,
                textAlign: "center",
                fontWeight: 600,
              }}
            />

            <button type="submit" disabled={cargando || codigo.length < 6}>
              {cargando ? "Verificando..." : "Verificar e ingresar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setPaso("credenciales");
                setCodigo("");
                setError(null);
              }}
              style={{
                background: "transparent",
                color: "#0d6efd",
                border: "none",
                padding: 8,
                marginTop: 8,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ← Volver
            </button>

            <p style={{ fontSize: 12, color: "#889", marginTop: 16 }}>
              ¿Perdiste tu dispositivo? Usa uno de tus códigos de respaldo.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}