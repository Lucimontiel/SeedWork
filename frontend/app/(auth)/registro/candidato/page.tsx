"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "../../../lib/api";

export default function RegistroCandidatoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombreCompleto: "",
    correo: "",
    contrasena: "",
    confirmar: "",
    telefono: "",
    ciudad: "",
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

    if (!form.nombreCompleto.trim()) {
      setError("Escribe tu nombre completo.");
      return;
    }
    if (!form.correo.trim()) {
      setError("Escribe tu correo.");
      return;
    }
    if (form.contrasena !== form.confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!form.telefono.trim()) {
      setError("Escribe tu teléfono.");
      return;
    }
    if (!form.ciudad.trim()) {
      setError("Escribe tu ciudad.");
      return;
    }
    if (!aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    setCargando(true);
    try {
      // El registro ya no devuelve cookies ni loguea.
      // Solo crea la cuenta. El usuario debe ir a /login después.
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

      // ✅ Éxito: mostrar mensaje y redirigir a /login
      setExito(true);
      setTimeout(() => {
        router.push("/login?registro=ok&tipo=candidato");
      }, 1800);
    } catch (err: any) {
      setError(err?.message || "No se pudo crear la cuenta.");
    } finally {
      setCargando(false);
    }
  }

  // Estado de éxito: mensaje y redirección
  if (exito) {
    return (
      <div className="login-wrapper">
        <div className="container" style={{ padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: "#0d6efd", marginBottom: 12 }}>
            ¡Cuenta creada!
          </h2>
          <p style={{ color: "#667085" }}>
            Redirigiendo a inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <h2>Crear Cuenta</h2>
      <p className="intro">Comienza a crecer con nosotros.</p>

      <div className="container">
        <div className="tabs">
          <button type="button" className="active">
            Soy Candidato
          </button>
          <button
            type="button"
            onClick={() => router.push("/registro/empresa")}
          >
            Soy Empresa
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            placeholder="Nombre completo"
            required
            value={form.nombreCompleto}
            onChange={(e) => update("nombreCompleto", e.target.value)}
            autoComplete="name"
          />
          <input
            type="email"
            placeholder="ejemplo@gmail.com"
            required
            value={form.correo}
            onChange={(e) => update("correo", e.target.value)}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            required
            minLength={8}
            value={form.contrasena}
            onChange={(e) => update("contrasena", e.target.value)}
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            required
            minLength={8}
            value={form.confirmar}
            onChange={(e) => update("confirmar", e.target.value)}
            autoComplete="new-password"
          />
          <input
            type="tel"
            placeholder="300 123 4567"
            required
            value={form.telefono}
            onChange={(e) => update("telefono", e.target.value)}
            autoComplete="tel"
          />
          <input
            type="text"
            placeholder="Medellín"
            required
            value={form.ciudad}
            onChange={(e) => update("ciudad", e.target.value)}
            autoComplete="address-level2"
          />

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="terms"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              required
            />
            <label htmlFor="terms">Aceptar términos y condiciones</label>
          </div>

          {error && (
            <p style={{ color: "#dc3545", fontSize: 13, margin: "4px 0" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={cargando}>
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
          <p>
            ¿Ya tienes cuenta? <Link href="/login">Inicia sesión aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}