"use client";

import { useEffect, useState } from "react";
import CandidatoShell from "../CandidatoShell";
import { useCandidato } from "../../lib/useCandidato";
import { usePerfil, inferirNivelIdioma } from "./usePerfil";

// ---------------------------------------------------------------------------
// Ubicación: la ciudad se elige de una lista y el texto completo
// ("Ciudad, Departamento - Colombia") se arma automáticamente, para que
// el formato guardado en la BD sea siempre consistente.
// Bogotá es un caso especial: "Bogotá, D.C. - Colombia" (no lleva
// "Cundinamarca").
// ---------------------------------------------------------------------------
const CIUDADES_CO: { label: string; value: string }[] = [
  { label: "Bogotá", value: "Bogotá, D.C. - Colombia" },
  { label: "Medellín", value: "Medellín, Antioquia - Colombia" },
  { label: "Envigado", value: "Envigado, Antioquia - Colombia" },
  { label: "Itagüí", value: "Itagüí, Antioquia - Colombia" },
  { label: "Bello", value: "Bello, Antioquia - Colombia" },
  { label: "Rionegro", value: "Rionegro, Antioquia - Colombia" },
  { label: "Cali", value: "Cali, Valle del Cauca - Colombia" },
  { label: "Barranquilla", value: "Barranquilla, Atlántico - Colombia" },
  { label: "Cartagena", value: "Cartagena, Bolívar - Colombia" },
  { label: "Bucaramanga", value: "Bucaramanga, Santander - Colombia" },
  { label: "Cúcuta", value: "Cúcuta, Norte de Santander - Colombia" },
  { label: "Pereira", value: "Pereira, Risaralda - Colombia" },
  { label: "Manizales", value: "Manizales, Caldas - Colombia" },
  { label: "Armenia", value: "Armenia, Quindío - Colombia" },
  { label: "Ibagué", value: "Ibagué, Tolima - Colombia" },
  { label: "Villavicencio", value: "Villavicencio, Meta - Colombia" },
  { label: "Santa Marta", value: "Santa Marta, Magdalena - Colombia" },
  { label: "Pasto", value: "Pasto, Nariño - Colombia" },
  { label: "Neiva", value: "Neiva, Huila - Colombia" },
  { label: "Popayán", value: "Popayán, Cauca - Colombia" },
  { label: "Montería", value: "Montería, Córdoba - Colombia" },
  { label: "Sincelejo", value: "Sincelejo, Sucre - Colombia" },
  { label: "Tunja", value: "Tunja, Boyacá - Colombia" },
  { label: "Valledupar", value: "Valledupar, Cesar - Colombia" },
  { label: "Quibdó", value: "Quibdó, Chocó - Colombia" },
  { label: "Riohacha", value: "Riohacha, La Guajira - Colombia" },
  { label: "Otra ciudad...", value: "__otra__" },
];

function formatearTelefonoCO(valorActual: string, nuevo: string): string {
  const digitos = nuevo.replace(/\D/g, "").replace(/^57/, "").slice(0, 10);
  if (!digitos) return "+57 ";
  const p1 = digitos.slice(0, 3);
  const p2 = digitos.slice(3, 6);
  const p3 = digitos.slice(6, 10);
  return `+57 ${[p1, p2, p3].filter(Boolean).join(" ")}`.trim();
}

// --- Funciones para formatear fecha DD/MM/AAAA ---
function formatearFechaDDMMAAAA(fechaISO: string | null | undefined): string {
  if (!fechaISO) return "";
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

function parsearFechaDDMMAAAA(fechaStr: string): string {
  // Convierte DD/MM/AAAA a YYYY-MM-DD para el backend
  const partes = fechaStr.split("/");
  if (partes.length !== 3) return "";
  const [dia, mes, anio] = partes;
  if (dia.length !== 2 || mes.length !== 2 || anio.length !== 4) return "";
  return `${anio}-${mes}-${dia}`;
}

const NIVELES_IDIOMA = ["Nativo", "C2", "C1 (Avanzado)", "B2", "B1 (Intermedio)", "A2", "A1 (Básico)"];

// Redimensiona y comprime la imagen antes de convertirla a base64
function comprimirImagen(file: File, maxLado = 400, calidad = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxLado) {
          height = Math.round((height * maxLado) / width);
          width = maxLado;
        } else if (height > maxLado) {
          width = Math.round((width * maxLado) / height);
          height = maxLado;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo procesar la imagen"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PerfilCandidatoPage() {
  const { candidato } = useCandidato();
  const {
    perfil,
    loading,
    error,
    guardarDatos,
    guardarPreferencias,
    guardarSobreMi,
    guardarHabilidades,
    guardarFoto,
    agregarEducacion,
    agregarIdioma,
    agregarExperiencia,
    eliminarEducacion,
    eliminarIdioma,
    eliminarExperiencia,
  } = usePerfil(candidato?.idCandidato ?? null);

  const [isEditing, setIsEditing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [draft, setDraft] = useState<any>(null);
  const [ubicacionSel, setUbicacionSel] = useState("__otra__");
  const [ciudadManual, setCiudadManual] = useState("");
  const [skillsDraft, setSkillsDraft] = useState<string[]>([]);
  const [nuevaSkill, setNuevaSkill] = useState("");

  const [showEduForm, setShowEduForm] = useState(false);
  const [eduForm, setEduForm] = useState({ titulo: "", institucion: "", anio: "" });
  const [showLangForm, setShowLangForm] = useState(false);
  const [langForm, setLangForm] = useState({ nombre: "", nivel: "B1 (Intermedio)" });
  const [showExpForm, setShowExpForm] = useState(false);
  const [expForm, setExpForm] = useState({ titulo: "", categoria: "", anio: "" });

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function iniciarEdicion() {
    if (!perfil) return;
    setDraft({
      nombres: perfil.nombres || "",
      apellidos: perfil.apellidos || "",
      tituloProfesional: perfil.tituloProfesional || "",
      correo: perfil.correo || "",
      telefono: perfil.telefono || "+57 ",
      fechaNacimiento: perfil.fechaNacimiento || "",
      about: perfil.about || "",
      areaInteres: perfil.areaInteres || "",
      salarioEsperado: perfil.salarioEsperado || "",
      tipoContratoPreferido: perfil.tipoContratoPreferido || "Indiferente",
      jornadaPreferida: perfil.jornadaPreferida || "Tiempo completo",
      movilidad: perfil.movilidad || "Indiferente",
      modalidadPreferida: perfil.modalidadPreferida || "Presencial",
      disponibilidad: perfil.disponibilidad || "Inmediata",
    });
    const match = CIUDADES_CO.find((c) => c.value === perfil.ciudad);
    if (match) {
      setUbicacionSel(match.value);
      setCiudadManual("");
    } else {
      setUbicacionSel("__otra__");
      setCiudadManual(perfil.ciudad || "");
    }
    setSkillsDraft(perfil.habilidades.map((h) => h.nombre));
    setIsEditing(true);
  }

  function cancelarEdicion() {
    setIsEditing(false);
    setDraft(null);
    setNuevaSkill("");
  }

  async function guardarTodo() {
    if (!draft) return;
    setGuardando(true);
    try {
      const ciudadFinal = ubicacionSel === "__otra__" ? ciudadManual.trim() : ubicacionSel;
      await guardarDatos({
        nombres: draft.nombres,
        apellidos: draft.apellidos,
        tituloProfesional: draft.tituloProfesional,
        correo: draft.correo,
        ciudad: ciudadFinal,
        telefono: draft.telefono,
        fechaNacimiento: draft.fechaNacimiento, // ya está en YYYY-MM-DD
      });
      await guardarSobreMi(draft.about);
      await guardarPreferencias({
        areaInteres: draft.areaInteres,
        salarioEsperado: draft.salarioEsperado,
        tipoContratoPreferido: draft.tipoContratoPreferido,
        jornadaPreferida: draft.jornadaPreferida,
        movilidad: draft.movilidad,
        modalidadPreferida: draft.modalidadPreferida,
        disponibilidad: draft.disponibilidad,
      });
      await guardarHabilidades(skillsDraft);
      mostrarToast("Perfil actualizado correctamente");
      setIsEditing(false);
      setDraft(null);
    } catch (err: any) {
      mostrarToast(err.message || "No se pudo guardar el perfil");
    } finally {
      setGuardando(false);
    }
  }

  function agregarSkillLocal() {
    const val = nuevaSkill.trim();
    if (!val) return;
    if (skillsDraft.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setNuevaSkill("");
      return;
    }
    setSkillsDraft((prev) => [...prev, val]);
    setNuevaSkill("");
  }

  function quitarSkillLocal(nombre: string) {
    setSkillsDraft((prev) => prev.filter((s) => s !== nombre));
  }

  async function onFotoSeleccionada(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const inputEl = e.target;
    try {
      const dataUrl = await comprimirImagen(file);
      await guardarFoto(dataUrl);
      mostrarToast("Foto de perfil actualizada");
    } catch (err: any) {
      console.error("Error al subir foto:", err);
      mostrarToast(err.message || "No se pudo actualizar la foto");
    } finally {
      inputEl.value = "";
    }
  }

  async function eliminarFoto() {
    try {
      await guardarFoto("");
      mostrarToast("Foto de perfil eliminada");
    } catch (err: any) {
      mostrarToast(err.message || "No se pudo eliminar la foto");
    }
  }

  async function onSubmitEducacion(e: React.FormEvent) {
    e.preventDefault();
    if (!eduForm.titulo.trim()) return;
    try {
      await agregarEducacion({ titulo: eduForm.titulo, institucion: eduForm.institucion, anio: eduForm.anio });
      setEduForm({ titulo: "", institucion: "", anio: "" });
      setShowEduForm(false);
      mostrarToast("Educación agregada");
    } catch (err: any) {
      mostrarToast(err.message || "No se pudo agregar la educación");
    }
  }

  async function onSubmitIdioma(e: React.FormEvent) {
    e.preventDefault();
    if (!langForm.nombre.trim()) return;
    try {
      await agregarIdioma(`${langForm.nombre.trim()} - ${langForm.nivel}`);
      setLangForm({ nombre: "", nivel: "B1 (Intermedio)" });
      setShowLangForm(false);
      mostrarToast("Idioma agregado");
    } catch (err: any) {
      mostrarToast(err.message || "No se pudo agregar el idioma");
    }
  }

  async function onSubmitExperiencia(e: React.FormEvent) {
    e.preventDefault();
    if (!expForm.titulo.trim()) return;
    try {
      await agregarExperiencia({ titulo: expForm.titulo, meta: expForm.categoria, descripcion: expForm.anio });
      setExpForm({ titulo: "", categoria: "", anio: "" });
      setShowExpForm(false);
      mostrarToast("Experiencia agregada");
    } catch (err: any) {
      mostrarToast(err.message || "No se pudo agregar la experiencia");
    }
  }

  const nombreCompleto = perfil ? `${perfil.nombres} ${perfil.apellidos}` : "Candidato";

  useEffect(() => {
    if (isEditing && perfil) {
      if (!draft) {
        iniciarEdicion();
      }
    }
  }, [perfil, isEditing]);

  return (
    <CandidatoShell nombre={perfil ? nombreCompleto : undefined} fotoUrl={perfil?.fotoUrl} pageTitle="Perfil" pageSubtitle="Completa tu perfil para aumentar tus posibilidades">
      {loading && <p>Cargando tu perfil...</p>}
      {error && <p style={{ color: "#dc3545" }}>{error}</p>}

      {perfil && (
        <div className="profile-edit-root">
          {/* Tarjeta principal */}
          <div className="profile-card">
            <div className="profile-photo" style={{ overflow: "hidden", position: "relative" }}>
              {perfil.fotoUrl ? (
                <img src={perfil.fotoUrl} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "inherit" }} />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f0f2f5",
                    color: "#6b7280",
                    borderRadius: "inherit",
                  }}
                >
                  <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              {isEditing && (
                <>
                  <label className="camera-btn" htmlFor="photoInput" style={{ cursor: "pointer" }}>
                    <svg viewBox="0 0 20 20">
                      <path d="M3 7.5h2.5L7 5h6l1.5 2.5H17a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7a1 1 0 011-1z" />
                      <circle cx="10" cy="11.5" r="2.8" />
                    </svg>
                  </label>
                  <input type="file" id="photoInput" accept="image/*" style={{ display: "none" }} onChange={onFotoSeleccionada} />
                  {perfil.fotoUrl && (
                    <button
                      type="button"
                      onClick={eliminarFoto}
                      aria-label="Quitar foto de perfil"
                      title="Quitar foto de perfil"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="profile-main">
              <div className="profile-header-row">
                <div className="profile-name">
                  {isEditing ? (
                    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <input value={draft.nombres} onChange={(e) => setDraft({ ...draft, nombres: e.target.value })} placeholder="Nombres" style={inputStyle} />
                      <input value={draft.apellidos} onChange={(e) => setDraft({ ...draft, apellidos: e.target.value })} placeholder="Apellidos" style={inputStyle} />
                    </div>
                  ) : (
                    <h2>{nombreCompleto}</h2>
                  )}

                  {isEditing ? (
                    <input
                      value={draft.tituloProfesional}
                      onChange={(e) => setDraft({ ...draft, tituloProfesional: e.target.value })}
                      placeholder="Título profesional (ej. Desarrolladora Junior)"
                      style={inputStyle}
                    />
                  ) : (
                    <p className="profile-role">{perfil.tituloProfesional || "Sin título profesional"}</p>
                  )}
                </div>

                <div className="profile-edit-actions">
                  {isEditing ? (
                    <>
                      <button className="btn-cancel-edit" type="button" onClick={cancelarEdicion} disabled={guardando}>
                        Cancelar
                      </button>
                      <button className="btn-edit-profile" type="button" onClick={guardarTodo} disabled={guardando}>
                        <span>{guardando ? "Guardando..." : "Guardar cambios"}</span>
                      </button>
                    </>
                  ) : (
                    <button className="btn-edit-profile" type="button" onClick={iniciarEdicion}>
                      <svg viewBox="0 0 20 20"><path d="M13.5 3.5l3 3L7 16H4v-3z" /></svg>
                      <span>Editar Perfil</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="profile-contact">
                <span>
                  <svg viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5" /><path d="M3 5.5l7 5.5 7-5.5" /></svg>
                  {isEditing ? (
                    <input type="email" value={draft.correo} onChange={(e) => setDraft({ ...draft, correo: e.target.value })} style={inputStyle} />
                  ) : (
                    <span>{perfil.correo}</span>
                  )}
                </span>

                <span>
                  <svg viewBox="0 0 20 20"><path d="M10 17s5.5-5 5.5-9A5.5 5.5 0 004.5 8c0 4 5.5 9 5.5 9z" /><circle cx="10" cy="8" r="1.8" /></svg>
                  {isEditing ? (
                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <select value={ubicacionSel} onChange={(e) => setUbicacionSel(e.target.value)} style={inputStyle}>
                        {CIUDADES_CO.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      {ubicacionSel === "__otra__" && (
                        <input
                          value={ciudadManual}
                          onChange={(e) => setCiudadManual(e.target.value)}
                          placeholder="Ciudad, Departamento - Colombia"
                          style={inputStyle}
                        />
                      )}
                    </span>
                  ) : (
                    <span>{perfil.ciudad || "Sin ciudad registrada"}</span>
                  )}
                </span>

                <span>
                  <svg viewBox="0 0 20 20"><path d="M4 3.5h3l1.5 3.5-2 1.5a10 10 0 005 5l1.5-2 3.5 1.5v3a1 1 0 01-1 1A12.5 12.5 0 013 4.5a1 1 0 011-1z" /></svg>
                  {isEditing ? (
                    <input
                      value={draft.telefono}
                      onChange={(e) => setDraft({ ...draft, telefono: formatearTelefonoCO(draft.telefono, e.target.value) })}
                      style={inputStyle}
                    />
                  ) : (
                    <span>{perfil.telefono || "+57 —"}</span>
                  )}
                </span>

                <span>
                  <svg viewBox="0 0 20 20"><rect x="3.5" y="4" width="13" height="12" rx="1.5" /><path d="M3.5 8h13M7 2.5v3M13 2.5v3" /></svg>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draft.fechaNacimiento ? formatearFechaDDMMAAAA(draft.fechaNacimiento) : ""}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 8) val = val.slice(0, 8);
                        if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
                        if (val.length >= 6) val = val.slice(0, 5) + "/" + val.slice(5);
                        setDraft({ ...draft, fechaNacimiento: parsearFechaDDMMAAAA(val) });
                      }}
                      placeholder="DD/MM/AAAA"
                      style={inputStyle}
                    />
                  ) : (
                    <span>{perfil.fechaNacimiento ? formatearFechaDDMMAAAA(perfil.fechaNacimiento) : "Sin fecha de nacimiento"}</span>
                  )}
                </span>
              </div>

              <div className="profile-about">
                <h3>Sobre mí</h3>
                {isEditing ? (
                  <textarea
                    value={draft.about}
                    onChange={(e) => setDraft({ ...draft, about: e.target.value })}
                    rows={4}
                    style={{
                      ...inputStyle,
                      width: "100%",
                      maxWidth: "100%",
                      resize: "vertical",
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      overflow: "auto",
                      boxSizing: "border-box",
                      display: "block",
                    }}
                  />
                ) : (
                  <p style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>{perfil.about || "Aún no has escrito nada sobre ti."}</p>
                )}
              </div>
            </div>
          </div>

          {/* Habilidades / Preferencias */}
          <div className="profile-grid-2">
            <div className="info-card">
              <h3 className="info-card-title">
                <svg viewBox="0 0 20 20"><path d="M10 2.8l2.1 4.4 4.8.6-3.5 3.4.9 4.8L10 13.6l-4.3 2.4.9-4.8-3.5-3.4 4.8-.6z" /></svg>
                Habilidades
              </h3>

              <div className="skills-row">
                {(isEditing ? skillsDraft : perfil.habilidades.map((h) => h.nombre)).map((nombre) => (
                  <span className="skill-pill" key={nombre} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#e9ecef", padding: "4px 10px", borderRadius: "20px", fontSize: "14px" }}>
                    <span>{nombre}</span>
                    {isEditing && (
                      <button
                        type="button"
                        aria-label="Eliminar habilidad"
                        onClick={() => quitarSkillLocal(nombre)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc3545",
                          fontSize: "16px",
                          cursor: "pointer",
                          padding: "0 2px",
                          lineHeight: 1,
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {isEditing && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <input
                    value={nuevaSkill}
                    onChange={(e) => setNuevaSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregarSkillLocal())}
                    placeholder="Nueva habilidad"
                    style={inputStyle}
                  />
                  <button className="add-link" type="button" onClick={agregarSkillLocal}>
                    <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg>
                    Agregar
                  </button>
                </div>
              )}
            </div>

            <div className="info-card">
              <h3 className="info-card-title">
                <svg viewBox="0 0 20 20"><path d="M3 7.5h14v8.5a1 1 0 01-1 1H4a1 1 0 01-1-1z" /><path d="M7 7.5V5.8A1.8 1.8 0 018.8 4h2.4A1.8 1.8 0 0113 5.8v1.7" /></svg>
                Preferencias laborales
              </h3>

              <div className="pref-list">
                <PrefRow label="Áreas de interés" value={perfil.areaInteres} draftValue={draft?.areaInteres} isEditing={isEditing}
                  onChange={(v) => setDraft({ ...draft, areaInteres: v })} placeholder="Ej. Desarrollo de software" />
                <PrefRow label="Salario esperado" value={perfil.salarioEsperado} draftValue={draft?.salarioEsperado} isEditing={isEditing}
                  onChange={(v) => setDraft({ ...draft, salarioEsperado: v })} placeholder="Ej. A convenir" />
                <PrefSelect label="Tipo de contrato" value={draft?.tipoContratoPreferido} display={perfil.tipoContratoPreferido} isEditing={isEditing}
                  onChange={(v) => setDraft({ ...draft, tipoContratoPreferido: v })} options={["Indiferente", "Término fijo", "Término indefinido", "Prestación de servicios", "Aprendizaje/Práctica"]} />
                <PrefSelect label="Jornada" value={draft?.jornadaPreferida} display={perfil.jornadaPreferida} isEditing={isEditing}
                  onChange={(v) => setDraft({ ...draft, jornadaPreferida: v })} options={["Tiempo completo", "Medio tiempo", "Por horas"]} />
                <PrefSelect label="Movilidad" value={draft?.movilidad} display={perfil.movilidad} isEditing={isEditing}
                  onChange={(v) => setDraft({ ...draft, movilidad: v })} options={["Indiferente", "Vehículo propio", "Moto propia", "Transporte público"]} />
                <PrefSelect label="Modalidad preferida" value={draft?.modalidadPreferida} display={perfil.modalidadPreferida} isEditing={isEditing}
                  onChange={(v) => setDraft({ ...draft, modalidadPreferida: v })} options={["Presencial", "Remoto", "Híbrido"]} />
                <PrefSelect label="Disponibilidad" value={draft?.disponibilidad} display={perfil.disponibilidad} isEditing={isEditing}
                  onChange={(v) => setDraft({ ...draft, disponibilidad: v })} options={["Inmediata", "1 semana", "2 semanas", "1 mes"]} />
              </div>
            </div>
          </div>

          {/* Educación */}
          <div className="info-card">
            <h3 className="info-card-title">
              <svg viewBox="0 0 20 20"><path d="M10 3l8 4-8 4-8-4z" /><path d="M5 9v4c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5V9" /></svg>
              Educación
            </h3>

            <div className="timeline">
              {perfil.educacion.map((edu) => (
                <div className="timeline-item" key={edu.idEducacion}>
                  <div className="timeline-icon">
                    <svg viewBox="0 0 20 20"><path d="M10 3l8 4-8 4-8-4z" /><path d="M5 9v4c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5V9" /></svg>
                  </div>
                  <div className="timeline-content">
                    <h4>{edu.titulo}</h4>
                    {edu.institucion && <a href="#">{edu.institucion}</a>}
                    {edu.anio && <div className="year">{edu.anio}</div>}
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await eliminarEducacion(edu.idEducacion);
                          mostrarToast("Educación eliminada");
                        } catch (err: any) {
                          mostrarToast(err.message || "No se pudo eliminar");
                        }
                      }}
                      style={{
                        marginLeft: "auto",
                        background: "none",
                        border: "none",
                        color: "#dc3545",
                        fontSize: 18,
                        cursor: "pointer",
                        padding: "0 4px",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {perfil.educacion.length === 0 && <p>Aún no has agregado tu educación.</p>}
            </div>

            {isEditing && !showEduForm && (
              <button className="add-link" type="button" style={{ marginTop: 16 }} onClick={() => setShowEduForm(true)}>
                <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg>
                Agregar educación
              </button>
            )}
            {isEditing && showEduForm && (
              <form onSubmit={onSubmitEducacion} style={{ display: "grid", gap: 8, marginTop: 16 }}>
                <input required placeholder="Título (ej. Tecnólogo en...)" value={eduForm.titulo} onChange={(e) => setEduForm({ ...eduForm, titulo: e.target.value })} style={inputStyle} />
                <input placeholder="Institución" value={eduForm.institucion} onChange={(e) => setEduForm({ ...eduForm, institucion: e.target.value })} style={inputStyle} />
                <input placeholder="Año" value={eduForm.anio} onChange={(e) => setEduForm({ ...eduForm, anio: e.target.value })} style={inputStyle} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-edit-profile" type="submit"><span>Guardar</span></button>
                  <button className="btn-cancel-edit" type="button" onClick={() => setShowEduForm(false)}>Cancelar</button>
                </div>
              </form>
            )}
          </div>

          {/* Idiomas / Experiencia */}
          <div className="profile-grid-2">
            <div className="info-card">
              <h3 className="info-card-title">
                <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2" /><path d="M2.8 10h14.4M10 2.8c2 2 3 4.5 3 7.2s-1 5.2-3 7.2c-2-2-3-4.5-3-7.2s1-5.2 3-7.2z" /></svg>
                Idiomas
              </h3>

              <div>
                {perfil.idiomas.map((idi) => {
                  const { nivel, porcentaje } = inferirNivelIdioma(idi.descripcion);
                  const nombre = idi.descripcion.split(" - ")[0];
                  return (
                    <div className="lang-row" key={idi.idIdioma}>
                      <div className="lang-row-top">
                        <span>{nombre}</span>
                        <span>{porcentaje}%</span>
                      </div>
                      <div className="lang-bar-bg"><div className="lang-bar-fill" style={{ width: `${porcentaje}%` }} /></div>
                      <div className="lang-level" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{nivel}</span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await eliminarIdioma(idi.idIdioma);
                                mostrarToast("Idioma eliminado");
                              } catch (err: any) {
                                mostrarToast(err.message || "No se pudo eliminar");
                              }
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#dc3545",
                              fontSize: 16,
                              cursor: "pointer",
                              padding: "0 4px",
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {perfil.idiomas.length === 0 && <p>Aún no has agregado idiomas.</p>}
              </div>

              {isEditing && !showLangForm && (
                <button className="add-link" type="button" style={{ marginTop: 18 }} onClick={() => setShowLangForm(true)}>
                  <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg>
                  Agregar idioma
                </button>
              )}
              {isEditing && showLangForm && (
                <form onSubmit={onSubmitIdioma} style={{ display: "grid", gap: 8, marginTop: 18 }}>
                  <input required placeholder="Idioma (ej. Inglés)" value={langForm.nombre} onChange={(e) => setLangForm({ ...langForm, nombre: e.target.value })} style={inputStyle} />
                  <select value={langForm.nivel} onChange={(e) => setLangForm({ ...langForm, nivel: e.target.value })} style={inputStyle}>
                    {NIVELES_IDIOMA.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-edit-profile" type="submit"><span>Guardar</span></button>
                    <button className="btn-cancel-edit" type="button" onClick={() => setShowLangForm(false)}>Cancelar</button>
                  </div>
                </form>
              )}
            </div>

            <div className="info-card">
              <h3 className="info-card-title">
                <svg viewBox="0 0 20 20"><rect x="2.5" y="6" width="15" height="10" rx="1.5" /><path d="M7 6V4.8A1.3 1.3 0 018.3 3.5h3.4a1.3 1.3 0 011.3 1.3V6" /></svg>
                Experiencia / Proyectos
              </h3>

              <div>
                {perfil.experiencia.map((exp) => (
                  <div className="exp-item" key={exp.idProyecto}>
                    <div className="exp-icon"><svg viewBox="0 0 20 20"><path d="M7 6L3 10l4 4M13 6l4 4-4 4" /></svg></div>
                    <div className="exp-content">
                      <h4>{exp.titulo}</h4>
                      {exp.meta && <a href="#">{exp.meta}</a>}
                      {exp.descripcion && <div className="year">{exp.descripcion}</div>}
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await eliminarExperiencia(exp.idProyecto);
                            mostrarToast("Experiencia eliminada");
                          } catch (err: any) {
                            mostrarToast(err.message || "No se pudo eliminar");
                          }
                        }}
                        style={{
                          marginLeft: "auto",
                          background: "none",
                          border: "none",
                          color: "#dc3545",
                          fontSize: 18,
                          cursor: "pointer",
                          padding: "0 4px",
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {perfil.experiencia.length === 0 && <p>Aún no has agregado experiencia o proyectos.</p>}
              </div>

              {isEditing && !showExpForm && (
                <button className="add-link" type="button" style={{ marginTop: 18 }} onClick={() => setShowExpForm(true)}>
                  <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg>
                  Agregar experiencia / proyectos
                </button>
              )}
              {isEditing && showExpForm && (
                <form onSubmit={onSubmitExperiencia} style={{ display: "grid", gap: 8, marginTop: 18 }}>
                  <input required placeholder="Título del proyecto" value={expForm.titulo} onChange={(e) => setExpForm({ ...expForm, titulo: e.target.value })} style={inputStyle} />
                  <input placeholder="Categoría (ej. Proyecto académico)" value={expForm.categoria} onChange={(e) => setExpForm({ ...expForm, categoria: e.target.value })} style={inputStyle} />
                  <input placeholder="Año" value={expForm.anio} onChange={(e) => setExpForm({ ...expForm, anio: e.target.value })} style={inputStyle} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-edit-profile" type="submit"><span>Guardar</span></button>
                    <button className="btn-cancel-edit" type="button" onClick={() => setShowExpForm(false)}>Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="sw-toast">{toast}</div>}
    </CandidatoShell>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid #d8dde3",
  borderRadius: 8,
  padding: "6px 10px",
  font: "inherit",
  color: "inherit",
  background: "#fff",
};

function PrefRow({
  label, value, draftValue, isEditing, onChange, placeholder,
}: { label: string; value?: string | null; draftValue?: string; isEditing: boolean; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="pref-row">
      <span className="k">{label}</span>
      {isEditing ? (
        <input className="v" value={draftValue || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, maxWidth: 180 }} />
      ) : (
        <span className="v">{value || "Sin definir"}</span>
      )}
    </div>
  );
}

function PrefSelect({
  label, value, display, isEditing, onChange, options,
}: { label: string; value?: string; display?: string | null; isEditing: boolean; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="pref-row">
      <span className="k">{label}</span>
      {isEditing ? (
        <select className="v" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, maxWidth: 180 }}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <span className="v">{display || "Sin definir"}</span>
      )}
    </div>
  );
}