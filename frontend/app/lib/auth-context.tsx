// lib/auth-context.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AUTH_LOGOUT_EVENT, authApi, MeResponse } from "./api";
import { clearSession, saveSession } from "./session";

interface AuthContextValue {
  user: MeResponse | null;
  cargando: boolean;

  login: (
    correo: string,
    contrasena: string,
    tipo: "candidato" | "empresa"
  ) => Promise<MeResponse>;

  adminLoginStep1: (
    correo: string,
    contrasena: string
  ) => Promise<{ requiere2FA: boolean }>;

  adminLoginStep2: (correo: string, codigo: string) => Promise<MeResponse>;

  logout: () => Promise<void>;
  refrescar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al montar: consultar /me para saber si hay sesión activa.
  // Si falla, NO redirigimos. El usuario puede seguir navegando
  // por páginas públicas (landing, login, registro, vacantes).
  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const me = await authApi.me(true); // silencioso: no redirige al montar
        if (activo) {
          setUser(me);
          saveSession({
            tipo: me.tipo,
            id: me.idCandidato ?? me.idEmpresa ?? me.idAdministrador ?? 0,
            idUsuario: me.idUsuario,
          });
        }
      } catch {
        if (activo) {
          setUser(null);
          clearSession();
        }
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  // Escuchar el evento de logout disparado por apiFetch cuando el
  // refresh falla en una petición a un recurso PROTEGIDO.
  useEffect(() => {
    const handler = () => {
      setUser(null);
      clearSession();
      router.push("/login");
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
  }, [router]);

  // ============================================================
  // LOGIN candidato / empresa
  // ============================================================
  const login = useCallback(
    async (
      correo: string,
      contrasena: string,
      tipo: "candidato" | "empresa"
    ) => {
      await authApi.login({ correo, contrasena, tipo });
      const me = await authApi.me();
      setUser(me);
      saveSession({
        tipo: me.tipo,
        id: me.idCandidato ?? me.idEmpresa ?? me.idAdministrador ?? 0,
        idUsuario: me.idUsuario,
      });
      return me;
    },
    []
  );

  // ============================================================
  // LOGIN admin — paso 1 (correo + contraseña)
  // ============================================================
  const adminLoginStep1 = useCallback(
    async (correo: string, contrasena: string) => {
      const resp = await authApi.adminLogin({ correo, contrasena });

      // Si el backend ya devolvió token (sin 2FA), hacemos login directo
      if ("access_token" in resp) {
        const me = await authApi.me();
        setUser(me);
        saveSession({
          tipo: me.tipo,
          id: me.idCandidato ?? me.idEmpresa ?? me.idAdministrador ?? 0,
          idUsuario: me.idUsuario,
        });
        return { requiere2FA: false };
      }

      // Si requiere 2FA, no hacemos nada todavía
      return { requiere2FA: true };
    },
    []
  );

  // ============================================================
  // LOGIN admin — paso 2 (código TOTP)
  // ============================================================
  const adminLoginStep2 = useCallback(
    async (correo: string, codigo: string) => {
      await authApi.adminLogin2FA({ correo, codigo });
      const me = await authApi.me();
      setUser(me);
      saveSession({
        tipo: me.tipo,
        id: me.idCandidato ?? me.idEmpresa ?? me.idAdministrador ?? 0,
        idUsuario: me.idUsuario,
      });
      return me;
    },
    []
  );

  // ============================================================
  // LOGOUT
  // ============================================================
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignorar
    }
    setUser(null);
    clearSession();
    router.push("/login");
  }, [router]);

  // ============================================================
  // REFRESCAR (re-consultar /me)
  // ============================================================
  const refrescar = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
      clearSession();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        cargando,
        login,
        adminLoginStep1,
        adminLoginStep2,
        logout,
        refrescar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}