"use client";

import { useState } from "react";
import CandidatoShell from "../CandidatoShell";
import { useCandidato } from "../../lib/useCandidato";
import { useTheme } from "@/app/lib/useTheme";
import { useLocalSetting } from "@/app/lib/useSettings";
import { apiFetch } from "@/app/lib/api"; // ⬅️ Usamos apiFetch
import { useAuth } from "@/app/lib/auth-context";
import { useRouter } from "next/navigation";
import { useSyncAccesibilidad } from "@/app/lib/useAccessibility";

/* ---------- Utilidad: formato del teléfono colombiano ---------- */
function formatearTelefonoCO(nuevo: string): string {
  const digitos = nuevo.replace(/\D/g, "").replace(/^57/, "").slice(0, 10);
  if (!digitos) return "+57 ";
  const p1 = digitos.slice(0, 3);
  const p2 = digitos.slice(3, 6);
  const p3 = digitos.slice(6, 10);
  return `+57 ${[p1, p2, p3].filter(Boolean).join(" ")}`.trim();
}

/* ---------- Datos estáticos para Preferencias de Contenido ---------- */
const TIPOS_EMPLEO = ["Tiempo completo", "Medio tiempo", "Por horas", "Prácticas", "Freelance"];
const CATEGORIAS_INTERES = ["Desarrollo de Software", "Diseño", "Marketing", "Ventas", "Administración", "Recursos Humanos", "Finanzas"];
const EMPRESAS_DISPONIBLES = ["Tech Solutions SAS", "Innovatech", "DataCorp", "CloudSoft", "Digital Minds", "Startup Hub"];

/* ---------- Componentes auxiliares ---------- */

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <div className="settings-row-toggle">
      <span>{label}</span>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch-slider" />
      </label>
    </div>
  );
}

function LinkRow({ label, value, onClick }: { label: string; value?: string; onClick?: () => void; }) {
  return (
    <button className="settings-row-link" type="button" onClick={onClick ?? ((e) => e.preventDefault())}>
      {label}
      {value && <span className="settings-row-value">{value}</span>}
      <svg viewBox="0 0 20 20"><path d="M7.5 5l5 5-5 5" /></svg>
    </button>
  );
}

/* ---------- Página ---------- */

export default function ConfiguracionPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { candidato, recargar } = useCandidato();
  const { theme: modo, setTheme: setModo } = useTheme();
  const [toast, setToast] = useState<string | null>(null);

  // Modales
  const [modalCorreo, setModalCorreo] = useState(false);
  const [formCorreo, setFormCorreo] = useState({ correo: "", telefono: "" });
  const [guardandoCorreo, setGuardandoCorreo] = useState(false);

  const [modalContrasena, setModalContrasena] = useState(false);
  const [formContrasena, setFormContrasena] = useState({ actual: "", nueva: "", confirmar: "" });
  const [guardandoContrasena, setGuardandoContrasena] = useState(false);
  const [erroresContrasena, setErroresContrasena] = useState<{ actual?: string; nueva?: string; confirmar?: string; }>({});

  const [modalInfoCuenta, setModalInfoCuenta] = useState(false);

  // ============ 2FA REAL ============
  const { user, refrescar } = useAuth(); // Asegúrate de importar useAuth y apiFetch si no están
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
      // Agregamos qr_base64 al tipado
      const res = await apiFetch<{ secreto: string; qr_uri: string; qr_base64: string }>("/api/auth/2fa/setup", { method: "POST" });
      
      setQrUri(res.qr_base64); //  Guardamos la imagen en Base64 en lugar de la URL
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

  // Accesibilidad
  const [altoContraste, setAltoContraste] = useLocalSetting("accesibilidad:contraste", false);
  const [reducirAnim, setReducirAnim] = useLocalSetting("accesibilidad:reducirAnim", false);
  const [navTeclado, setNavTeclado] = useLocalSetting("accesibilidad:navTeclado", true);

  useSyncAccesibilidad(altoContraste, reducirAnim, navTeclado);

  // Notificaciones
  const [notifOfertas, setNotifOfertas] = useLocalSetting("notif:ofertas", true);
  const [notifRecordatorios, setNotifRecordatorios] = useLocalSetting("notif:recordatorios", true);
  const [notifCambios, setNotifCambios] = useLocalSetting("notif:cambios", true);

  // Privacidad
  const [privPerfil, setPrivPerfil] = useLocalSetting("priv:perfil", true);
  const [privDisponibilidad, setPrivDisponibilidad] = useLocalSetting("priv:disponibilidad", true);
  const [privSalario, setPrivSalario] = useLocalSetting("priv:salario", false);

  // IA
  const [iaSimulador, setIaSimulador] = useLocalSetting("ia:simulador", true);

  // Idioma y Región
  const [idioma, setIdioma] = useLocalSetting("idioma", "Español (Latinoamérica)");
  const [region, setRegion] = useLocalSetting("region", "Colombia");

  // Preferencias de contenido
  const [modalTiposEmpleo, setModalTiposEmpleo] = useState(false);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [modalEmpresasFav, setModalEmpresasFav] = useState(false);

  const [tiposEmpleoSeleccionados, setTiposEmpleoSeleccionados] = useLocalSetting<string[]>("pref:tiposEmpleoArr", ["Tiempo completo"]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useLocalSetting<string[]>("pref:categoriasArr", []);
  const [empresasFavSeleccionadas, setEmpresasFavSeleccionadas] = useLocalSetting<string[]>("pref:empresasFavArr", []);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function abrirInfoCuenta() {
    setModalInfoCuenta(true);
  }

  function abrirCorreoTelefono() {
    if (!candidato) return;
    setFormCorreo({
      correo: candidato.correo || "",
      telefono: candidato.telefono || "+57 ",
    });
    setModalCorreo(true);
  }

  async function guardarCorreoTelefono(e: React.FormEvent) {
    e.preventDefault();
    if (!candidato) return;
    setGuardandoCorreo(true);
    try {
      await apiFetch(`/api/candidato/${candidato.idCandidato}/perfil/datos`, {
        method: "PUT",
        body: {
          correo: formCorreo.correo.trim(),
          telefono: formCorreo.telefono.trim(),
        },
      });
      setModalCorreo(false);
      mostrarToast("Datos actualizados correctamente");
      recargar?.();
    } catch (err: any) {
      mostrarToast(err.message || "Error al guardar");
    } finally {
      setGuardandoCorreo(false);
    }
  }

  function abrirCambiarContrasena() {
    setFormContrasena({ actual: "", nueva: "", confirmar: "" });
    setErroresContrasena({});
    setModalContrasena(true);
  }

  async function guardarContrasena(e: React.FormEvent) {
    e.preventDefault();
    if (!candidato) return;

    const nuevosErrores: typeof erroresContrasena = {};

    if (!formContrasena.actual.trim()) nuevosErrores.actual = "Debes ingresar tu contraseña actual";
    if (!formContrasena.nueva.trim()) {
      nuevosErrores.nueva = "Debes ingresar una nueva contraseña";
    } else if (formContrasena.nueva.length < 8) {
      nuevosErrores.nueva = "Debe tener al menos 8 caracteres";
    } else if (formContrasena.nueva === formContrasena.actual) {
      nuevosErrores.nueva = "Debe ser diferente a la contraseña actual";
    }
    if (!formContrasena.confirmar.trim()) {
      nuevosErrores.confirmar = "Debes confirmar la nueva contraseña";
    } else if (formContrasena.nueva !== formContrasena.confirmar) {
      nuevosErrores.confirmar = "Las contraseñas no coinciden";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresContrasena(nuevosErrores);
      return;
    }

    setErroresContrasena({});
    setGuardandoContrasena(true);
    try {
      await apiFetch("/api/auth/cambiar-contrasena", {
        method: "PUT",
        body: {
          idUsuario: candidato.idUsuario,
          contrasenaActual: formContrasena.actual,
          contrasenaNueva: formContrasena.nueva,
        },
      });
      setModalContrasena(false);
      setFormContrasena({ actual: "", nueva: "", confirmar: "" });
      setErroresContrasena({});
      await logout();
      router.replace("/login?password-changed=1");
    } catch (err: any) {
      const mensaje = err.message || "Error al cambiar la contraseña";
      // El backend devuelve "La contraseña actual es incorrecta"
      if (mensaje.toLowerCase().includes("actual")) {
        setErroresContrasena({ actual: mensaje });
      } else {
        setErroresContrasena({ nueva: mensaje });
      }
    } finally {
      setGuardandoContrasena(false);
    }
  }

  // ============ Preferencias de contenido ============
  function abrirTiposEmpleo() { setModalTiposEmpleo(true); }
  function abrirCategorias() { setModalCategorias(true); }
  function abrirEmpresasFav() { setModalEmpresasFav(true); }

  function toggleSeleccion<T>(lista: T[], item: T, setter: (v: T[]) => void) {
    if (lista.includes(item)) setter(lista.filter((x) => x !== item));
    else setter([...lista, item]);
  }

  function resumenSeleccion(lista: string[]): string {
    if (lista.length === 0) return "Sin seleccionar";
    if (lista.length === 1) return lista[0];
    return `${lista.length} seleccionadas`;
  }

  return (
    <CandidatoShell
      nombre={candidato ? `${candidato.nombres} ${candidato.apellidos}` : undefined}
      fotoUrl={candidato?.fotoUrl}
      pageTitle="Configuración"
      pageSubtitle="Administra tus preferencias, seguridad y cuenta"
    >
      <div className="settings-layout">
        {/* ============ COLUMNA IZQUIERDA ============ */}
        <div className="settings-col">
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><circle cx="10" cy="6.5" r="3" /><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" /></svg>
              Cuenta
            </h2>
            <div className="settings-card">
              <LinkRow label="Información de la cuenta" onClick={abrirInfoCuenta} />
              <LinkRow label="Correo y teléfono" onClick={abrirCorreoTelefono} />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><path d="M10 2.5l6.5 2.4v4.8c0 4-2.7 6.8-6.5 8.3-3.8-1.5-6.5-4.3-6.5-8.3V4.9z" /></svg>
              Seguridad
            </h2>
            <div className="settings-card">
              <LinkRow label="Cambiar contraseña" onClick={abrirCambiarContrasena} />
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
                <button className={"appearance-option" + (modo === "claro" ? " active" : "")} type="button" onClick={() => setModo("claro")}>
                  <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.4" /><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.8 4.8l1.4 1.4M13.8 13.8l1.4 1.4M4.8 15.2l1.4-1.4M13.8 6.2l1.4-1.4" /></svg>
                  Claro
                </button>
                <button className={"appearance-option" + (modo === "oscuro" ? " active" : "")} type="button" onClick={() => setModo("oscuro")}>
                  <svg viewBox="0 0 20 20"><path d="M16.5 12.3A6.8 6.8 0 017.7 3.5a7 7 0 108.8 8.8z" /></svg>
                  Oscuro
                </button>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.6" /><path d="M3.5 7h13M10 7v4M10 11l-3 6M10 11l3 6M6.5 9.5h7" /></svg>
              Accesibilidad
            </h2>
            <div className="settings-card">
              <ToggleRow label="Texto de alto contraste" checked={altoContraste} onChange={setAltoContraste} />
              <ToggleRow label="Reducir animaciones" checked={reducirAnim} onChange={setReducirAnim} />
              <ToggleRow label="Navegación con teclado" checked={navTeclado} onChange={setNavTeclado} />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><path d="M10 2.5a4 4 0 014 4v2.3c0 .9.3 1.8.9 2.5l.6.7H4.5l.6-.7c.6-.7.9-1.6.9-2.5V6.5a4 4 0 014-4z" /><path d="M8 16a2 2 0 004 0" /></svg>
              Notificaciones
            </h2>
            <div className="settings-card">
              <ToggleRow label="Nuevas ofertas recomendadas" checked={notifOfertas} onChange={setNotifOfertas} />
              <ToggleRow label="Recordatorios de postulaciones" checked={notifRecordatorios} onChange={setNotifRecordatorios} />
              <ToggleRow label="Cambio en la postulación" checked={notifCambios} onChange={setNotifCambios} />
            </div>
          </section>
        </div>

        {/* ============ COLUMNA DERECHA ============ */}
        <div className="settings-col">
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2" /><path d="M2.8 10h14.4M10 2.8c2 2 3 4.5 3 7.2s-1 5.2-3 7.2c-2-2-3-4.5-3-7.2s1-5.2 3-7.2z" /></svg>
              Idioma y Región
            </h2>
            <div className="settings-card settings-card-pad">
              <label className="settings-select-label">Idioma
                <select className="settings-select" value={idioma} onChange={(e) => { setIdioma(e.target.value); mostrarToast("Idioma actualizado. Recarga para ver los cambios."); }}>
                  <option>Español (Latinoamérica)</option>
                  <option>Español (España)</option>
                  <option>English (US)</option>
                  <option>Português (Brasil)</option>
                </select>
              </label>
              <label className="settings-select-label">Región
                <select className="settings-select" value={region} onChange={(e) => { setRegion(e.target.value); mostrarToast("Región actualizada."); }}>
                  <option>Colombia</option>
                  <option>México</option>
                  <option>Perú</option>
                  <option>Chile</option>
                  <option>Argentina</option>
                </select>
              </label>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><rect x="4.5" y="9" width="11" height="7.5" rx="1.4" /><path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" /></svg>
              Privacidad
            </h2>
            <div className="settings-card">
              <ToggleRow label="Mostrar mi perfil a empresas" checked={privPerfil} onChange={setPrivPerfil} />
              <ToggleRow label="Mostrar disponibilidad laboral" checked={privDisponibilidad} onChange={setPrivDisponibilidad} />
              <ToggleRow label="Ocultar salario esperado" checked={privSalario} onChange={setPrivSalario} />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10" rx="2" /><path d="M8 2.5v2.5M12 2.5v2.5M8 15v2.5M12 15v2.5M2.5 8H5M2.5 12H5M15 8h2.5M15 12h2.5" /></svg>
              Inteligencia Artificial
            </h2>
            <div className="settings-card">
              <ToggleRow label="Feedback con IA en el simulador de entrevistas" checked={iaSimulador} onChange={setIaSimulador} />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><rect x="3.5" y="3.5" width="13" height="13" rx="2" /><path d="M6.5 10.3l2 2 5-5" /></svg>
              Preferencias de Contenido
            </h2>
            <div className="settings-card">
              <LinkRow label="Tipos de empleo" value={resumenSeleccion(tiposEmpleoSeleccionados)} onClick={abrirTiposEmpleo} />
              <LinkRow label="Categorías de interés" value={resumenSeleccion(categoriasSeleccionadas)} onClick={abrirCategorias} />
              <LinkRow label="Empresas favoritas" value={resumenSeleccion(empresasFavSeleccionadas)} onClick={abrirEmpresasFav} />
            </div>
          </section>
        </div>
      </div>

      {/* ============ MODAL: Correo y teléfono ============ */}
      {modalCorreo && (
        <div className="cv-form-modal-backdrop" onClick={() => setModalCorreo(false)}>
          <div className="cv-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cv-form-modal-header">
              <h3>Correo y teléfono</h3>
              <button type="button" className="cv-form-modal-close" onClick={() => setModalCorreo(false)} aria-label="Cerrar">×</button>
            </div>
            <form onSubmit={guardarCorreoTelefono}>
              <div className="cv-form-modal-body">
                <label className="cv-form-field">
                  Correo electrónico
                  <input type="email" value={formCorreo.correo} onChange={(e) => setFormCorreo({ ...formCorreo, correo: e.target.value })} placeholder="tucorreo@ejemplo.com" autoFocus />
                </label>
                <label className="cv-form-field">
                  Teléfono
                  <input type="tel" value={formCorreo.telefono} onChange={(e) => setFormCorreo({ ...formCorreo, telefono: formatearTelefonoCO(e.target.value) })} placeholder="+57 300 000 0000" />
                </label>
              </div>
              <div className="cv-form-modal-footer">
                <button type="button" className="btn-cancel-edit" onClick={() => setModalCorreo(false)} disabled={guardandoCorreo}>Cancelar</button>
                <button type="submit" className="cv-btn-solid" disabled={guardandoCorreo}>{guardandoCorreo ? "Guardando..." : "Guardar cambios"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ MODAL: Cambiar contraseña ============ */}
      {modalContrasena && (
        <div className="cv-form-modal-backdrop" onClick={() => !guardandoContrasena && setModalContrasena(false)}>
          <div className="cv-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cv-form-modal-header">
              <h3>Cambiar contraseña</h3>
              <button type="button" className="cv-form-modal-close" onClick={() => setModalContrasena(false)} aria-label="Cerrar" disabled={guardandoContrasena}>×</button>
            </div>
            <form onSubmit={guardarContrasena} noValidate>
              <div className="cv-form-modal-body">
                <div className="cv-form-field">
                  <label>Contraseña actual</label>
                  <input type="password" value={formContrasena.actual} onChange={(e) => { setFormContrasena({ ...formContrasena, actual: e.target.value }); if (erroresContrasena.actual) setErroresContrasena({ ...erroresContrasena, actual: undefined }); }} placeholder="Tu contraseña actual" className={erroresContrasena.actual ? "input-error" : ""} disabled={guardandoContrasena} autoFocus />
                  {erroresContrasena.actual && <span className="form-error-msg">{erroresContrasena.actual}</span>}
                </div>

                <div className="cv-form-field">
                  <label>Nueva contraseña</label>
                  <input type="password" value={formContrasena.nueva} onChange={(e) => { setFormContrasena({ ...formContrasena, nueva: e.target.value }); if (erroresContrasena.nueva) setErroresContrasena({ ...erroresContrasena, nueva: undefined }); }} placeholder="Mínimo 8 caracteres" className={erroresContrasena.nueva ? "input-error" : ""} disabled={guardandoContrasena} />
                  {erroresContrasena.nueva ? (
                    <span className="form-error-msg">{erroresContrasena.nueva}</span>
                  ) : formContrasena.nueva.length > 0 && formContrasena.nueva.length < 8 ? (
                    <span className="form-hint-msg">Faltan {8 - formContrasena.nueva.length} caracteres</span>
                  ) : formContrasena.nueva.length >= 8 ? (
                    <span className="form-success-msg">✓ Longitud adecuada</span>
                  ) : null}
                </div>

                <div className="cv-form-field">
                  <label>Confirmar nueva contraseña</label>
                  <input type="password" value={formContrasena.confirmar} onChange={(e) => { setFormContrasena({ ...formContrasena, confirmar: e.target.value }); if (erroresContrasena.confirmar) setErroresContrasena({ ...erroresContrasena, confirmar: undefined }); }} placeholder="Repite la nueva contraseña" className={erroresContrasena.confirmar ? "input-error" : ""} disabled={guardandoContrasena} />
                  {erroresContrasena.confirmar ? (
                    <span className="form-error-msg">{erroresContrasena.confirmar}</span>
                  ) : formContrasena.confirmar.length > 0 && formContrasena.nueva.length > 0 && formContrasena.confirmar === formContrasena.nueva ? (
                    <span className="form-success-msg">✓ Las contraseñas coinciden</span>
                  ) : formContrasena.confirmar.length > 0 && formContrasena.nueva.length > 0 && formContrasena.confirmar !== formContrasena.nueva ? (
                    <span className="form-hint-msg">Las contraseñas aún no coinciden</span>
                  ) : null}
                </div>
              </div>
              <div className="cv-form-modal-footer">
                <button type="button" className="btn-cancel-edit" onClick={() => setModalContrasena(false)} disabled={guardandoContrasena}>Cancelar</button>
                <button type="submit" className="cv-btn-solid" disabled={guardandoContrasena}>{guardandoContrasena ? "Cambiando..." : "Cambiar contraseña"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ MODAL: Información de la cuenta ============ */}
      {modalInfoCuenta && candidato && (
        <div className="cv-form-modal-backdrop" onClick={() => setModalInfoCuenta(false)}>
          <div className="cv-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cv-form-modal-header">
              <h3>Información de la cuenta</h3>
              <button type="button" className="cv-form-modal-close" onClick={() => setModalInfoCuenta(false)} aria-label="Cerrar">×</button>
            </div>
            <div className="cv-form-modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div className="cuenta-info-row"><span className="cuenta-info-label">Nombre completo</span><span className="cuenta-info-value">{candidato.nombres} {candidato.apellidos}</span></div>
                <div className="cuenta-info-row"><span className="cuenta-info-label">Correo electrónico</span><span className="cuenta-info-value">{candidato.correo}</span></div>
                <div className="cuenta-info-row"><span className="cuenta-info-label">Teléfono</span><span className="cuenta-info-value">{candidato.telefono || "Sin registrar"}</span></div>
                <div className="cuenta-info-row"><span className="cuenta-info-label">Ciudad</span><span className="cuenta-info-value">{candidato.ciudad || "Sin registrar"}</span></div>
                <div className="cuenta-info-row"><span className="cuenta-info-label">Tipo de cuenta</span><span className="cuenta-info-value">Candidato</span></div>
              </div>
            </div>
            <div className="cv-form-modal-footer">
              <button type="button" className="cv-btn-solid" onClick={() => setModalInfoCuenta(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2FA REAL  */}
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

      {/* ============ MODALES: Preferencias ============ */}
      {modalTiposEmpleo && (
        <div className="cv-form-modal-backdrop" onClick={() => setModalTiposEmpleo(false)}>
          <div className="cv-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cv-form-modal-header"><h3>Tipos de empleo</h3><button type="button" className="cv-form-modal-close" onClick={() => setModalTiposEmpleo(false)}>×</button></div>
            <div className="cv-form-modal-body">
              <p className="pref-modal-sub">Selecciona los tipos de empleo que te interesan.</p>
              <div className="pref-options-list">
                {TIPOS_EMPLEO.map((tipo) => (
                  <label key={tipo} className="pref-option">
                    <input type="checkbox" checked={tiposEmpleoSeleccionados.includes(tipo)} onChange={() => toggleSeleccion(tiposEmpleoSeleccionados, tipo, setTiposEmpleoSeleccionados)} />
                    <span>{tipo}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="cv-form-modal-footer">
              <button type="button" className="btn-cancel-edit" onClick={() => setModalTiposEmpleo(false)}>Cerrar</button>
              <button type="button" className="cv-btn-solid" onClick={() => { setModalTiposEmpleo(false); mostrarToast("Preferencias guardadas"); }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {modalCategorias && (
        <div className="cv-form-modal-backdrop" onClick={() => setModalCategorias(false)}>
          <div className="cv-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cv-form-modal-header"><h3>Categorías de interés</h3><button type="button" className="cv-form-modal-close" onClick={() => setModalCategorias(false)}>×</button></div>
            <div className="cv-form-modal-body">
              <p className="pref-modal-sub">Selecciona las áreas en las que te gustaría trabajar.</p>
              <div className="pref-options-list">
                {CATEGORIAS_INTERES.map((cat) => (
                  <label key={cat} className="pref-option">
                    <input type="checkbox" checked={categoriasSeleccionadas.includes(cat)} onChange={() => toggleSeleccion(categoriasSeleccionadas, cat, setCategoriasSeleccionadas)} />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="cv-form-modal-footer">
              <button type="button" className="btn-cancel-edit" onClick={() => setModalCategorias(false)}>Cerrar</button>
              <button type="button" className="cv-btn-solid" onClick={() => { setModalCategorias(false); mostrarToast("Preferencias guardadas"); }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {modalEmpresasFav && (
        <div className="cv-form-modal-backdrop" onClick={() => setModalEmpresasFav(false)}>
          <div className="cv-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cv-form-modal-header"><h3>Empresas favoritas</h3><button type="button" className="cv-form-modal-close" onClick={() => setModalEmpresasFav(false)}>×</button></div>
            <div className="cv-form-modal-body">
              <p className="pref-modal-sub">Guarda las empresas que te interesan.</p>
              <div className="pref-options-list">
                {EMPRESAS_DISPONIBLES.map((emp) => (
                  <label key={emp} className="pref-option">
                    <input type="checkbox" checked={empresasFavSeleccionadas.includes(emp)} onChange={() => toggleSeleccion(empresasFavSeleccionadas, emp, setEmpresasFavSeleccionadas)} />
                    <span>{emp}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="cv-form-modal-footer">
              <button type="button" className="btn-cancel-edit" onClick={() => setModalEmpresasFav(false)}>Cerrar</button>
              <button type="button" className="cv-btn-solid" onClick={() => { setModalEmpresasFav(false); mostrarToast("Preferencias guardadas"); }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="sw-toast show">{toast}</div>}
    </CandidatoShell>
  );
}