"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "../../../lib/api";

export default function RegistroCandidatoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombreCompleto: "", correo: "", contrasena: "", confirmar: "", telefono: "", ciudad: "",
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  function update(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nombreCompleto.trim()) return setError("Escribe tu nombre completo.");
    if (!form.correo.trim()) return setError("Escribe tu correo.");
    if (form.contrasena !== form.confirmar) return setError("Las contraseñas no coinciden.");
    if (form.contrasena.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (!form.telefono.trim()) return setError("Escribe tu teléfono.");
    if (!form.ciudad.trim()) return setError("Escribe tu ciudad.");
    if (!aceptaTerminos) return setError("Debes aceptar los términos y condiciones.");

    setCargando(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/registro/candidato`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCompleto: form.nombreCompleto,
          correo: form.correo,
          contrasena: form.contrasena,
          telefono: form.telefono,
          ciudad: form.ciudad,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo crear la cuenta.");
      }

      setExito(true);
      setTimeout(() => router.push("/login?registro=ok&tipo=candidato"), 1800);
    } catch (err: any) {
      setError(err?.message || "No se pudo crear la cuenta.");
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <div className="login-wrapper">
        <div className="container" style={{ padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: "var(--sw-blue)" }}>¡Cuenta creada!</h2>
          <p style={{ color: "var(--sw-text-muted)" }}>Redirigiendo a inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
        <h1 className="sw-brand-name">SEEDWORK</h1>
      <h2>Crear Cuenta</h2>
      <p className="intro">Comienza a crecer con nosotros.</p>

      <div className="container">
        <div className="tabs">
          <button type="button" className="active">Soy Candidato</button>
          <button type="button" onClick={() => router.push("/registro/empresa")}>Soy Empresa</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label>Nombre completo</label>
            <input type="text" placeholder="Ej. Juan Pérez" value={form.nombreCompleto} onChange={(e) => update("nombreCompleto", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Correo electrónico</label>
            <input type="email" placeholder="ejemplo@gmail.com" value={form.correo} onChange={(e) => update("correo", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" placeholder="Mín. 8 caracteres" value={form.contrasena} onChange={(e) => update("contrasena", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Confirmar contraseña</label>
            <input type="password" placeholder="Repite tu contraseña" value={form.confirmar} onChange={(e) => update("confirmar", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Teléfono</label>
            <input type="tel" placeholder="300 123 4567" value={form.telefono} onChange={(e) => update("telefono", e.target.value)} />
          </div>
          <div className="input-group">
            <label>Ciudad</label>
            <input type="text" placeholder="Medellín" value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)} />
          </div>

          <div className="checkbox-group">
            <input type="checkbox" id="terms" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} />
            <label htmlFor="terms" style={{ fontWeight: "normal", fontSize: "14px", color: "var(--sw-text-muted)" }}>
              Aceptar términos y condiciones
            </label>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button type="submit" className="btn-submit" disabled={cargando}>
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
          <p className="footer-link">
            ¿Ya tienes cuenta? <Link href="/login">Inicia sesión aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}