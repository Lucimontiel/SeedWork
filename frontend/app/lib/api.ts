// lib/api.ts

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// ============================================================
// Refresh automático
// ============================================================

let refreshPromise: Promise<boolean> | null = null;

async function intentarRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return resp.ok;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        refreshPromise = null;
      }, 100);
    }
  })();

  return refreshPromise;
}

// ============================================================
// Eventos de auth
// ============================================================

export const AUTH_LOGOUT_EVENT = "auth:logout";

function dispararLogout() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
}

// ============================================================
// Helper para extraer mensajes de error (Pydantic / FastAPI)
// ============================================================
function extraerMensajeError(data: any, status: number): string {
  if (!data) return `Error ${status}`;
  const detail = data.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const primero = detail[0];
    const campo = Array.isArray(primero.loc) ? primero.loc.slice(-1)[0] : "";
    return campo ? `Campo '${campo}': ${primero.msg}` : primero.msg;
  }
  return `Error ${status}`;
}

// ============================================================
// Fetch con manejo de refresh automático
// ============================================================

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Si true, no redirige al login si el refresh falla (útil al montar). */
  silencioso?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { body, headers, silencioso = false, ...rest } = options;

  const finalHeaders: HeadersInit = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers || {}),
  };

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const makeRequest = () =>
    fetch(url, {
      ...rest,
      headers: finalHeaders,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let resp = await makeRequest();

  const esEndpointAuth =
    path.includes("/api/auth/login") ||
    path.includes("/api/auth/refresh") ||
    path.includes("/api/auth/admin/login");

  if (resp.status === 401 && !esEndpointAuth) {
    const ok = await intentarRefresh();
    if (ok) {
      resp = await makeRequest();
    } else {
      if (!silencioso) {
        dispararLogout();
      }
      throw new ApiError("No autenticado.", 401);
    }
  }

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    const mensaje = extraerMensajeError(data, resp.status);
    throw new ApiError(mensaje, resp.status, data);
  }

  if (resp.status === 204) return undefined as T;

  return (await resp.json()) as T;
}

// ============================================================
// Error tipado
// ============================================================

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ============================================================
// Helpers específicos de auth
// ============================================================

export interface LoginPayload {
  correo: string;
  contrasena: string;
  tipo: "candidato" | "empresa";
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AdminChallengeResponse {
  dos_fa_requerido: boolean;
  challenge_token: string;
  message?: string;
}

export interface MeResponse {
  idUsuario: number;
  correo: string;
  rol: string;
  tipo: "candidato" | "empresa" | "administrador";
  idCandidato: number | null;
  idEmpresa: number | null;
  idAdministrador: number | null;
  totpHabilitado: boolean;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiFetch<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: payload,
    }),

  // ============================================================
  // ADMIN LOGIN (2 pasos)
  // ============================================================

  /**
   * Paso 1: correo + contraseña.
   * Respuesta puede ser:
   *   { dos_fa_requerido: true, challenge_token: "..." } → hay que pedir el código TOTP
   *   { access_token, ... } → login directo (raro, sin 2FA)
   */
  adminLogin: (payload: { correo: string; contrasena: string }) =>
    apiFetch<AdminChallengeResponse | TokenResponse>(
      "/api/auth/admin/login",
      { method: "POST", body: payload }
    ),

  /**
   * Paso 2: verificar código TOTP usando el challenge_token.
   */
  adminLogin2FA: (payload: { challenge_token: string; codigo: string }) =>
    apiFetch<TokenResponse>("/api/auth/admin/login/2fa", {
      method: "POST",
      body: payload,
    }),

  // ============================================================

  logout: () =>
    apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" }),

  me: (silencioso = false) =>
    apiFetch<MeResponse>("/api/auth/me", { silencioso }),
};