"use client";

<<<<<<< HEAD
import { useState, useRef } from "react";
=======
import { useState } from "react";
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
import type { CV, SeccionActiva } from "./types";

interface EditFormProps {
  cv: CV;
  seccion: SeccionActiva;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
  api: {
    guardarDatosPersonales: (body: any) => Promise<CV>;
    guardarSobreMi: (about: string) => Promise<CV>;
    guardarHabilidades: (habilidades: string[]) => Promise<CV>;
    agregarEducacion: (body: any) => Promise<CV>;
    agregarProyecto: (body: any) => Promise<CV>;
    agregarIdioma: (descripcion: string) => Promise<CV>;
    agregarReferencia: (body: any) => Promise<CV>;
    actualizarSeccion: (idSeccion: number, contenido: string) => Promise<CV>;
<<<<<<< HEAD
    guardarFoto: (fotoUrl: string) => Promise<CV>;
=======
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
  };
}

const TITULOS: Record<SeccionActiva["tipo"], { title: string; subtitle: string }> = {
  datos: { title: "Datos Personales", subtitle: "Edita tu información básica" },
  sobremi: { title: "Sobre mí", subtitle: "Tu presentación profesional" },
  habilidades: { title: "Habilidades", subtitle: "Sepáralas por coma (ej: Python, SQL, Excel)" },
  educacion: { title: "Educación", subtitle: "Agrega un nuevo estudio" },
  proyectos: { title: "Proyectos", subtitle: "Agrega un nuevo proyecto" },
  idiomas: { title: "Idiomas", subtitle: "Agrega un idioma (ej: Inglés - B2)" },
  referencias: { title: "Referencias", subtitle: "Agrega una referencia profesional" },
  custom: { title: "Sección personalizada", subtitle: "Edita el contenido de esta sección" },
};

export default function EditForm({ cv, seccion, onClose, onSaved, onError, api }: EditFormProps) {
  const { title, subtitle } = TITULOS[seccion.tipo];
  const [guardando, setGuardando] = useState(false);
<<<<<<< HEAD
  const fileInputRef = useRef<HTMLInputElement>(null);
=======
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0

  // Estado local de cada campo posible — solo se usa el que aplica según `seccion.tipo`
  const [nombres, setNombres] = useState(cv.nombres);
  const [apellidos, setApellidos] = useState(cv.apellidos);
  const [tituloProfesional, setTituloProfesional] = useState(cv.tituloProfesional || "");
  const [ciudad, setCiudad] = useState(cv.ciudad || "");
  const [correo, setCorreo] = useState(cv.correo);
  const [telefono, setTelefono] = useState(cv.telefono || "");
<<<<<<< HEAD
  const [fotoUrl, setFotoUrl] = useState(cv.fotoUrl || "");
=======
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
  const [about, setAbout] = useState(cv.about || "");
  const [skillsText, setSkillsText] = useState(cv.habilidades.map((h) => h.nombre).join(", "));
  const [eduTitulo, setEduTitulo] = useState("");
  const [eduInstitucion, setEduInstitucion] = useState("");
  const [eduAnio, setEduAnio] = useState("");
  const [projTitulo, setProjTitulo] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projMeta, setProjMeta] = useState("");
  const [langDesc, setLangDesc] = useState("");
  const [refNombre, setRefNombre] = useState("");
  const [refCargo, setRefCargo] = useState("");
  const [refContacto, setRefContacto] = useState("");
  const seccionCustom = seccion.tipo === "custom" ? cv.secciones.find((s) => s.idSeccion === seccion.idSeccion) : null;
  const [customContenido, setCustomContenido] = useState(seccionCustom?.contenido || "");

<<<<<<< HEAD
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setFotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

=======
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
  async function guardar() {
    setGuardando(true);
    try {
      if (seccion.tipo === "datos") {
<<<<<<< HEAD
        // Primero guardar los datos personales
        await api.guardarDatosPersonales({ 
          nombres, 
          apellidos, 
          tituloProfesional, 
          ciudad, 
          correo, 
          telefono 
        });
        
        // Si hay una foto nueva, guardarla
        if (fotoUrl && fotoUrl !== cv.fotoUrl) {
          await api.guardarFoto(fotoUrl);
        }
=======
        await api.guardarDatosPersonales({ nombres, apellidos, tituloProfesional, ciudad, correo, telefono });
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
      } else if (seccion.tipo === "sobremi") {
        await api.guardarSobreMi(about);
      } else if (seccion.tipo === "habilidades") {
        const lista = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
        await api.guardarHabilidades(lista);
      } else if (seccion.tipo === "educacion") {
        if (!eduTitulo.trim()) throw new Error("El título / grado es obligatorio");
        await api.agregarEducacion({ titulo: eduTitulo.trim(), institucion: eduInstitucion.trim(), anio: eduAnio.trim() });
      } else if (seccion.tipo === "proyectos") {
        if (!projTitulo.trim()) throw new Error("El nombre del proyecto es obligatorio");
        await api.agregarProyecto({ titulo: projTitulo.trim(), descripcion: projDesc.trim(), meta: projMeta.trim() });
      } else if (seccion.tipo === "idiomas") {
        if (!langDesc.trim()) throw new Error("Escribe el idioma y nivel");
        await api.agregarIdioma(langDesc.trim());
      } else if (seccion.tipo === "referencias") {
        if (!refNombre.trim()) throw new Error("El nombre es obligatorio");
        await api.agregarReferencia({ nombre: refNombre.trim(), cargo: refCargo.trim(), contacto: refContacto.trim() });
      } else if (seccion.tipo === "custom") {
        await api.actualizarSeccion(seccion.idSeccion, customContenido);
      }
      onSaved("Cambios guardados correctamente");
      onClose();
    } catch (err: any) {
      onError(err.message || "No se pudo guardar el cambio");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="cv-edit-form visible">
      <h3 className="cv-edit-form-title">{title}</h3>
      <p className="cv-edit-form-subtitle">{subtitle}</p>

      <div className="cv-edit-form-fields">
        {seccion.tipo === "datos" && (
          <>
<<<<<<< HEAD
            <div className="cv-edit-field cv-edit-field-photo">
              <span>Foto de perfil</span>
              <div className="cv-photo-upload">
                <div className="cv-photo-preview">
                  {fotoUrl ? (
                    <img src={fotoUrl} alt="Foto de perfil" />
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="8.5" r="3.6" />
                      <path d="M4.5 20c0-4.2 3.4-7 7.5-7s7.5 2.8 7.5 7" />
                    </svg>
                  )}
                </div>
                <button 
                  type="button" 
                  className="cv-btn-outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg viewBox="0 0 20 20" width="16" height="16">
                    <path d="M3 7.5h2.5L7 5h6l1.5 2.5H17a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7a1 1 0 011-1z" />
                    <circle cx="10" cy="11.5" r="2.8" />
                  </svg>
                  {fotoUrl ? "Cambiar foto" : "Subir foto"}
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  style={{ display: "none" }} 
                  onChange={handleFotoChange} 
                />
              </div>
            </div>

            <label className="cv-edit-field">
              <span>Nombre completo</span>
              <input 
                value={`${nombres} ${apellidos}`.trim()} 
                onChange={(e) => { 
                  const partes = e.target.value.split(" "); 
                  setNombres(partes.slice(0, Math.ceil(partes.length / 2)).join(" ")); 
                  setApellidos(partes.slice(Math.ceil(partes.length / 2)).join(" ")); 
                }} 
              />
            </label>
            <label className="cv-edit-field">
              <span>Título profesional</span>
              <input value={tituloProfesional} onChange={(e) => setTituloProfesional(e.target.value)} />
            </label>
            <label className="cv-edit-field">
              <span>Ciudad</span>
              <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
            </label>
            <label className="cv-edit-field">
              <span>Correo electrónico</span>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
            </label>
            <label className="cv-edit-field">
              <span>Teléfono</span>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </label>
=======
            <label className="cv-edit-field"><span>Nombre completo</span><input value={`${nombres} ${apellidos}`.trim()} onChange={(e) => { const partes = e.target.value.split(" "); setNombres(partes.slice(0, Math.ceil(partes.length / 2)).join(" ")); setApellidos(partes.slice(Math.ceil(partes.length / 2)).join(" ")); }} /></label>
            <label className="cv-edit-field"><span>Título profesional</span><input value={tituloProfesional} onChange={(e) => setTituloProfesional(e.target.value)} /></label>
            <label className="cv-edit-field"><span>Ciudad</span><input value={ciudad} onChange={(e) => setCiudad(e.target.value)} /></label>
            <label className="cv-edit-field"><span>Correo electrónico</span><input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} /></label>
            <label className="cv-edit-field"><span>Teléfono</span><input value={telefono} onChange={(e) => setTelefono(e.target.value)} /></label>
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
          </>
        )}

        {seccion.tipo === "sobremi" && (
<<<<<<< HEAD
          <label className="cv-edit-field">
            <span>Descripción personal</span>
            <textarea rows={4} value={about} onChange={(e) => setAbout(e.target.value)} />
          </label>
        )}

        {seccion.tipo === "habilidades" && (
          <label className="cv-edit-field">
            <span>Habilidades</span>
            <input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
          </label>
=======
          <label className="cv-edit-field"><span>Descripción personal</span><textarea rows={4} value={about} onChange={(e) => setAbout(e.target.value)} /></label>
        )}

        {seccion.tipo === "habilidades" && (
          <label className="cv-edit-field"><span>Habilidades</span><input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} /></label>
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
        )}

        {seccion.tipo === "educacion" && (
          <>
<<<<<<< HEAD
            <label className="cv-edit-field">
              <span>Título / Grado</span>
              <input value={eduTitulo} onChange={(e) => setEduTitulo(e.target.value)} />
            </label>
            <label className="cv-edit-field">
              <span>Institución</span>
              <input value={eduInstitucion} onChange={(e) => setEduInstitucion(e.target.value)} />
            </label>
            <label className="cv-edit-field">
              <span>Año de graduación</span>
              <input value={eduAnio} onChange={(e) => setEduAnio(e.target.value)} />
            </label>
=======
            <label className="cv-edit-field"><span>Título / Grado</span><input value={eduTitulo} onChange={(e) => setEduTitulo(e.target.value)} /></label>
            <label className="cv-edit-field"><span>Institución</span><input value={eduInstitucion} onChange={(e) => setEduInstitucion(e.target.value)} /></label>
            <label className="cv-edit-field"><span>Año de graduación</span><input value={eduAnio} onChange={(e) => setEduAnio(e.target.value)} /></label>
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
          </>
        )}

        {seccion.tipo === "proyectos" && (
          <>
<<<<<<< HEAD
            <label className="cv-edit-field">
              <span>Nombre del proyecto</span>
              <input value={projTitulo} onChange={(e) => setProjTitulo(e.target.value)} />
            </label>
            <label className="cv-edit-field">
              <span>Descripción</span>
              <textarea rows={3} value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
            </label>
            <label className="cv-edit-field">
              <span>Tecnología / Año</span>
              <input value={projMeta} onChange={(e) => setProjMeta(e.target.value)} />
            </label>
=======
            <label className="cv-edit-field"><span>Nombre del proyecto</span><input value={projTitulo} onChange={(e) => setProjTitulo(e.target.value)} /></label>
            <label className="cv-edit-field"><span>Descripción</span><textarea rows={3} value={projDesc} onChange={(e) => setProjDesc(e.target.value)} /></label>
            <label className="cv-edit-field"><span>Tecnología / Año</span><input value={projMeta} onChange={(e) => setProjMeta(e.target.value)} /></label>
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
          </>
        )}

        {seccion.tipo === "idiomas" && (
<<<<<<< HEAD
          <label className="cv-edit-field">
            <span>Idioma y nivel</span>
            <input value={langDesc} onChange={(e) => setLangDesc(e.target.value)} />
          </label>
=======
          <label className="cv-edit-field"><span>Idioma y nivel</span><input value={langDesc} onChange={(e) => setLangDesc(e.target.value)} /></label>
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
        )}

        {seccion.tipo === "referencias" && (
          <>
<<<<<<< HEAD
            <label className="cv-edit-field">
              <span>Nombre</span>
              <input value={refNombre} onChange={(e) => setRefNombre(e.target.value)} />
            </label>
            <label className="cv-edit-field">
              <span>Cargo / Empresa</span>
              <input value={refCargo} onChange={(e) => setRefCargo(e.target.value)} />
            </label>
            <label className="cv-edit-field">
              <span>Contacto</span>
              <input value={refContacto} onChange={(e) => setRefContacto(e.target.value)} />
            </label>
=======
            <label className="cv-edit-field"><span>Nombre</span><input value={refNombre} onChange={(e) => setRefNombre(e.target.value)} /></label>
            <label className="cv-edit-field"><span>Cargo / Empresa</span><input value={refCargo} onChange={(e) => setRefCargo(e.target.value)} /></label>
            <label className="cv-edit-field"><span>Contacto</span><input value={refContacto} onChange={(e) => setRefContacto(e.target.value)} /></label>
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
          </>
        )}

        {seccion.tipo === "custom" && (
<<<<<<< HEAD
          <label className="cv-edit-field">
            <span>Contenido</span>
            <textarea rows={4} value={customContenido} onChange={(e) => setCustomContenido(e.target.value)} />
          </label>
=======
          <label className="cv-edit-field"><span>Contenido</span><textarea rows={4} value={customContenido} onChange={(e) => setCustomContenido(e.target.value)} /></label>
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
        )}
      </div>

      <div className="cv-edit-form-actions">
        <button className="cv-btn-solid" type="button" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
        <button className="cv-btn-outline" type="button" onClick={onClose} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </div>
  );
}