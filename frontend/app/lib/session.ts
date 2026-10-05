// lib/session.ts
/**
 * Sesión "de UI": guarda SOLO información no sensible
 * (tipo de usuario e ID) para saber a dónde redirigir.
 *
 * Los tokens reales viven en cookies httpOnly y NO son accesibles
 * desde JavaScript. La autenticación se valida contra /api/auth/me.
 */

const SESSION_KEY = "seedwork_session";

export interface SessionData {
  tipo: "candidato" | "empresa" | "administrador";
  id: number;           // idCandidato | idEmpresa | idAdministrador
  idUsuario: number;
}

export function saveSession(data: SessionData): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }
}

export function getSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function getRedirectPath(): string {
  const session = getSession();
  if (!session) return "/login";
  if (session.tipo === "candidato") return "/candidato/inicio";
  if (session.tipo === "administrador") return "/administrador/inicio";
  return "/empresa/inicio";
}