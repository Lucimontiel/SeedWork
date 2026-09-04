// lib/session.ts
const SESSION_KEY = 'seedwork_session';

export interface SessionData {
  tipo: 'candidato' | 'empresa';
  id: number;
  idUsuario?: number;
}

export function saveSession(data: SessionData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }
}

export function getSession(): SessionData | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function getRedirectPath(): string {
  const session = getSession();
  if (!session) return '/login';
  return session.tipo === 'candidato' ? '/candidato/inicio' : '/empresa/inicio';
}