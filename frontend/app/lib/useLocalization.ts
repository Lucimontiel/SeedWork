"use client";

import { useLocalSetting } from "./useSettings";

const TRADUCCIONES: Record<string, Record<string, string>> = {
  "Español (Latinoamérica)": {
    inicio: "Inicio",
    perfil: "Perfil",
    miCV: "Mi CV",
    vacantes: "Vacantes",
    postulaciones: "Mis postulaciones",
    consejos: "Consejos",
    simulador: "Simulador",
    configuracion: "Configuración",
    cerrarSesion: "Cerrar sesión",
    notificaciones: "Notificaciones",
    verTodasNotif: "Ver todas las notificaciones",
    nuevaVacante: "Nueva vacante recomendada",
    postulacionVista: "Postulación vista",
    procesoActualizado: "Proceso actualizado",
    entrevistaProg: "Entrevista programada",
  },
  "Español (España)": {
    inicio: "Inicio",
    perfil: "Perfil",
    miCV: "Mi CV",
    vacantes: "Vacantes",
    postulaciones: "Mis postulaciones",
    consejos: "Consejos",
    simulador: "Simulador",
    configuracion: "Configuración",
    cerrarSesion: "Cerrar sesión",
    notificaciones: "Notificaciones",
    verTodasNotif: "Ver todas las notificaciones",
    nuevaVacante: "Nueva vacante recomendada",
    postulacionVista: "Postulación vista",
    procesoActualizado: "Proceso actualizado",
    entrevistaProg: "Entrevista programada",
  },
  "English (US)": {
    inicio: "Home",
    perfil: "Profile",
    miCV: "My Resume",
    vacantes: "Jobs",
    postulaciones: "My applications",
    consejos: "Tips",
    simulador: "Simulator",
    configuracion: "Settings",
    cerrarSesion: "Sign out",
    notificaciones: "Notifications",
    verTodasNotif: "View all notifications",
    nuevaVacante: "New recommended job",
    postulacionVista: "Application viewed",
    procesoActualizado: "Process updated",
    entrevistaProg: "Interview scheduled",
  },
  "Português (Brasil)": {
    inicio: "Início",
    perfil: "Perfil",
    miCV: "Meu Currículo",
    vacantes: "Vagas",
    postulaciones: "Minhas candidaturas",
    consejos: "Dicas",
    simulador: "Simulador",
    configuracion: "Configurações",
    cerrarSesion: "Sair",
    notificaciones: "Notificações",
    verTodasNotif: "Ver todas as notificações",
    nuevaVacante: "Nova vaga recomendada",
    postulacionVista: "Candidatura visualizada",
    procesoActualizado: "Processo atualizado",
    entrevistaProg: "Entrevista agendada",
  },
};

const LOCALES_POR_REGION: Record<string, string> = {
  "Colombia": "es-CO",
  "México": "es-MX",
  "Perú": "es-PE",
  "Chile": "es-CL",
  "Argentina": "es-AR",
};

export function useLocalization() {
  const [idioma] = useLocalSetting("idioma", "Español (Latinoamérica)");
  const [region] = useLocalSetting("region", "Colombia");

  function t(key: string): string {
    return (
      TRADUCCIONES[idioma]?.[key] ||
      TRADUCCIONES["Español (Latinoamérica)"][key] ||
      key
    );
  }

  function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const locale = LOCALES_POR_REGION[region] || "es-CO";
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return { idioma, region, t, formatDate };
}