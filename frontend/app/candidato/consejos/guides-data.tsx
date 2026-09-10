import type { ReactNode } from "react";

export type GuideKey = "cv" | "interview" | "skills";

interface Guide {
  theme: "theme-blue" | "theme-green" | "theme-purple";
  iconClass: "icon-blue" | "icon-green" | "icon-purple";
  iconSvg: ReactNode;
  title: string;
  subtitle: string;
  checklist: string[];
  ctaLabel: string;
  bodyHtml: string;
}

const checkSvg = '<svg viewBox="0 0 20 20"><path d="M4 10.5l4 4 8-8"/></svg>';
const numberedHeading = (n: number, text: string) =>
  `<h3><span class="guide-section-number">${n}</span>${text}</h3>`;

const CvIcon = (
  <svg viewBox="0 0 20 20">
    <path d="M6 2.5h6l3 3v11a1 1 0 01-1 1H6a1 1 0 01-1-1v-13a1 1 0 011-1z" />
    <path d="M12 2.5V6h3.5" />
    <path d="M7.3 12l1.7 1.7 3.7-3.7" />
  </svg>
);

const InterviewIcon = (
  <svg viewBox="0 0 20 20">
    <path d="M10 16.5c-3-1.8-6.5-4.4-6.5-8A3.5 3.5 0 0110 6.3 3.5 3.5 0 0116.5 8.5c0 3.6-3.5 6.2-6.5 8z" />
    <path d="M8 9.5l1.2 1.2L11 9l1.2 1.2-1.7 1.7" />
  </svg>
);

const SkillsIcon = (
  <svg viewBox="0 0 20 20">
    <path d="M10.5 3.5c2.7 0 4.5 2.2 4.5 5.5 0 2.8-2 5.2-3 6.2l-1.5-1.5-1.5 1.5c-1-1-3-3.4-3-6.2 0-3.3 1.8-5.5 4.5-5.5z" />
    <circle cx="10.5" cy="8.5" r="1.3" />
    <path d="M7 13.5l-1.5 3M14 13.5l1.5 3" />
  </svg>
);

export const GUIDES: Record<GuideKey, Guide> = {
  cv: {
    theme: "theme-blue",
    iconClass: "icon-blue",
    iconSvg: CvIcon,
    title: "Cómo escribir tu CV",
    subtitle: "Guía completa para crear un CV profesional que destaque",
    checklist: [
      "Mantén el CV en 1 o 2 páginas",
      "Menciona tu formación académica y cursos relevantes",
      "Incluye habilidades técnicas y blandas",
      "Usa palabras clave del cargo",
    ],
    ctaLabel: "Ver guía completa",
    bodyHtml:
      `<div class="guide-section">${numberedHeading(1, "Estructura y extensión")}` +
        `<p>Un CV efectivo entra en 1 página si tienes poca experiencia, o máximo 2 si ya tienes varios años en el campo laboral. Los reclutadores suelen revisar cada hoja de vida en menos de 10 segundos en la primera pasada, así que la información más importante debe estar arriba: nombre, cargo al que aspiras, y datos de contacto.</p>` +
        `<ul class="guide-list">` +
          `<li>${checkSvg}Orden recomendado: datos de contacto, resumen profesional, experiencia, educación, habilidades.</li>` +
          `<li>${checkSvg}Usa una tipografía legible y tamaños consistentes (10-12pt para el cuerpo).</li>` +
          `<li>${checkSvg}Deja márgenes y espacio en blanco; un CV saturado es difícil de leer rápido.</li>` +
        `</ul>` +
      `</div>` +
      `<div class="guide-section">${numberedHeading(2, "Qué incluir en cada sección")}` +
        `<p><strong>Resumen profesional:</strong> 2-3 líneas que resuman quién eres, tu formación y qué buscas. Evita frases genéricas como "persona responsable y trabajadora".</p>` +
        `<p><strong>Experiencia:</strong> describe logros, no solo tareas. En vez de "encargado de atención al cliente", escribe "atendí un promedio de 40 clientes diarios, logrando 95% de satisfacción".</p>` +
        `<p><strong>Educación:</strong> incluye título, institución y año. Si eres recién egresado, puedes agregar cursos o proyectos relevantes.</p>` +
      `</div>` +
      `<div class="guide-section">${numberedHeading(3, "Palabras clave y sistemas ATS")}` +
        `<p>Muchas empresas usan sistemas automáticos (ATS) que escanean tu CV antes de que lo vea una persona. Para pasar ese filtro:</p>` +
        `<ul class="guide-list">` +
          `<li>${checkSvg}Repite las palabras clave exactas que aparecen en la oferta de empleo (nombres de herramientas, habilidades, cargo).</li>` +
          `<li>${checkSvg}Evita crear el CV solo con imágenes o tablas complejas; los ATS a veces no las leen bien.</li>` +
          `<li>${checkSvg}Guarda y envía tu CV en PDF, salvo que la oferta pida específicamente Word.</li>` +
        `</ul>` +
      `</div>` +
      `<div class="guide-callout"><strong>Consejo extra:</strong> adapta tu CV a cada vacante. Un CV genérico enviado a 50 empresas funciona peor que uno ajustado y enviado a 10.</div>`,
  },

  interview: {
    theme: "theme-green",
    iconClass: "icon-green",
    iconSvg: InterviewIcon,
    title: "Preparación para entrevista",
    subtitle: "Todo lo que necesitas saber antes de tu próxima entrevista",
    checklist: [
      "Investiga la empresa",
      "Practica preguntas frecuentes",
      "Cuida tu lenguaje corporal",
      "Prepara preguntas para el reclutador",
    ],
    ctaLabel: "Ver guía completa",
    bodyHtml:
      `<div class="guide-section">${numberedHeading(1, "Investiga la empresa")}` +
        `<p>Antes de la entrevista, dedica al menos 20-30 minutos a investigar:</p>` +
        `<ul class="guide-list">` +
          `<li>${checkSvg}A qué se dedica la empresa y quiénes son sus clientes o usuarios.</li>` +
          `<li>${checkSvg}Su misión, valores y noticias recientes (lanzamientos, premios, cambios).</li>` +
          `<li>${checkSvg}El perfil de la persona que te va a entrevistar, si lo sabes (LinkedIn, por ejemplo).</li>` +
        `</ul>` +
      `</div>` +
      `<div class="guide-section">${numberedHeading(2, "Practica preguntas frecuentes (método STAR)")}` +
        `<p>Para preguntas de comportamiento ("Cuéntame de una vez que..."), usa la estructura STAR: Situación, Tarea, Acción, Resultado. Ejemplo de preguntas típicas:</p>` +
        `<ul class="guide-list">` +
          `<li>${checkSvg}"Cuéntame sobre ti" — resume tu formación, experiencia relevante y qué buscas, en menos de 2 minutos.</li>` +
          `<li>${checkSvg}"¿Por qué quieres trabajar aquí?" — conecta tus fortalezas con lo que la empresa necesita.</li>` +
          `<li>${checkSvg}"Cuéntame de un reto que hayas enfrentado" — usa STAR para mostrar cómo resolviste un problema real.</li>` +
          `<li>${checkSvg}"¿Cuáles son tus debilidades?" — menciona una real y qué estás haciendo para mejorarla.</li>` +
        `</ul>` +
      `</div>` +
      `<div class="guide-section">${numberedHeading(3, "Cuida tu lenguaje corporal")}` +
        `<p>La comunicación no verbal influye tanto como lo que dices:</p>` +
        `<ul class="guide-list">` +
          `<li>${checkSvg}Mantén contacto visual (o mira a la cámara si es virtual) sin exagerar.</li>` +
          `<li>${checkSvg}Postura erguida, manos visibles, evita cruzar los brazos.</li>` +
          `<li>${checkSvg}Sonríe de forma natural y modula el tono de voz; evita hablar muy rápido por nervios.</li>` +
        `</ul>` +
      `</div>` +
      `<div class="guide-section">${numberedHeading(4, "Prepara preguntas para el reclutador")}` +
        `<p>Al final casi siempre te preguntan "¿tienes alguna pregunta?". Llegar sin ninguna da la impresión de poco interés. Algunas buenas opciones:</p>` +
        `<ul class="guide-list">` +
          `<li>${checkSvg}"¿Cómo es un día típico en este puesto?"</li>` +
          `<li>${checkSvg}"¿Qué se espera lograr en los primeros 3 meses?"</li>` +
          `<li>${checkSvg}"¿Cómo es el proceso de retroalimentación y crecimiento dentro del equipo?"</li>` +
        `</ul>` +
      `</div>` +
      `<div class="guide-callout"><strong>Consejo extra:</strong> practica en voz alta, no solo mentalmente. Puedes usar el Simulador de entrevista de SeedWork para ensayar con preguntas reales.</div>`,
  },

  skills: {
    theme: "theme-purple",
    iconClass: "icon-purple",
    iconSvg: SkillsIcon,
    title: "Habilidades que importan",
    subtitle: "Las habilidades blandas más buscadas y cómo demostrarlas",
    checklist: [
      "Comunicación",
      "Puntualidad",
      "Liderazgo",
      "Trabajo en equipo",
      "Adaptabilidad",
      "Puntualidad",
      "Responsabilidad",
      "Disposición",
    ],
    ctaLabel: "Ver más habilidades",
    bodyHtml:
      `<div class="guide-section"><p>Las habilidades técnicas te ayudan a conseguir la entrevista, pero las habilidades blandas suelen ser el factor decisivo para conseguir el empleo. Estas son las más valoradas por los reclutadores, agrupadas por área:</p></div>` +
      `<div class="guide-skill-groups">` +
        `<div class="guide-skill-group"><h4>Trabajo con otros</h4><div class="guide-skill-group-tags"><span>Comunicación</span><span>Trabajo en equipo</span><span>Empatía</span><span>Escucha activa</span></div></div>` +
        `<div class="guide-skill-group"><h4>Gestión personal</h4><div class="guide-skill-group-tags"><span>Puntualidad</span><span>Responsabilidad</span><span>Organización</span><span>Manejo del tiempo</span></div></div>` +
        `<div class="guide-skill-group"><h4>Adaptación y crecimiento</h4><div class="guide-skill-group-tags"><span>Adaptabilidad</span><span>Disposición a aprender</span><span>Resiliencia</span><span>Pensamiento crítico</span></div></div>` +
        `<div class="guide-skill-group"><h4>Liderazgo</h4><div class="guide-skill-group-tags"><span>Liderazgo</span><span>Toma de decisiones</span><span>Resolución de conflictos</span></div></div>` +
      `</div>` +
      `<div class="guide-section">${numberedHeading(1, "Cómo demostrarlas (no solo nombrarlas)")}` +
        `<p>Escribir "trabajo en equipo" en tu CV no es suficiente; los reclutadores buscan evidencia. Usa ejemplos concretos:</p>` +
        `<ul class="guide-list">` +
          `<li>${checkSvg}En vez de "soy responsable", di "entregué todos mis proyectos académicos a tiempo durante los últimos 2 años".</li>` +
          `<li>${checkSvg}En una entrevista, cuenta una situación real donde usaste esa habilidad y qué resultado obtuviste.</li>` +
          `<li>${checkSvg}Pide retroalimentación a profesores, compañeros o jefes anteriores sobre tus fortalezas; a veces no somos objetivos con nosotros mismos.</li>` +
        `</ul>` +
      `</div>` +
      `<div class="guide-callout"><strong>Consejo extra:</strong> elige 3-4 habilidades blandas que realmente te representen y prepara un ejemplo breve para cada una, en vez de intentar cubrir todas superficialmente.</div>`,
  },
};