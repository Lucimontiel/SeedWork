// lib/session.ts
const SESSION_KEY = 'seedwork_session';

export interface SessionData {
<<<<<<< HEAD
  tipo: 'candidato' | 'empresa' | 'administrador';
=======
  tipo: 'candidato' | 'empresa';
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
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
<<<<<<< HEAD
  if (session.tipo === 'candidato') return '/candidato/inicio';
  if (session.tipo === 'administrador') return '/administrador/inicio';
  return '/empresa/inicio';
=======
  return session.tipo === 'candidato' ? '/candidato/inicio' : '/empresa/inicio';
>>>>>>> 6f6a91bb30c9855e5691b030e4f3e53caec56ec0
}