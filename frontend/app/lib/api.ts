// lib/api.ts (versión corregida)

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
      // Solo disparamos logout si NO es una llamada silenciosa
      if (!silencioso) {
        dispararLogout();
      }
      throw new ApiError("No autenticado.", 401);
    }
  }

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    const mensaje = data?.detail || `Error ${resp.status}`;
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
   *   { "2fa_required": true }  → hay que pedir el código TOTP
   *   { access_token, ... }     → login directo (raro, sin 2FA)
   */
  adminLogin: (payload: { correo: string; contrasena: string }) =>
    apiFetch<
      | { "2fa_required": true; message?: string }
      | TokenResponse
    >("/api/auth/admin/login", { method: "POST", body: payload }),

  /**
   * Paso 2: verificar código TOTP (o código de respaldo).
   * Respuesta: { access_token, token_type, expires_in }
   */
  adminLogin2FA: (payload: { correo: string; codigo: string }) =>
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