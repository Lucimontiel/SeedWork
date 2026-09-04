export interface Habilidad { idHabilidad: number; nombre: string; }
export interface Educacion { idEducacion: number; titulo: string; institucion?: string | null; anio?: string | null; }
export interface Proyecto { idProyecto: number; titulo: string; descripcion?: string | null; meta?: string | null; }
export interface Idioma { idIdioma: number; descripcion: string; }
export interface Referencia { idReferencia: number; nombre: string; cargo?: string | null; contacto?: string | null; }
export interface SeccionCV { idSeccion: number; titulo: string; contenido?: string | null; }

export interface CV {
  idCandidato: number;
  nombres: string;
  apellidos: string;
  tituloProfesional?: string | null;
  ciudad?: string | null;
  correo: string;
  telefono?: string | null;
  about?: string | null;
  fotoUrl?: string | null;
  plantilla: string;
  habilidades: Habilidad[];
  educacion: Educacion[];
  proyectos: Proyecto[];
  idiomas: Idioma[];
  referencias: Referencia[];
  secciones: SeccionCV[];
}

export type SeccionActiva =
  | { tipo: "datos" }
  | { tipo: "sobremi" }
  | { tipo: "habilidades" }
  | { tipo: "educacion" }
  | { tipo: "proyectos" }
  | { tipo: "idiomas" }
  | { tipo: "referencias" }
  | { tipo: "custom"; idSeccion: number };

export function calcularCompletitud(cv: CV) {
  const checks = [
    !!cv.fotoUrl,
    !!(cv.about && cv.about.trim().length > 40),
    cv.habilidades.length >= 3,
    cv.educacion.length >= 1,
    cv.proyectos.length >= 1,
    cv.idiomas.length >= 1,
    cv.referencias.length >= 1,
  ];
  const done = checks.filter(Boolean).length;
  const pct = Math.round((done / checks.length) * 100);
  let mensaje = "Un CV completo aumenta tus posibilidades de ser contratado.";
  if (pct >= 100) mensaje = "¡Tu CV está completo! Sigue así para destacar ante los reclutadores.";
  else if (!checks[6]) mensaje = "Agregar al menos una referencia puede darle más solidez a tu CV.";
  return { pct, mensaje };
}