"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "../../../lib/api";

const SECTORES = [
  "Tecnología",
  "Educación",
  "Salud",
  "Finanzas",
  "Construcción",
  "Otro",
];

export default function RegistroEmpresaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombreEmpresa: "",
    correo: "",
    contrasena: "",
    confirmar: "",
    nit: "",
    sector: "",
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

    if (!form.nombreEmpresa.trim()) {
      setError("Escribe el nombre de la empresa.");
      return;
    }
    if (!form.correo.trim()) {
      setError("Escribe el correo.");
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
    if (!form.nit.trim()) {
      setError("Escribe el NIT.");
      return;
    }
    if (!form.sector) {
      setError("Selecciona un sector.");
      return;
    }
    if (!form.ciudad.trim()) {
      setError("Escribe la ciudad.");
      return;
    }
    if (!aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    setCargando(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/registro/empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreEmpresa: form.nombreEmpresa,
          correo: form.correo,
          contrasena: form.contrasena,
          nit: form.nit,
          sector: form.sector,
          ciudad: form.ciudad,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo crear la cuenta.");
      }

      setExito(true);
      setTimeout(() => {
        router.push("/login?registro=ok&tipo=empresa");
      }, 1800);
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
      <p className="intro">Tu empresa es parte del futuro del empleo.</p>

      <div className="container">
        <div className="tabs">
          <button
            type="button"
            onClick={() => router.push("/registro/candidato")}
          >
            Soy Candidato
          </button>
          <button type="button" className="active">
            Soy Empresa
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            placeholder="Nombre empresa"
            required
            value={form.nombreEmpresa}
            onChange={(e) => update("nombreEmpresa", e.target.value)}
            autoComplete="organization"
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
            type="text"
            placeholder="NIT / RUT"
            required
            value={form.nit}
            onChange={(e) => update("nit", e.target.value)}
          />
          <select
            required
            value={form.sector}
            onChange={(e) => update("sector", e.target.value)}
          >
            <option value="">Selecciona sector</option>
            {SECTORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Ciudad (ej. Medellín)"
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