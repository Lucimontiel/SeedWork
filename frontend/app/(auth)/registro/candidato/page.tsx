<<<<<<< HEAD
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
=======
"use client"; // Le dice a Next.js que este componente se ejecuta en el navegador (no en el servidor),
              // porque usamos hooks de React (useState) e interacción del usuario (formularios, clics).

import { useState } from "react"; // Hook de React para manejar estado (variables que cambian y re-renderizan la UI)
import { useRouter } from "next/navigation"; // Hook de Next.js para redirigir al usuario a otra página por código
import Link from "next/link"; // Componente de Next.js para crear enlaces internos sin recargar la página

// URL base de la API del backend (FastAPI).
// Si existe la variable de entorno NEXT_PUBLIC_API_BASE (definida en .env), se usa esa;
// si no, usa "http://localhost:8000" como valor por defecto (útil en desarrollo local).
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// Componente principal de la página. Next.js renderiza esto automáticamente
// en la ruta /registro/candidato porque el archivo se llama page.tsx dentro de esa carpeta.
export default function RegistroCandidatoPage() {
  const router = useRouter(); // Instancia del router, para poder hacer router.push("/ruta") más abajo

  // --- Estados del formulario ---
  // Cada "useState" guarda el valor actual de un campo y una función para actualizarlo.
  // Cuando el usuario escribe, se llama a la función "set..." y React vuelve a dibujar el componente.
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState(""); // Solo se usa para validar en el frontend, no se envía al backend
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");

  // Estado para mostrar mensajes de error en pantalla (null = sin error)
  const [error, setError] = useState<string | null>(null);

  // Estado para saber si la petición al backend está en curso,
  // así podemos desactivar el botón y mostrar "Creando cuenta..."
  const [cargando, setCargando] = useState(false);

  // Función que se ejecuta cuando el usuario envía el formulario (submit)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // Evita que el navegador recargue la página (comportamiento por defecto de un <form>)
    setError(null); // Limpiamos cualquier error anterior antes de intentar de nuevo

    // --- Validación 1: campos vacíos ---
    // Si falta cualquier campo obligatorio, mostramos un error y no seguimos (return corta la función aquí)
    if (!nombreCompleto || !correo || !contrasena || !telefono || !ciudad) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    // --- Validación 2: las contraseñas deben coincidir ---
    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true); // Activamos el estado de "cargando" mientras esperamos la respuesta del servidor

    try {
      // Petición HTTP POST al backend, al endpoint que registra candidatos
      const resp = await fetch(`${API_BASE}/api/auth/registro/candidato`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Le decimos al servidor que enviamos JSON
        // Convertimos los datos del formulario a JSON.
        // OJO: no enviamos "confirmarContrasena", el backend no la espera (ver RegistroCandidatoIn en schemas.py)
        body: JSON.stringify({ nombreCompleto, correo, contrasena, telefono, ciudad }),
      });

      // Si el servidor responde con un error (status fuera del rango 200-299)...
      if (!resp.ok) {
        // Intentamos leer el mensaje de error que manda FastAPI (campo "detail")
        const data = await resp.json().catch(() => null); // catch evita que truene si la respuesta no es JSON válido
        // Lanzamos un error con ese mensaje, o uno genérico si no vino nada
        throw new Error(data?.detail || "No se pudo completar el registro.");
      }

      // Si todo salió bien, mandamos al usuario a la pantalla de login para que inicie sesión
      router.push("/login");
    } catch (err: any) {
      // Si algo falló (la petición, la validación del servidor, etc.), mostramos el mensaje en pantalla
      setError(err.message);
    } finally {
      // Esto se ejecuta siempre, haya éxito o error, para "apagar" el estado de carga
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
      setCargando(false);
    }
  }

<<<<<<< HEAD
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
=======
  // --- Lo que se ve en pantalla (JSX) ---
  return (
    // Contenedor general de la página de login/registro (misma clase que usa login/page.tsx,
    // así hereda el mismo estilo visual definido en estilo-auth.css)
    <div className="login-wrapper">
      <h2>¡Crea tu cuenta!</h2>
      <p className="intro">
        Regístrate como candidato para empezar a postularte a vacantes y hacer crecer tu carrera.
      </p>

      <div className="container">
        {/* noValidate desactiva la validación nativa del navegador,
            porque ya hacemos nuestra propia validación en handleSubmit */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Cada input es "controlado": su valor viene del estado (value={...})
              y cada vez que el usuario escribe, actualizamos ese estado (onChange) */}
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            required
          />
          <input
            type="email" // El navegador valida automáticamente que tenga formato de correo
            placeholder="ejemplo@gmail.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <input
            type="tel" // Tipo pensado para números de teléfono (en móviles abre el teclado numérico)
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Ciudad (ej. Medellín)"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            required
          />
          <input
            type="password" // Oculta el texto que se escribe (puntos/asteriscos)
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
            required
          />

          {/* Solo se muestra el párrafo de error si "error" tiene algún texto (no es null) */}
          {error && <p style={{ color: "#dc3545", fontSize: 13, margin: "4px 0" }}>{error}</p>}

          {/* El botón se deshabilita mientras "cargando" es true, para evitar doble clic/doble envío */}
          <button type="submit" disabled={cargando}>
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p>
            {/* Link de Next.js: navega a /login sin recargar toda la página */}
            ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
          </p>
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
        </form>
      </div>
    </div>
  );
}