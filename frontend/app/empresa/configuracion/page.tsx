"use client";

import { useState, useEffect } from "react";
import EmpresaShell from "../EmpresaShell";
import { apiFetch } from "../../lib/api";
import { useLocalSetting } from "../../lib/useSettings";
import { useAuth } from "../../lib/auth-context";
import { useRouter } from "next/navigation";

type ToggleProps = {
  label: string;
  settingKey: string;
  defaultChecked?: boolean;
};

function Toggle({ label, settingKey, defaultChecked = false }: ToggleProps) {
  const [checked, setChecked] = useLocalSetting(settingKey, defaultChecked);
  return (
    <div className="settings-row-toggle">
      <span>{label}</span>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span className="switch-slider" />
      </label>
    </div>
  );
}

type RowLinkProps = {
  label: string;
  onClick?: () => void;
};

function RowLink({ label, onClick }: RowLinkProps) {
  return (
    <button className="settings-row-link" type="button" onClick={onClick}>
      {label}
      <svg viewBox="0 0 20 20"><path d="M7.5 5l5 5-5 5" /></svg>
    </button>
  );
}

export default function ConfiguracionEmpresaPage() {
  const router = useRouter();
  const { user, logout, refrescar } = useAuth();
  const [modo, setModo] = useLocalSetting("empresa:apariencia", "light");
  const [toast, setToast] = useState<string | null>(null);

  const [empresa, setEmpresa] = useState<any>(null);
  const [modalAbierto, setModalAbierto] = useState<string | null>(null);
  const [formEdit, setFormEdit] = useState<any>({});
  const [guardando, setGuardando] = useState(false);

  const [formContrasena, setFormContrasena] = useState({ actual: "", nueva: "", confirmar: "" });
  const [errorContrasena, setErrorContrasena] = useState<string | null>(null);

    // ============ 2FA REAL ============
  const [modal2FA, setModal2FA] = useState(false);
  const [paso2FA, setPaso2FA] = useState<"inicio" | "setup" | "verificar" | "backup" | "desactivar">("inicio");
  const [qrUri, setQrUri] = useState("");
  const [codigo2FA, setCodigo2FA] = useState("");
  const [password2FA, setPassword2FA] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [cargando2FA, setCargando2FA] = useState(false);
  const [error2FA, setError2FA] = useState<string | null>(null);

  function abrirModal2FA() {
    setModal2FA(true);
    setError2FA(null);
    setCodigo2FA("");
    setPassword2FA("");
    setPaso2FA(user?.totpHabilitado ? "desactivar" : "inicio");
  }

    async function iniciarSetup2FA() {
    setCargando2FA(true);
    setError2FA(null);
    try {
      //  Agregamos qr_base64 al tipado
      const res = await apiFetch<{ secreto: string; qr_uri: string; qr_base64: string }>("/api/auth/2fa/setup", { method: "POST" });
      
      setQrUri(res.qr_base64); // Guardamos la imagen en Base64 en lugar de la URL
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
      if (refrescar) await refrescar();
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

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    if (user?.idEmpresa) {
      apiFetch<any>(`/api/empresa/${user.idEmpresa}`).then(setEmpresa).catch(() => {});
    }
  }, [user]);

  function abrirModal(tipo: string) {
    setModalAbierto(tipo);
    setErrorContrasena(null);
    
    if (tipo === "nombre") setFormEdit({ nombreEmpresa: empresa?.nombreEmpresa || "" });
    if (tipo === "contacto") setFormEdit({ telefono: empresa?.telefono || "", correoCorporativo: empresa?.correoCorporativo || "" });
    if (tipo === "ubicacion") setFormEdit({ ciudad: empresa?.ciudad || "", direccion: empresa?.direccion || "" });
    if (tipo === "sector") setFormEdit({ sector: empresa?.sector || "" });
    
    if (tipo === "contrasena") setFormContrasena({ actual: "", nueva: "", confirmar: "" });
  }

  async function guardarModal() {
    if (!user?.idEmpresa || !modalAbierto) return;
    setGuardando(true);
    try {
      await apiFetch(`/api/empresa/${user.idEmpresa}`, {
        method: "PUT",
        body: formEdit,
      });
      const actualizado = await apiFetch<any>(`/api/empresa/${user.idEmpresa}`);
      setEmpresa(actualizado);
      setModalAbierto(null);
      mostrarToast("Información actualizada correctamente");
    } catch (err: any) {
      mostrarToast(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarContrasena(e: React.FormEvent) {
    e.preventDefault();
    setErrorContrasena(null);

    if (formContrasena.nueva.length < 8) return setErrorContrasena("La nueva contraseña debe tener al menos 8 caracteres.");
    if (formContrasena.nueva !== formContrasena.confirmar) return setErrorContrasena("Las contraseñas no coinciden.");

    setGuardando(true);
    try {
        await apiFetch("/api/auth/cambiar-contrasena", {
          method: "PUT",
          body: {
            contrasenaActual: formContrasena.actual,
            contrasenaNueva: formContrasena.nueva,
        },
      });
      setModalAbierto(null);
      await logout();
      router.replace("/login?password-changed=1");
    } catch (err: any) {
      setErrorContrasena(err.message || "Error al cambiar la contraseña");
    } finally {
      setGuardando(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "10px 12px",
    fontFamily: "inherit",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
    background: "var(--white)",
    color: "var(--ink)"
  };

  return (
    <EmpresaShell
      pageTitle="Configuración"
      pageSubtitle="Administra tus preferencias, seguridad y demás opciones de tu cuenta"
    >
      <div className="settings-layout">
        {/* COLUMNA IZQUIERDA */}
        <div className="settings-col">
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><circle cx="10" cy="6.5" r="3" /><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" /></svg>
              Información General
            </h2>
            <div className="settings-card">
              <RowLink label="Nombre de la empresa" onClick={() => abrirModal("nombre")} />
              <RowLink label="Información de contacto" onClick={() => abrirModal("contacto")} />
              <RowLink label="Ubicación" onClick={() => abrirModal("ubicacion")} />
              <RowLink label="Sector de la empresa" onClick={() => abrirModal("sector")} />
              <RowLink label="Zona horaria" onClick={() => mostrarToast("Zona horaria: (GMT-5) Bogotá, Lima, Quito")} />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><path d="M10 2.5l6.5 2.4v4.8c0 4-2.7 6.8-6.5 8.3-3.8-1.5-6.5-4.3-6.5-8.3V4.9z" /></svg>
              Seguridad
            </h2>
            <div className="settings-card">
              <RowLink label="Cambiar contraseña" onClick={() => abrirModal("contrasena")} />
                <div className="settings-row-toggle" onClick={abrirModal2FA} style={{ cursor: "pointer" }}>
                  <span>Verificación en dos pasos (2FA)</span>
                  <span style={{ 
                    fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 12,
                    color: user?.totpHabilitado ? "#2FA360" : "#B5750C",
                    background: user?.totpHabilitado ? "#E4F7EA" : "#FDF1DC" 
                  }}>
                    {user?.totpHabilitado ? "Activado" : "Desactivado"}
                  </span>
                </div>
              {/* Se eliminaron Correo admin, Sesiones activas e Historial de accesos */}
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.6" /><path d="M3.5 7h13M10 7v4M10 11l-3 6M10 11l3 6M6.5 9.5h7" /></svg>
              Accesibilidad
            </h2>
            <div className="settings-card">
              <Toggle label="Texto de alto contraste" settingKey="empresa:accesibilidad:contraste" />
              <Toggle label="Reducir animaciones" settingKey="empresa:accesibilidad:reducirAnim" />
              <Toggle label="Navegación con teclado" settingKey="empresa:accesibilidad:navTeclado" defaultChecked />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><path d="M13.5 3.5l3 3L7 16H4v-3z" /></svg>
              Apariencia
            </h2>
            <div className="settings-card settings-card-pad">
              <p className="settings-field-label">Modo de visualización</p>
              <div className="appearance-toggle">
                <button
                  className={"appearance-option" + (modo === "light" ? " active" : "")}
                  type="button"
                  onClick={() => setModo("light")}
                >
                  <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.4" /><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.8 4.8l1.4 1.4M13.8 13.8l1.4 1.4M4.8 15.2l1.4-1.4M13.8 6.2l1.4-1.4" /></svg>
                  Claro
                </button>
                <button
                  className={"appearance-option" + (modo === "dark" ? " active" : "")}
                  type="button"
                  onClick={() => setModo("dark")}
                >
                  <svg viewBox="0 0 20 20"><path d="M16.5 12.3A6.8 6.8 0 017.7 3.5a7 7 0 108.8 8.8z" /></svg>
                  Oscuro
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="settings-col">
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><rect x="4.5" y="9" width="11" height="7.5" rx="1.4" /><path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" /></svg>
              Privacidad
            </h2>
            <div className="settings-card">
              <Toggle label="Mostrar mi empresa públicamente" settingKey="empresa:priv:publica" defaultChecked />
              <Toggle label="Mostrar empleados y tamaño de empresa" settingKey="empresa:priv:empleados" defaultChecked />
              <Toggle label="Permitir que SeedWork use sus datos" settingKey="empresa:priv:datos" defaultChecked />
              <Toggle label="Ocultar mis ofertas al finalizar" settingKey="empresa:priv:ofertas" defaultChecked />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><path d="M10 2.5a4 4 0 014 4v2.3c0 .9.3 1.8.9 2.5l.6.7H4.5l.6-.7c.6-.7.9-1.6.9-2.5V6.5a4 4 0 014-4z" /><path d="M8 16a2 2 0 004 0" /></svg>
              Notificaciones
            </h2>
            <div className="settings-card">
              <Toggle label="Nuevos candidatos a mis ofertas" settingKey="empresa:notif:candidatos" defaultChecked />
              <Toggle label="Aplicaciones destacadas" settingKey="empresa:notif:aplicaciones" />
              <Toggle label="Recordatorio de seguimiento" settingKey="empresa:notif:seguimiento" defaultChecked />
              <Toggle label="Novedades de SeedWork" settingKey="empresa:notif:novedades" />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><ellipse cx="10" cy="5" rx="6.5" ry="2.3" /><path d="M3.5 5v10c0 1.3 2.9 2.3 6.5 2.3s6.5-1 6.5-2.3V5" /><path d="M3.5 10c0 1.3 2.9 2.3 6.5 2.3s6.5-1 6.5-2.3" /></svg>
              Datos de la Cuenta
            </h2>
            <div className="settings-card settings-card-pad">
              <div className="pref-list">
                <div className="pref-row"><span className="k">Plan actual</span><span className="v">Gratuito (Demo)</span></div>
                <div className="pref-row"><span className="k">Próxima renovación</span><span className="v">N/A</span></div>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2" /><path d="M2.8 10h14.4M10 2.8c2 2 3 4.5 3 7.2s-1 5.2-3 7.2c-2-2-3-4.5-3-7.2s1-5.2 3-7.2z" /></svg>
              Idioma y Región
            </h2>
            <div className="settings-card settings-card-pad">
              <label className="settings-select-label">
                Idioma
                <select className="settings-select" defaultValue="es-CO" style={{ background: "var(--white)", color: "var(--ink)", borderColor: "var(--line)" }}>
                  <option value="es-CO">Español (Latinoamérica)</option>
                  <option value="en-US">English (US)</option>
                </select>
              </label>
              <label className="settings-select-label">
                Región
                <select className="settings-select" defaultValue="CO" style={{ background: "var(--white)", color: "var(--ink)", borderColor: "var(--line)" }}>
                  <option value="CO">Colombia</option>
                  <option value="MX">México</option>
                </select>
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* MODALES */}
      {modalAbierto && (
        <div className="cv-form-modal-backdrop" onClick={() => !guardando && setModalAbierto(null)}>
          <div className="cv-form-modal" onClick={(e) => e.stopPropagation()} style={{ background: "var(--white)", color: "var(--ink)" }}>
            <div className="cv-form-modal-header" style={{ borderColor: "var(--line)" }}>
              <h3>
                {modalAbierto === "nombre" && "Nombre de la empresa"}
                {modalAbierto === "contacto" && "Información de contacto"}
                {modalAbierto === "ubicacion" && "Ubicación"}
                {modalAbierto === "sector" && "Sector de la empresa"}
                {modalAbierto === "contrasena" && "Cambiar contraseña"}
              </h3>
              <button type="button" className="cv-form-modal-close" onClick={() => setModalAbierto(null)} disabled={guardando}>×</button>
            </div>
            
            <div className="cv-form-modal-body">
              {modalAbierto === "nombre" && (
                <div className="cv-form-field">
                  <label>Nombre de la empresa</label>
                  <input type="text" value={formEdit.nombreEmpresa} onChange={(e) => setFormEdit({ ...formEdit, nombreEmpresa: e.target.value })} style={inputStyle} />
                </div>
              )}

              {modalAbierto === "contacto" && (
                <>
                  <div className="cv-form-field">
                    <label>Teléfono de contacto</label>
                    <input type="tel" value={formEdit.telefono} onChange={(e) => setFormEdit({ ...formEdit, telefono: e.target.value })} style={inputStyle} />
                  </div>
                  <div className="cv-form-field">
                    <label>Correo corporativo</label>
                    <input type="email" value={formEdit.correoCorporativo} onChange={(e) => setFormEdit({ ...formEdit, correoCorporativo: e.target.value })} style={inputStyle} />
                  </div>
                </>
              )}

              {modalAbierto === "ubicacion" && (
                <>
                  <div className="cv-form-field">
                    <label>Ciudad</label>
                    <input type="text" value={formEdit.ciudad} onChange={(e) => setFormEdit({ ...formEdit, ciudad: e.target.value })} style={inputStyle} />
                  </div>
                  <div className="cv-form-field">
                    <label>Dirección</label>
                    <input type="text" value={formEdit.direccion} onChange={(e) => setFormEdit({ ...formEdit, direccion: e.target.value })} style={inputStyle} />
                  </div>
                </>
              )}

              {modalAbierto === "sector" && (
                <div className="cv-form-field">
                  <label>Sector de la empresa</label>
                  <select value={formEdit.sector} onChange={(e) => setFormEdit({ ...formEdit, sector: e.target.value })} style={inputStyle}>
                    <option value="">Selecciona un sector</option>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Educación">Educación</option>
                    <option value="Salud">Salud</option>
                    <option value="Finanzas">Finanzas</option>
                    <option value="Construcción">Construcción</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              )}

              {modalAbierto === "contrasena" && (
                <form onSubmit={guardarContrasena} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="cv-form-field">
                    <label>Contraseña actual</label>
                    <input type="password" value={formContrasena.actual} onChange={(e) => setFormContrasena({ ...formContrasena, actual: e.target.value })} style={inputStyle} required />
                  </div>
                  <div className="cv-form-field">
                    <label>Nueva contraseña</label>
                    <input type="password" value={formContrasena.nueva} onChange={(e) => setFormContrasena({ ...formContrasena, nueva: e.target.value })} style={inputStyle} required />
                  </div>
                  <div className="cv-form-field">
                    <label>Confirmar nueva contraseña</label>
                    <input type="password" value={formContrasena.confirmar} onChange={(e) => setFormContrasena({ ...formContrasena, confirmar: e.target.value })} style={inputStyle} required />
                  </div>
                  {errorContrasena && <span className="form-error-msg">{errorContrasena}</span>}
                </form>
              )}
            </div>

            <div className="cv-form-modal-footer" style={{ borderColor: "var(--line)" }}>
              <button type="button" className="btn-cancel-edit" onClick={() => setModalAbierto(null)} disabled={guardando}>Cancelar</button>
              {modalAbierto === "contrasena" ? (
                <button type="button" className="cv-btn-solid" onClick={(e) => guardarContrasena(e as any)} disabled={guardando}>
                  {guardando ? "Cambiando..." : "Cambiar contraseña"}
                </button>
              ) : (
                <button type="button" className="cv-btn-solid" onClick={guardarModal} disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                  <img src={`data:image/png;base64,${qrUri}`} alt="QR 2FA" style={{ margin: "16px auto", borderRadius: 8, width: 200, height: 200 }} />
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


      {toast && <div className="sw-toast show">{toast}</div>}
    </EmpresaShell>
  );
}