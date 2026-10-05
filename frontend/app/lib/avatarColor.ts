// Genera un color de fondo consistente (no aleatorio en cada render, sino
// siempre el mismo para el mismo nombre) para el avatar cuando el usuario
// no tiene foto de perfil. En cuanto haya una foto, esta reemplaza por
// completo el color y las iniciales.
const PALETA = [
  "#F97316", // naranja
  "#EF4444", // rojo
  "#EC4899", // rosa
  "#8B5CF6", // violeta
  "#6366F1", // índigo
  "#3B82F6", // azul
  "#06B6D4", // cian
  "#10B981", // verde esmeralda
  "#84CC16", // lima
  "#F59E0B", // ámbar
];

export function avatarColorFromName(nombre: string): string {
  const base = (nombre || "Candidato").trim() || "Candidato";
  let suma = 0;
  for (let i = 0; i < base.length; i++) suma += base.charCodeAt(i);
  return PALETA[suma % PALETA.length];
}