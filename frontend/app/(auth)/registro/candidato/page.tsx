"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "../../../lib/session";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function RegistroCandidatoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombreCompleto: "", correo: "", contrasena: "", confirmar: "", telefono: "", ciudad: "",
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function update(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.contrasena !== form.confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

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

    const data = await resp.json();
    saveSession({ tipo: "candidato", id: data.idCandidato });
    router.push("/candidato/inicio");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-wrapper">
      <h2>Crear Cuenta</h2>
      <p className="intro">Comienza a crecer con nosotros.</p>

      <div className="container">
        <div className="tabs">
          <button type="button" className="active">Soy Candidato</button>
          <button type="button" onClick={() => router.push("/registro/empresa")}>Soy Empresa</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <input type="text" placeholder="Nombre completo" required
            value={form.nombreCompleto} onChange={(e) => update("nombreCompleto", e.target.value)} />
          <input type="email" placeholder="ejemplo@gmail.com" required
            value={form.correo} onChange={(e) => update("correo", e.target.value)} />
          <input type="password" placeholder="Contraseña" required minLength={6}
            value={form.contrasena} onChange={(e) => update("contrasena", e.target.value)} />
          <input type="password" placeholder="Confirmar contraseña" required minLength={6}
            value={form.confirmar} onChange={(e) => update("confirmar", e.target.value)} />
          <input type="tel" placeholder="300 123 4567" required
            value={form.telefono} onChange={(e) => update("telefono", e.target.value)} />
          <input type="text" placeholder="Medellín" required
            value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)} />

          <div className="checkbox-group">
            <input type="checkbox" id="terms" checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)} required />
            <label htmlFor="terms">Aceptar términos y condiciones</label>
          </div>

          {error && <p style={{ color: "#dc3545", fontSize: 13, margin: "4px 0" }}>{error}</p>}

          <button type="submit" disabled={cargando}>
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
          <p>¿Ya tienes cuenta? <Link href="/login">Inicia sesión aquí</Link></p>
        </form>
      </div>
    </div>
  );
}