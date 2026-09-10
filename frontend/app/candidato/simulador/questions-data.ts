export interface Pregunta {
  text: string;
  tip: string;
}

export const GENERAL_QUESTIONS: Pregunta[] = [
  { text: "Cuéntanos un poco sobre ti.", tip: "Resume tu formación, tu experiencia y qué te motiva a postularte, en menos de 2 minutos." },
  { text: "¿Por qué te interesa este cargo?", tip: "Conecta tus fortalezas y motivaciones con lo que la vacante realmente necesita." },
  { text: "Cuéntame sobre un reto que hayas enfrentado y cómo lo resolviste.", tip: "Usa el método STAR: Situación, Tarea, Acción y Resultado." },
  { text: "¿Cuáles consideras que son tus principales fortalezas y áreas de mejora?", tip: "Sé honesto y menciona cómo estás trabajando en tus áreas de mejora." },
  { text: "¿Dónde te ves en los próximos años?", tip: "Muestra ambición realista y alineada con el crecimiento que ofrece la empresa." },
];

export const ROLE_QUESTIONS: Record<string, Pregunta[]> = {
  "Desarrollador de software": [
    { text: "Cuéntanos sobre un proyecto de programación del que te sientas orgulloso.", tip: "Menciona el problema, las tecnologías usadas y el impacto del resultado." },
    { text: "¿Cómo abordas la depuración de un error difícil de encontrar?", tip: "Describe tu proceso: reproducir el error, aislar el código, revisar logs y probar hipótesis." },
    { text: "¿Qué buenas prácticas sigues al escribir código?", tip: "Habla de código limpio, control de versiones, pruebas y documentación." },
    { text: "Explica un concepto técnico como si se lo explicaras a alguien sin conocimientos de programación.", tip: "Evita la jerga técnica y usa analogías sencillas." },
    { text: "¿Cómo trabajas en equipo usando control de versiones como Git?", tip: "Menciona ramas, pull requests y revisión de código entre compañeros." },
  ],
  "Diseño UX/UI": [
    { text: "Describe tu proceso de diseño desde la investigación hasta el prototipo final.", tip: "Menciona investigación de usuarios, wireframes, prototipos y pruebas de usabilidad." },
    { text: "Cuéntanos sobre un proyecto donde tuviste que equilibrar la experiencia del usuario con las necesidades del negocio.", tip: "Explica cómo tomaste decisiones basadas en datos y no solo en estética." },
    { text: "¿Cómo recopilas y aplicas el feedback de los usuarios?", tip: "Habla de entrevistas, encuestas, pruebas A/B y cómo iteras el diseño." },
    { text: "¿Qué herramientas de diseño dominas y por qué las prefieres?", tip: "Menciona Figma, Adobe XD u otras, y justifica tu elección." },
    { text: "Describe una vez en que tu diseño no funcionó como esperabas. ¿Qué aprendiste?", tip: "Muestra capacidad de autocrítica y aprendizaje continuo." },
  ],
  "Marketing": [
    { text: "Cuéntanos sobre una campaña de marketing exitosa en la que hayas participado.", tip: "Menciona el objetivo, la estrategia y los resultados medibles (KPIs)." },
    { text: "¿Cómo defines y segmentas tu público objetivo?", tip: "Habla de buyer personas, datos demográficos y comportamiento del consumidor." },
    { text: "¿Qué métricas consideras más importantes para medir el éxito de una campaña?", tip: "Menciona alcance, conversión, ROI o CTR, entre otras." },
    { text: "¿Cómo te mantienes actualizado con las tendencias del marketing digital?", tip: "Menciona fuentes, cursos o comunidades que sigues." },
    { text: "Cuéntanos de una vez que una campaña no funcionó. ¿Qué hiciste al respecto?", tip: "Muestra capacidad de análisis y ajuste de estrategia." },
  ],
  "Ventas": [
    { text: "Cuéntanos sobre la venta más difícil que hayas cerrado.", tip: "Explica el obstáculo, tu estrategia y el resultado final." },
    { text: "¿Cómo manejas la objeción de un cliente indeciso?", tip: "Habla de escucha activa, empatía y argumentos basados en beneficios." },
    { text: "¿Cómo organizas tu día para cumplir tus metas de ventas?", tip: "Menciona priorización, seguimiento de leads y uso de un CRM." },
    { text: "Describe cómo construyes relaciones de confianza con tus clientes.", tip: "Resalta el seguimiento post-venta y la comunicación honesta." },
    { text: "¿Qué haces cuando no estás cumpliendo tu cuota de ventas?", tip: "Muestra proactividad: analizar causas y ajustar tu estrategia." },
  ],
  "Atención al cliente": [
    { text: "Cuéntanos sobre una vez que manejaste a un cliente muy molesto.", tip: "Resalta empatía, calma y cómo resolviste el problema." },
    { text: "¿Cómo priorizas cuando tienes varias solicitudes de clientes al mismo tiempo?", tip: "Habla de gestión del tiempo y criterios de urgencia." },
    { text: "¿Qué haces cuando no sabes la respuesta a la pregunta de un cliente?", tip: "Menciona honestidad, buscar ayuda y dar seguimiento." },
    { text: "¿Cómo mides si brindaste un buen servicio?", tip: "Habla de satisfacción del cliente, tiempos de respuesta y resolución en el primer contacto." },
    { text: "Describe una mejora que hayas propuesto para el proceso de atención al cliente.", tip: "Muestra iniciativa y pensamiento orientado a la mejora continua." },
  ],
};

// Heurística local — NO es una llamada real a un modelo de IA, igual que decía el disclaimer del HTML original.
export function generarFeedback(respuesta: string, pregunta: Pregunta): string {
  const palabras = respuesta.trim().split(/\s+/).filter(Boolean);
  const cantidad = palabras.length;
  const partes: string[] = [];

  if (cantidad < 20) {
    partes.push("Tu respuesta es bastante breve. Intenta desarrollarla más con un ejemplo concreto de tu experiencia.");
  } else if (cantidad > 160) {
    partes.push("Diste una respuesta muy completa. En una entrevista real procura ser un poco más conciso y resaltar solo lo esencial.");
  } else {
    partes.push("El largo de tu respuesta es adecuado para una entrevista.");
  }

  const lower = respuesta.toLowerCase();
  const tieneMetrica = /\d/.test(respuesta) || /(mejor[eé]|aument|reduj|logr|increment|ahorr|super[eé])/.test(lower);
  if (tieneMetrica) {
    partes.push("Bien hecho mencionando resultados concretos; eso ayuda a que el reclutador visualice tu impacto.");
  } else {
    partes.push('Intenta incluir algún resultado medible o un logro concreto, por ejemplo: "reduje el tiempo de entrega en un 20%".');
  }

  const muletillas = lower.match(/\b(eh+|este|o sea|osea|como que|bueno pues)\b/g) || [];
  if (muletillas.length >= 2) {
    partes.push("Se notan varias muletillas en tu respuesta; practicar en voz alta te ayudará a reducirlas.");
  }

  if (pregunta?.tip) {
    partes.push("Recuerda: " + pregunta.tip);
  }

  return partes.join(" ");
}