"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "../../lib/session";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<"candidato" | "empresa">("candidato");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!correo || !contrasena) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setCargando(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena, tipo }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || "Correo o contraseña incorrectos");
      }

      const data = await resp.json();
<<<<<<< HEAD

      // El backend decide el tipo real de la cuenta. Si es una cuenta de
      // administrador, entra como administrador sin importar si en el
      // formulario se eligió "Soy Candidato" o "Soy Empresa".
      if (data.tipo === "administrador") {
        saveSession({ tipo: "administrador", id: data.idAdministrador });
        router.push("/administrador/inicio");
      } else if (data.tipo === "candidato") {
=======
      if (tipo === "candidato") {
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
        saveSession({ tipo: "candidato", id: data.idCandidato });
        router.push("/candidato/inicio");
      } else {
        saveSession({ tipo: "empresa", id: data.idEmpresa });
        router.push("/empresa/inicio");
      }
<<<<<<< HEAD
=======
      
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
    } catch (err: any) {
      setError(err.message);
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

        <form onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            placeholder={tipo === "candidato" ? "ejemplo@gmail.com" : "empresa@correo.com"}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
          <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>

          {error && <p style={{ color: "#dc3545", fontSize: 13, margin: "4px 0" }}>{error}</p>}

          <button type="submit" disabled={cargando}>
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>

          <p>
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