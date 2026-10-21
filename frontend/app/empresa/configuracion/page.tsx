"use client";

import { useState } from "react";
import EmpresaShell from "../EmpresaShell";
import { useAuth } from "@/app/lib/auth-context";
import { useLocalSetting } from "@/app/lib/useSettings";
import { useTheme } from "@/app/lib/useTheme"; 

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
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

function LinkRow({ label }: { label: string }) {
  return (
    <button className="settings-row-link" type="button" onClick={(e) => e.preventDefault()}>
      {label}
      <svg viewBox="0 0 20 20"><path d="M7.5 5l5 5-5 5" /></svg>
    </button>
  );
}

export default function ConfiguracionEmpresaPage() {
  const { user } = useAuth();
  const { theme: modo, setTheme: setModo } = useTheme(); // O usa un hook específico para empresa si lo tienes

  // Estados locales (puedes guardarlos en BD después)
  const [twoFA, setTwoFA] = useLocalSetting("empresa:seguridad:2fa", false);
  
  // Privacidad
  const [privPerfil, setPrivPerfil] = useLocalSetting("empresa:priv:perfil", true);
  const [privEmpleados, setPrivEmpleados] = useLocalSetting("empresa:priv:empleados", true);
  const [privDatos, setPrivDatos] = useLocalSetting("empresa:priv:datos", true);
  const [privOfertas, setPrivOfertas] = useLocalSetting("empresa:priv:ofertas", true);

  // Notificaciones
  const [notifCandidatos, setNotifCandidatos] = useLocalSetting("empresa:notif:candidatos", true);
  const [notifDestacadas, setNotifDestacadas] = useLocalSetting("empresa:notif:destacadas", false);
  const [notifSeguimiento, setNotifSeguimiento] = useLocalSetting("empresa:notif:seguimiento", true);
  const [notifNovedades, setNotifNovedades] = useLocalSetting("empresa:notif:novedades", false);

  // Accesibilidad
  const [altoContraste, setAltoContraste] = useLocalSetting("empresa:accesibilidad:contraste", false);
  const [reducirAnim, setReducirAnim] = useLocalSetting("empresa:accesibilidad:reducirAnim", false);
  const [navTeclado, setNavTeclado] = useLocalSetting("empresa:accesibilidad:navTeclado", true);

  // Idioma
  const [idioma, setIdioma] = useLocalSetting("empresa:idioma", "Español (Latinoamérica)");
  const [region, setRegion] = useLocalSetting("empresa:region", "Colombia");

  return (
    <EmpresaShell pageTitle="Configuración" pageSubtitle="Administra tus preferencias, seguridad y demás opciones de tu cuenta">
      <div className="settings-layout">
        {/* COLUMNA IZQUIERDA */}
        <div className="settings-col">
          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><circle cx="10" cy="6.5" r="3"/><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5"/></svg>Información General</h2>
            <div className="settings-card">
              <LinkRow label="Nombre de la empresa" />
              <LinkRow label="Información de contacto" />
              <LinkRow label="Ubicación" />
              <LinkRow label="Sector y tamaño de la empresa" />
              <LinkRow label="Zona horaria" />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><path d="M10 2.5l6.5 2.4v4.8c0 4-2.7 6.8-6.5 8.3-3.8-1.5-6.5-4.3-6.5-8.3V4.9z"/></svg>Seguridad</h2>
            <div className="settings-card">
              <LinkRow label="Cambiar contraseña" />
              <ToggleRow label="Verificación en dos pasos" checked={twoFA} onChange={setTwoFA} />
              <LinkRow label="Correo administrador" />
              <LinkRow label="Sesiones activas" />
              <LinkRow label="Historial de accesos" />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.6"/><path d="M3.5 7h13M10 7v4M10 11l-3 6M10 11l3 6M6.5 9.5h7"/></svg>Accesibilidad</h2>
            <div className="settings-card">
              <ToggleRow label="Texto de alto contraste" checked={altoContraste} onChange={setAltoContraste} />
              <ToggleRow label="Reducir animaciones" checked={reducirAnim} onChange={setReducirAnim} />
              <ToggleRow label="Navegación con teclado" checked={navTeclado} onChange={setNavTeclado} />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><path d="M13.5 3.5l3 3L7 16H4v-3z"/></svg>Apariencia</h2>
            <div className="settings-card settings-card-pad">
              <p className="settings-field-label">Modo de visualización</p>
              <div className="appearance-toggle">
                <button className={"appearance-option" + (modo === "claro" ? " active" : "")} type="button" onClick={() => setModo("claro")}>
                  <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.4"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.8 4.8l1.4 1.4M13.8 13.8l1.4 1.4M4.8 15.2l1.4-1.4M13.8 6.2l1.4-1.4"/></svg>
                  Claro
                </button>
                <button className={"appearance-option" + (modo === "oscuro" ? " active" : "")} type="button" onClick={() => setModo("oscuro")}>
                  <svg viewBox="0 0 20 20"><path d="M16.5 12.3A6.8 6.8 0 017.7 3.5a7 7 0 108.8 8.8z"/></svg>
                  Oscuro
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="settings-col">
          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><rect x="4.5" y="9" width="11" height="7.5" rx="1.4"/><path d="M6.5 9V6.5a3.5 3.5 0 017 0V9"/></svg>Privacidad</h2>
            <div className="settings-card">
              <ToggleRow label="Mostrar mi empresa públicamente" checked={privPerfil} onChange={setPrivPerfil} />
              <ToggleRow label="Mostrar empleados y tamaño de empresa" checked={privEmpleados} onChange={setPrivEmpleados} />
              <ToggleRow label="Permitir que SeedWork use sus datos" checked={privDatos} onChange={setPrivDatos} />
              <ToggleRow label="Ocultar mis ofertas al finalizar" checked={privOfertas} onChange={setPrivOfertas} />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><path d="M10 2.5a4 4 0 014 4v2.3c0 .9.3 1.8.9 2.5l.6.7H4.5l.6-.7c.6-.7.9-1.6.9-2.5V6.5a4 4 0 014-4z"/><path d="M8 16a2 2 0 004 0"/></svg>Notificaciones</h2>
            <div className="settings-card">
              <ToggleRow label="Nuevos candidatos a mis ofertas" checked={notifCandidatos} onChange={setNotifCandidatos} />
              <ToggleRow label="Aplicaciones destacadas" checked={notifDestacadas} onChange={setNotifDestacadas} />
              <ToggleRow label="Recordatorio de seguimiento" checked={notifSeguimiento} onChange={setNotifSeguimiento} />
              <ToggleRow label="Novedades de SeedWork" checked={notifNovedades} onChange={setNotifNovedades} />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><ellipse cx="10" cy="5" rx="6.5" ry="2.3"/><path d="M3.5 5v10c0 1.3 2.9 2.3 6.5 2.3s6.5-1 6.5-2.3V5"/><path d="M3.5 10c0 1.3 2.9 2.3 6.5 2.3s6.5-1 6.5-2.3"/></svg>Datos de la Cuenta</h2>
            <div className="settings-card settings-card-pad">
              <div className="pref-list">
                <div className="pref-row"><span className="k">Ofertas publicadas</span><span className="v">20</span></div>
                <div className="pref-row"><span className="k">Candidatos contactados</span><span className="v">12</span></div>
                <div className="pref-row"><span className="k">Próxima renovación</span><span className="v">20 de Junio de 2026</span></div>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2"/><path d="M2.8 10h14.4M10 2.8c2 2 3 4.5 3 7.2s-1 5.2-3 7.2c-2-2-3-4.5-3-7.2s1-5.2 3-7.2z"/></svg>Idioma y Región</h2>
            <div className="settings-card settings-card-pad">
              <label className="settings-select-label">Idioma
                <select className="settings-select" value={idioma} onChange={(e) => setIdioma(e.target.value)}>
                  <option>Español (Latinoamérica)</option>
                  <option>Español (España)</option>
                  <option>English (US)</option>
                  <option>Português (Brasil)</option>
                </select>
              </label>
              <label className="settings-select-label">Región
                <select className="settings-select" value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option>Colombia</option>
                  <option>México</option>
                  <option>Perú</option>
                  <option>Chile</option>
                  <option>Argentina</option>
                </select>
              </label>
            </div>
          </section>
        </div>
      </div>
    </EmpresaShell>
  );
}