"use client";

import { useState } from "react";
import AdministradorShell from "../AdministradorShell";
import { useLocalSetting } from "../../lib/useSettings";
import { useAuth } from "../../lib/auth-context"; // ⬅️ NUEVO
import { apiFetch } from "../../lib/api"; // ⬅️ NUEVO

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
  const { user, refrescar } = useAuth(); // ⬅️ Obtener el usuario actual
  const [toast, setToast] = useState<string | null>(null);
  const [modo, setModo] = useLocalSetting("theme:candidato", "claro");
  
  // ⬇️ NUEVOS ESTADOS PARA EL MODAL 2FA ⬇️
  const [modal2FA, setModal2FA] = useState(false);
  const [paso2FA, setPaso2FA] = useState<"inicio" | "setup" | "verificar" | "backup" | "desactivar">("inicio");
  const [qrUri, setQrUri] = useState("");
  const [codigo2FA, setCodigo2FA] = useState("");
  const [password2FA, setPassword2FA] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [cargando2FA, setCargando2FA] = useState(false);
  const [error2FA, setError2FA] = useState<string | null>(null);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }
  
  function abrirModal2FA() {
    setModal2FA(true);
    setError2FA(null);
    setCodigo2FA("");
    setPassword2FA("");
    // Si ya está habilitado, mostramos la opción de desactivar
    setPaso2FA(user?.totpHabilitado ? "desactivar" : "inicio");
  }

  async function iniciarSetup2FA() {
    setCargando2FA(true);
    setError2FA(null);
    try {
      const res = await apiFetch<{ secreto: string; qr_uri: string }>("/api/auth/2fa/setup", { method: "POST" });
      setQrUri(res.qr_uri);
      setPaso2FA("setup");
    } catch (err: any) {
      setError2FA(err.message);
    } finally {
      setCargando2FA(false);
    }
  }

  async function confirmar2FA() {
    if (!codigo2FA || codigo2FA.length < 6) return setError2FA("Ingresa el código de 6 dígitos.");
    setCargando2FA(true);
    setError2FA(null);
    try {
      const res = await apiFetch<{ backup_codes: string[] }>("/api/auth/2fa/enable", {
        method: "POST",
        body: { codigo: codigo2FA }
      });
      setBackupCodes(res.backup_codes);
      setPaso2FA("backup");
      if (refrescar) await refrescar(); // Actualizar el estado global
    } catch (err: any) {
      setError2FA(err.message);
    } finally {
      setCargando2FA(false);
    }
  }

  async function desactivar2FA() {
    if (!password2FA || !codigo2FA) return setError2FA("Completa todos los campos.");
    setCargando2FA(true);
    setError2FA(null);
    try {
      await apiFetch("/api/auth/2fa/disable", {
        method: "POST",
        body: { contrasena: password2FA, codigo: codigo2FA }
      });
      setPaso2FA("inicio");
      setModal2FA(false);
      mostrarToast("2FA desactivado correctamente.");
      if (refrescar) await refrescar();
    } catch (err: any) {
      setError2FA(err.message);
    } finally {
      setCargando2FA(false);
    }
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
              {/* 2FA ya desarrollado*/}
              <div className="adm-settings-row nav" onClick={abrirModal2FA}>
                <span className="row-label">Verificación en dos pasos (2FA)</span>
                <span className={`badge ${user?.totpHabilitado ? 'badge-green' : 'badge-amber'}`}>
                  {user?.totpHabilitado ? "Activado" : "Desactivado"}
                </span>
              </div>
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
      
      {/* MODAL 2FA REAL */}
      {modal2FA && (
        <div className="cv-form-modal-backdrop" onClick={() => !cargando2FA && setModal2FA(false)}>
          <div className="cv-form-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="cv-form-modal-header">
              <h3>Verificación en dos pasos</h3>
              <button type="button" className="cv-form-modal-close" onClick={() => setModal2FA(false)}>×</button>
            </div>
            
            <div className="cv-form-modal-body">
              {error2FA && <div className="alert-error" style={{ marginBottom: 16 }}>{error2FA}</div>}

              {paso2FA === "inicio" && !user?.totpHabilitado && (
                <div>
                  <p>Protege tu cuenta. Necesitarás una app como Google Authenticator.</p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                    <button className="btn-cancel-edit" onClick={() => setModal2FA(false)}>Cancelar</button>
                    <button className="cv-btn-solid" onClick={iniciarSetup2FA} disabled={cargando2FA}>Configurar 2FA</button>
                  </div>
                </div>
              )}

              {paso2FA === "setup" && (
                <div style={{ textAlign: "center" }}>
                  <p>Escanea el código QR:</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`} alt="QR 2FA" style={{ margin: "16px auto", borderRadius: 8 }} />
                  <input type="text" maxLength={6} value={codigo2FA} onChange={e => setCodigo2FA(e.target.value.replace(/\D/g, ''))} placeholder="000000" style={{ textAlign: "center", fontSize: 18, letterSpacing: 4, width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                    <button className="btn-cancel-edit" onClick={() => setModal2FA(false)}>Cancelar</button>
                    <button className="cv-btn-solid" onClick={confirmar2FA} disabled={cargando2FA || codigo2FA.length < 6}>Verificar</button>
                  </div>
                </div>
              )}

              {paso2FA === "backup" && (
                <div>
                  <p style={{ color: "#C97A1F", fontWeight: 600 }}>¡Guarda estos códigos!</p>
                  <div style={{ background: "#FAFBFC", padding: 16, borderRadius: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {backupCodes.map(c => <code key={c} style={{ fontSize: 14, fontWeight: "bold" }}>{c}</code>)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                    <button className="cv-btn-solid" onClick={() => setModal2FA(false)}>Entendido</button>
                  </div>
                </div>
              )}

              {paso2FA === "desactivar" && (
                <div>
                  <p>Para desactivar, confirma tu contraseña y un código:</p>
                  <input type="password" value={password2FA} onChange={e => setPassword2FA(e.target.value)} placeholder="Contraseña actual" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)", marginBottom: 10 }} />
                  <input type="text" maxLength={6} value={codigo2FA} onChange={e => setCodigo2FA(e.target.value.replace(/\D/g, ''))} placeholder="000000" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                    <button className="btn-cancel-edit" onClick={() => setModal2FA(false)}>Cancelar</button>
                    <button className="cv-btn-solid" style={{ background: "#D0402F" }} onClick={desactivar2FA} disabled={cargando2FA || !password2FA || !codigo2FA}>Desactivar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast show">{toast}</div>}
    </AdministradorShell>
  );
}