// lib/auth-context.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
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
  ) => Promise<{ requiere2FA: boolean; challengeToken: string | null }>;

  adminLoginStep2: (challengeToken: string, codigo: string) => Promise<MeResponse>;

  logout: () => Promise<void>;
  refrescar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [cargando, setCargando] = useState(true);

  const actualizarSesion = useCallback((me: MeResponse) => {
    setUser(me);
    saveSession({
      tipo: me.tipo,
      id: me.idCandidato ?? me.idEmpresa ?? me.idAdministrador ?? 0,
      idUsuario: me.idUsuario,
    });
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const me = await authApi.me(true);
        if (activo) actualizarSesion(me);
      } catch {
        if (activo) {
          setUser(null);
          clearSession();
        }
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
  }, [actualizarSesion]);

  useEffect(() => {
    const handler = () => {
      setUser(null);
      clearSession();
      if (!pathname.startsWith("/login") && !pathname.startsWith("/registro")) {
        router.push("/login");
      }
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
  }, [router, pathname]);

  const login = useCallback(
    async (correo: string, contrasena: string, tipo: "candidato" | "empresa") => {
      await authApi.login({ correo, contrasena, tipo });
      const me = await authApi.me();
      actualizarSesion(me);
      return me;
    },
    [actualizarSesion]
  );

  // ⬅️ ACTUALIZADO: Devuelve el token
  const adminLoginStep1 = useCallback(
    async (correo: string, contrasena: string) => {
      const resp = await authApi.adminLogin({ correo, contrasena });

      if ("access_token" in resp) {
        const me = await authApi.me();
        actualizarSesion(me);
        return { requiere2FA: false, challengeToken: null };
      }

      return { requiere2FA: true, challengeToken: resp.challenge_token };
    },
    [actualizarSesion]
  );

  // ⬅️ ACTUALIZADO: Recibe el token
  const adminLoginStep2 = useCallback(
    async (challengeToken: string, codigo: string) => {
      await authApi.adminLogin2FA({ challenge_token: challengeToken, codigo });
      const me = await authApi.me();
      actualizarSesion(me);
      return me;
    },
    [actualizarSesion]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    setUser(null);
    clearSession();
    if (!pathname.startsWith("/login")) {
      router.replace("/login");
    }
  }, [router, pathname]);

  const refrescar = useCallback(async () => {
    try {
      const me = await authApi.me();
      actualizarSesion(me);
    } catch {
      setUser(null);
      clearSession();
    }
  }, [actualizarSesion]);

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