// lib/auth-context.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,          // ⬅️ AÑADIDO
  useState,
} 

from "react";
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
  ) => Promise<any>;

  login2FA: (
    challengeToken: string, 
    codigo: string
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

  // ⬅️ FIX #1: ref que siempre apunta al user más reciente
  // Sirve para leer el rol dentro del handler sin re-suscribir el evento
  const userRef = useRef<MeResponse | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const actualizarSesion = useCallback((me: MeResponse) => {
    setUser(me);
    saveSession({
      tipo: me.tipo,
      id: me.idCandidato ?? me.idEmpresa ?? me.idAdministrador ?? 0,
      idUsuario: me.idUsuario,
    });
  }, []);

  // Carga inicial de /me
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
    return () => {
      activo = false;
    };
  }, [actualizarSesion]);

  // ⬅️ FIX #2: limpiar el tema oscuro cuando no hay sesión
  // Evita que el dark mode "sangre" al login/registro tras logout
  useEffect(() => {
    if (!cargando && !user) {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [user, cargando]);

  // ⬅️ FIX #1 + #2 combinados: handler del evento de logout
  // Ya no depende de `user`, así que no se re-suscribe en cada cambio
  useEffect(() => {
    const handler = () => {
      const tipo = userRef.current?.tipo;   // leer rol ANTES de limpiar
      setUser(null);
      clearSession();
      document.documentElement.removeAttribute("data-theme");

      // Redirigir al login correcto según el rol
      const loginPath = tipo === "administrador" ? "/administrador/login" : "/login";
      const yaEnAuth =
        pathname.includes("/login") || pathname.startsWith("/registro");
      if (!yaEnAuth) {
        router.push(loginPath);
      }
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
  }, [router, pathname]);   // ⬅️ sin `user` en deps

    const login = useCallback(
    async (correo: string, contrasena: string, tipo: "candidato" | "empresa") => {
      const resp = await authApi.login({ correo, contrasena, tipo });
      if ("access_token" in resp) {
        const me = await authApi.me();
        actualizarSesion(me);
      }
      return resp;
    },
    [actualizarSesion]
  );

  // ⬇️ PEGA ESTO DEBAJO DEL LOGIN ⬇️
  const login2FA = useCallback(
    async (challengeToken: string, codigo: string) => {
      await authApi.login2FA({ challenge_token: challengeToken, codigo });
      const me = await authApi.me();
      actualizarSesion(me);
      return me;
    },
    [actualizarSesion]
  );

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

  const adminLoginStep2 = useCallback(
    async (challengeToken: string, codigo: string) => {
      await authApi.adminLogin2FA({ challenge_token: challengeToken, codigo });
      const me = await authApi.me();
      actualizarSesion(me);
      return me;
    },
    [actualizarSesion]
  );

  // ⬅️ MODIFICADO: logout con redirect condicional al login correcto
  const logout = useCallback(async () => {
    const tipo = userRef.current?.tipo;   // leer rol ANTES de limpiar
    try {
      await authApi.logout();
    } catch {}
    setUser(null);
    clearSession();
    document.documentElement.removeAttribute("data-theme");

    const loginPath = tipo === "administrador" ? "/administrador/login" : "/login";
    const yaEnAuth = pathname.includes("/login") || pathname.startsWith("/registro");
    if (!yaEnAuth) {
      router.replace(loginPath);
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
        login2FA,
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


