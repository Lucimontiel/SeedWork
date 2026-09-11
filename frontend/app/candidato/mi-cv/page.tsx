"use client";

import { useRef, useState } from "react";
import CandidatoShell from "../CandidatoShell";
import { useCandidato } from "../../lib/useCandidato";
import { useCV } from "./useCV";
import EditForm from "./EditForm";
import { calcularCompletitud, type SeccionActiva } from "./types";

const NAV_SECCIONES: { tipo: SeccionActiva["tipo"]; label: string }[] = [
  { tipo: "datos", label: "Datos Personales" },
  { tipo: "sobremi", label: "Sobre mi" },
  { tipo: "educacion", label: "Educación" },
  { tipo: "habilidades", label: "Habilidades" },
  { tipo: "proyectos", label: "Proyectos" },
  { tipo: "idiomas", label: "Idiomas" },
  { tipo: "referencias", label: "Referencias" },
];

const TEMPLATES: { id: string; label: string }[] = [
  { id: "clasico", label: "Clásico" },
  { id: "moderno", label: "Moderno" },
  { id: "elegante", label: "Elegante" },
];

<<<<<<< HEAD
// Componente para el modal de agregar sección
function AgregarSeccionModal({ 
  isOpen, 
  onClose, 
  onAgregar, 
  nombre, 
  setNombre,
  guardando 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAgregar: () => void; 
  nombre: string; 
  setNombre: (value: string) => void;
  guardando: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="cv-modal-overlay" onClick={onClose}>
      <div className="cv-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="cv-modal-title">Agregar sección personalizada</h3>
        <p className="cv-modal-subtitle">Crea una nueva sección para tu CV</p>
        
        <div className="cv-modal-fields">
          <label className="cv-edit-field">
            <span>Nombre de la sección</span>
            <input 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              placeholder="Ej: Certificaciones, Voluntariado, etc."
              autoFocus
            />
          </label>
        </div>

        <div className="cv-modal-actions">
          <button 
            className="cv-btn-solid" 
            type="button" 
            onClick={onAgregar} 
            disabled={guardando}
          >
            {guardando ? "Agregando..." : "Agregar sección"}
          </button>
          <button 
            className="cv-btn-outline" 
            type="button" 
            onClick={onClose} 
            disabled={guardando}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

=======
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
export default function MiCVPage() {
  const { candidato } = useCandidato();
  const idCandidato = candidato?.idCandidato ?? null;
  const cvApi = useCV(idCandidato);
  const { cv, loading, error } = cvApi;

  const [seccionActiva, setSeccionActiva] = useState<SeccionActiva | null>(null);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
<<<<<<< HEAD
  const [mostrarFormSeccion, setMostrarFormSeccion] = useState(false);
  const [nombreSeccion, setNombreSeccion] = useState("");
  const [guardandoSeccion, setGuardandoSeccion] = useState(false);
=======
  const fileInputRef = useRef<HTMLInputElement>(null);
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function abrirSeccion(tipo: SeccionActiva["tipo"]) {
    setSeccionActiva({ tipo } as SeccionActiva);
  }

  async function agregarSeccionPersonalizada() {
<<<<<<< HEAD
    if (!nombreSeccion.trim()) {
      mostrarToast("Escribe un nombre para la sección");
      return;
    }
    setGuardandoSeccion(true);
    try {
      const nuevo = await cvApi.agregarSeccion({ 
        titulo: nombreSeccion.trim(), 
        contenido: "Escribe aquí el contenido de esta sección..." 
      });
      const seccionCreada = nuevo.secciones[nuevo.secciones.length - 1];
      setSeccionActiva({ tipo: "custom", idSeccion: seccionCreada.idSeccion });
      setMostrarFormSeccion(false);
      setNombreSeccion("");
      mostrarToast("Sección agregada correctamente");
    } catch (err: any) {
      mostrarToast(err.message || "No se pudo crear la sección");
    } finally {
      setGuardandoSeccion(false);
=======
    const nombre = window.prompt("Nombre de la nueva sección:");
    if (!nombre || !nombre.trim()) return;
    try {
      const nuevo = await cvApi.agregarSeccion({ titulo: nombre.trim(), contenido: "Escribe aquí el contenido de esta sección..." });
      const seccionCreada = nuevo.secciones[nuevo.secciones.length - 1];
      setSeccionActiva({ tipo: "custom", idSeccion: seccionCreada.idSeccion });
    } catch (err: any) {
      mostrarToast(err.message || "No se pudo crear la sección");
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
    }
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await cvApi.guardarFoto(reader.result as string);
        mostrarToast("Foto actualizada");
      } catch (err: any) {
        mostrarToast(err.message || "No se pudo actualizar la foto");
      }
    };
    reader.readAsDataURL(file);
  }

  async function cambiarPlantilla(id: string) {
    try {
      await cvApi.guardarPlantilla(id);
    } catch (err: any) {
      mostrarToast(err.message || "No se pudo cambiar la plantilla");
    }
  }

  function descargarCV() {
    mostrarToast("Abriendo el diálogo de impresión para guardar tu CV en PDF...");
    setTimeout(() => window.print(), 400);
  }

  if (loading || !cv) {
    return (
      <CandidatoShell nombre={candidato ? `${candidato.nombres} ${candidato.apellidos}` : undefined} pageTitle="Mi CV" pageSubtitle="Crea y personaliza tu hoja de vida profesional">
        <p>{error || "Cargando tu CV..."}</p>
      </CandidatoShell>
    );
  }

  const { pct, mensaje } = calcularCompletitud(cv);
  const iniciales = `${cv.nombres} ${cv.apellidos}`.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  return (
    <CandidatoShell nombre={`${cv.nombres} ${cv.apellidos}`} pageTitle="Mi CV" pageSubtitle="Crea y personaliza tu hoja de vida profesional">
      <div className="cv-layout">
        <aside className="cv-sections-panel">
          <nav className="cv-sections-list">
            {NAV_SECCIONES.map((s) => (
              <button
                key={s.tipo}
                type="button"
                className={"cv-section-item" + (seccionActiva?.tipo === s.tipo ? " active" : "")}
                onClick={() => abrirSeccion(s.tipo)}
              >
                {s.label}
              </button>
            ))}
            {cv.secciones.map((s) => (
              <button
                key={s.idSeccion}
                type="button"
                className={"cv-section-item" + (seccionActiva?.tipo === "custom" && seccionActiva.idSeccion === s.idSeccion ? " active" : "")}
                onClick={() => setSeccionActiva({ tipo: "custom", idSeccion: s.idSeccion })}
              >
                {s.titulo}
              </button>
            ))}
          </nav>

<<<<<<< HEAD
          <button className="cv-add-section" type="button" onClick={() => setMostrarFormSeccion(true)}>
=======
          <button className="cv-add-section" type="button" onClick={agregarSeccionPersonalizada}>
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
            <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" /></svg>Agregar sección
          </button>

          <div className="cv-template-switcher">
            <p className="cv-template-title">Plantilla</p>
            <div className="cv-template-options">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={"cv-template-option" + (cv.plantilla === t.id ? " active" : "")}
                  onClick={() => cambiarPlantilla(t.id)}
                  aria-label={`Plantilla ${t.label}`}
                >
                  <span className={`cv-template-thumb cv-template-thumb-${t.id}`}>
                    <span className="thumb-lines"><span></span><span></span><span></span></span>
                  </span>
                  <span className="cv-template-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="cv-tip-card">
            <div className="cv-tip-title">
              <svg viewBox="0 0 20 20"><path d="M10 2.5a5 5 0 00-3 9c.5.4.8 1 .8 1.6v1h4.4v-1c0-.6.3-1.2.8-1.6a5 5 0 00-3-9z" /><path d="M8.3 17h3.4" /></svg>Consejo
            </div>
            <p>{mensaje}</p>
            <div className="cv-tip-bar-bg"><div className="cv-tip-bar-fill" style={{ width: `${pct}%` }} /></div>
            <span className="cv-tip-percent">{pct}% completado</span>
          </div>
        </aside>

        <div className="cv-main">
          <div className="cv-actions-row">
            <button className="cv-btn-outline" type="button" onClick={() => setPreviewVisible((v) => !v)}>
              {previewVisible ? (
                <><svg viewBox="0 0 20 20"><path d="M2 10s3-5.5 8-5.5 8 5.5 8 5.5-3 5.5-8 5.5-8-5.5-8-5.5z" /><circle cx="10" cy="10" r="2" /></svg>Vista previa</>
              ) : (
                <><svg viewBox="0 0 20 20"><path d="M3 3l14 14M9.4 9.6a2.3 2.3 0 003.2 3.2M6.3 6.4C4.1 7.9 2.5 10 2.5 10s3 5.5 8 5.5c1.3 0 2.5-.3 3.6-.9M12.2 5.2c-.7-.2-1.4-.3-2.2-.3-5 0-8 5.5-8 5.5" /></svg>Mostrar CV</>
              )}
            </button>
            <button className="cv-btn-solid" type="button" onClick={descargarCV}>
              <svg viewBox="0 0 20 20"><path d="M10 3v10M6.5 9.5L10 13l3.5-3.5" /><path d="M4 15.5h12v1.5H4z" /></svg>Descargar CV
            </button>
          </div>

          {seccionActiva && (
            <EditForm
              cv={cv}
              seccion={seccionActiva}
              onClose={() => setSeccionActiva(null)}
              onSaved={mostrarToast}
              onError={mostrarToast}
              api={cvApi}
            />
          )}

          {previewVisible && (
            <div className="cv-preview" data-template={cv.plantilla !== "clasico" ? cv.plantilla : undefined}>
              <div className="cv-preview-sidebar">
                <div className="cv-preview-photo">
                  {cv.fotoUrl ? (
                    <img src={cv.fotoUrl} alt="Foto de perfil" style={{ display: "block" }} />
                  ) : (
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6" /><path d="M4.5 20c0-4.2 3.4-7 7.5-7s7.5 2.8 7.5 7" /></svg>
                  )}
<<<<<<< HEAD
=======
                  <button className="cv-camera-btn" type="button" aria-label="Cambiar foto" onClick={() => fileInputRef.current?.click()}>
                    <svg viewBox="0 0 20 20"><path d="M3 7.5h2.5L7 5h6l1.5 2.5H17a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7a1 1 0 011-1z" /><circle cx="10" cy="11.5" r="2.8" /></svg>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFotoChange} />
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
                </div>

                <h3 className="cv-preview-name">{cv.nombres} {cv.apellidos}</h3>
                <p className="cv-preview-role">{cv.tituloProfesional || "Sin título profesional"}</p>
                {cv.ciudad && (
                  <span className="cv-preview-location">
                    <svg viewBox="0 0 20 20"><path d="M10 17s5.5-5 5.5-9A5.5 5.5 0 004.5 8c0 4 5.5 9 5.5 9z" /><circle cx="10" cy="8" r="1.8" /></svg>
                    <span>{cv.ciudad}</span>
                  </span>
                )}

                <div className="cv-preview-block">
                  <h4>Contacto</h4>
                  <span><svg viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5" /><path d="M3 5.5l7 5.5 7-5.5" /></svg><span>{cv.correo}</span></span>
                  {cv.telefono && (
                    <span><svg viewBox="0 0 20 20"><path d="M4 3.5h3l1.5 3.5-2 1.5a10 10 0 005 5l1.5-2 3.5 1.5v3a1 1 0 01-1 1A12.5 12.5 0 013 4.5a1 1 0 011-1z" /></svg><span>{cv.telefono}</span></span>
                  )}
                </div>

                <div className="cv-preview-block">
                  <h4>Habilidades</h4>
                  <div className="cv-preview-skills">
                    {cv.habilidades.length === 0 && <span className="cv-empty-note">Aún no has agregado habilidades.</span>}
                    {cv.habilidades.map((h) => <span key={h.idHabilidad}>{h.nombre}</span>)}
                  </div>
                </div>
              </div>

              <div className="cv-preview-content">
                <div className="cv-preview-section">
                  <h4><svg viewBox="0 0 20 20"><circle cx="10" cy="6.5" r="3" /><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" /></svg>Sobre mí</h4>
                  <p>{cv.about || "Aún no has escrito tu presentación."}</p>
                </div>

                <div className="cv-preview-section">
                  <h4><svg viewBox="0 0 20 20"><path d="M10 3l8 4-8 4-8-4z" /><path d="M5 9v4c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5V9" /></svg>Educación</h4>
                  {cv.educacion.length === 0 && <p className="cv-empty-note">Aún no has agregado estudios.</p>}
                  {cv.educacion.map((e) => (
                    <div className="cv-preview-item-row" key={e.idEducacion}>
                      <strong>{e.titulo}</strong>
                      <a href="#" onClick={(ev) => ev.preventDefault()}>{e.institucion}</a>
                      <span className="cv-preview-year">{e.anio}</span>
                    </div>
                  ))}
                </div>

                <div className="cv-preview-section">
                  <h4><svg viewBox="0 0 20 20"><rect x="2.5" y="6" width="15" height="10" rx="1.5" /><path d="M7 6V4.8A1.3 1.3 0 018.3 3.5h3.4a1.3 1.3 0 011.3 1.3V6" /></svg>Proyectos</h4>
                  {cv.proyectos.length === 0 && <p className="cv-empty-note">Aún no has agregado proyectos.</p>}
                  {cv.proyectos.map((p) => (
                    <div className="cv-preview-item-row" key={p.idProyecto}>
                      <strong>{p.titulo}</strong>
                      <p>{p.descripcion}</p>
                      <span className="cv-preview-year">{p.meta}</span>
                    </div>
                  ))}
                </div>

                <div className="cv-preview-section">
                  <h4><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2" /><path d="M2.8 10h14.4M10 2.8c2 2 3 4.5 3 7.2s-1 5.2-3 7.2c-2-2-3-4.5-3-7.2s1-5.2 3-7.2z" /></svg>Idiomas</h4>
                  {cv.idiomas.length === 0 && <p className="cv-empty-note">Aún no has agregado idiomas.</p>}
                  {cv.idiomas.map((i) => <p className="cv-preview-lang" key={i.idIdioma}>{i.descripcion}</p>)}
                </div>

                <div className="cv-preview-section">
                  <h4><svg viewBox="0 0 20 20"><circle cx="10" cy="7" r="3" /><path d="M4.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /></svg>Referencias</h4>
                  {cv.referencias.length === 0 && <p className="cv-empty-note">Aún no has agregado referencias.</p>}
                  {cv.referencias.map((r) => (
                    <div className="cv-preview-item-row" key={r.idReferencia}>
                      <strong>{r.nombre}</strong>
                      <a href="#" onClick={(ev) => ev.preventDefault()}>{r.cargo}</a>
                      <span className="cv-preview-year">{r.contacto}</span>
                    </div>
                  ))}
                </div>

                {cv.secciones.map((s) => (
                  <div className="cv-preview-section" key={s.idSeccion}>
                    <h4><svg viewBox="0 0 20 20"><path d="M4 4h12v12H4z" /></svg>{s.titulo}</h4>
                    <p>{s.contenido}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

<<<<<<< HEAD
      {/* Modal para agregar sección */}
      <AgregarSeccionModal
        isOpen={mostrarFormSeccion}
        onClose={() => {
          setMostrarFormSeccion(false);
          setNombreSeccion("");
        }}
        onAgregar={agregarSeccionPersonalizada}
        nombre={nombreSeccion}
        setNombre={setNombreSeccion}
        guardando={guardandoSeccion}
      />

=======
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
      {toast && <div className="sw-toast show">{toast}</div>}
    </CandidatoShell>
  );
}