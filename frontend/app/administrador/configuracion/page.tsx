"use client";

import { useState } from "react";
import AdministradorShell from "../AdministradorShell";
import { useLocalSetting } from "../../lib/useSettings";

function Toggle({ label, settingKey, defaultChecked = false }: { label: string, settingKey: string, defaultChecked?: boolean }) {
  const [checked, setChecked] = useLocalSetting(settingKey, defaultChecked);
  return (
    <div className="adm-settings-row">
      <span className="row-label">{label}</span>
      <div className={`toggle ${checked ? "on" : ""}`} onClick={() => setChecked(!checked)}></div>
    </div>
  );
}

export default function ConfiguracionAdminPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [modo, setModo] = useLocalSetting("theme:candidato", "claro"); // Misma llave del tema

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  return (
    <AdministradorShell pageTitle="Configuración" pageSubtitle="Seguridad y parámetros generales de la plataforma">
      <div className="adm-settings-grid">
        
        {/* COLUMNA IZQUIERDA */}
        <div>
          <div className="adm-settings-section">
            <div className="adm-settings-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5Z"/></svg>
              Seguridad
            </div>
            <div className="adm-settings-list">
              <div className="adm-settings-row nav" onClick={() => mostrarToast("Cambio de contraseña: Próximamente")}>
                <span className="row-label">Cambiar contraseña</span>
                <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6"/></svg>
              </div>
              <Toggle label="Verificación en dos pasos (2FA)" settingKey="admin:seguridad:2fa" />
            </div>
          </div>

          <div className="adm-settings-section">
            <div className="adm-settings-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 20 9-16H3l9 16Z"/><path d="M12 20v-9"/></svg>
              Apariencia
            </div>
            <div className="adm-settings-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 12, padding: 16, background: "var(--adm-card)" }}>
              <span className="row-label" style={{ color: "var(--muted2)", fontSize: 12.5 }}>Modo de visualización</span>
              <div className="segmented">
                <div className={`seg-btn ${modo === "claro" ? "active" : ""}`} onClick={() => setModo("claro")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
                  Claro
                </div>
                <div className={`seg-btn ${modo === "oscuro" ? "active" : ""}`} onClick={() => setModo("oscuro")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>
                  Oscuro
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div>
          <div className="adm-settings-section">
            <div className="adm-settings-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Plataforma
            </div>
            <div className="adm-settings-list">
              <Toggle label="Aprobación automática de vacantes" settingKey="admin:plat:autoAprobacion" />
              <Toggle label="Notificar reportes por correo" settingKey="admin:plat:notifReportes" defaultChecked />
              <Toggle label="Modo mantenimiento" settingKey="admin:plat:mantenimiento" />
            </div>
          </div>

          <div className="adm-settings-section">
            <div className="adm-settings-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
              Notificaciones
            </div>
            <div className="adm-settings-list">
              <Toggle label="Nuevas vacantes por aprobar" settingKey="admin:notif:vacantes" defaultChecked />
              <Toggle label="Nuevos reportes de usuarios" settingKey="admin:notif:reportes" defaultChecked />
              <Toggle label="Resumen semanal por correo" settingKey="admin:notif:resumen" />
            </div>
          </div>
        </div>

      </div>

      {toast && <div className="toast show">{toast}</div>}
    </AdministradorShell>
  );
}