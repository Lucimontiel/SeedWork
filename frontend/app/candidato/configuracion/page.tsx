"use client";

import { useState } from "react";
import CandidatoShell from "../CandidatoShell";
import { useCandidato } from "../../lib/useCandidato";

function ToggleRow({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="settings-row-toggle">
      <span>{label}</span>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span className="switch-slider" />
      </label>
    </div>
  );
}

function LinkRow({ label, value }: { label: string; value?: string }) {
  return (
    <button className="settings-row-link" type="button" onClick={(e) => e.preventDefault()}>
      {label}
      {value && <span className="settings-row-value">{value}</span>}
      <svg viewBox="0 0 20 20"><path d="M7.5 5l5 5-5 5" /></svg>
    </button>
  );
}

export default function ConfiguracionPage() {
  const { candidato } = useCandidato();
  const [modo, setModo] = useState<"claro" | "oscuro">("claro");
  const [toast, setToast] = useState<string | null>(null);

  function cerrarTodasLasSesiones() {
    setToast("Se cerraron todas las demás sesiones");
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <CandidatoShell
      nombre={candidato ? `${candidato.nombres} ${candidato.apellidos}` : undefined}
      pageTitle="Configuración"
      pageSubtitle="Administra tus preferencias, seguridad y cuenta"
    >
      <div className="settings-layout">
        <div className="settings-col">
          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><circle cx="10" cy="6.5" r="3" /><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" /></svg>Cuenta</h2>
            <div className="settings-card">
              <LinkRow label="Información de la cuenta" />
              <LinkRow label="Correo y teléfono" />
              <LinkRow label="Cerrar sesión en todas partes" />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><path d="M10 2.5l6.5 2.4v4.8c0 4-2.7 6.8-6.5 8.3-3.8-1.5-6.5-4.3-6.5-8.3V4.9z" /></svg>Seguridad</h2>
            <div className="settings-card">
              <LinkRow label="Cambiar contraseña" />
              <ToggleRow label="Verificación en dos pasos" />
              <LinkRow label="Preguntas de seguridad" />
              <LinkRow label="Dispositivos y sesiones" />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><path d="M13.5 3.5l3 3L7 16H4v-3z" /></svg>Apariencia</h2>
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
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.6" /><path d="M3.5 7h13M10 7v4M10 11l-3 6M10 11l3 6M6.5 9.5h7" /></svg>Accesibilidad</h2>
            <div className="settings-card">
              <ToggleRow label="Texto de alto contraste" />
              <ToggleRow label="Reducir animaciones" />
              <ToggleRow label="Navegación con teclado" defaultChecked />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><rect x="2.5" y="4" width="15" height="9.5" rx="1.4" /><path d="M7 17h6M10 13.5V17" /></svg>Dispositivos Conectados</h2>
            <div className="settings-card settings-card-pad">
              <div className="device-row">
                <div className="device-icon"><svg viewBox="0 0 20 20"><rect x="2.5" y="4" width="15" height="9.5" rx="1.4" /><path d="M7 17h6M10 13.5V17" /></svg></div>
                <div className="device-info">
                  <strong>Windows PC</strong>
                  <span>Bogotá, Colombia · <em>Este dispositivo</em></span>
                </div>
                <span className="device-status-dot" aria-label="Activo" />
              </div>
              <div className="device-row">
                <div className="device-icon"><svg viewBox="0 0 20 20"><rect x="6" y="2.5" width="8" height="15" rx="1.4" /><path d="M9 15h2" /></svg></div>
                <div className="device-info">
                  <strong>Samsung Galaxy S23</strong>
                  <span>Medellín, Colombia · Hace 2 horas</span>
                </div>
                <button className="device-menu-btn" type="button" aria-label="Más opciones">⋮</button>
              </div>
              <div className="device-row">
                <div className="device-icon"><svg viewBox="0 0 20 20"><rect x="4" y="2.5" width="12" height="15" rx="1.4" /><path d="M9 15h2" /></svg></div>
                <div className="device-info">
                  <strong>iPad Air</strong>
                  <span>Bogotá, Colombia · Hace 1 día</span>
                </div>
                <button className="device-menu-btn" type="button" aria-label="Más opciones">⋮</button>
              </div>
              <a href="#" className="settings-view-all" onClick={(e) => e.preventDefault()}>
                Ver todos los dispositivos <svg viewBox="0 0 20 20"><path d="M7.5 5l5 5-5 5" /></svg>
              </a>
              <button className="btn-danger-outline" type="button" onClick={cerrarTodasLasSesiones}>Cerrar todas las sesiones</button>
            </div>
          </section>
        </div>

        <div className="settings-col">
          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2" /><path d="M2.8 10h14.4M10 2.8c2 2 3 4.5 3 7.2s-1 5.2-3 7.2c-2-2-3-4.5-3-7.2s1-5.2 3-7.2z" /></svg>Idioma y Región</h2>
            <div className="settings-card settings-card-pad">
              <label className="settings-select-label">Idioma
                <select className="settings-select" defaultValue="Español (Latinoamérica)">
                  <option>Español (Latinoamérica)</option>
                  <option>Español (España)</option>
                  <option>English (US)</option>
                  <option>Português (Brasil)</option>
                </select>
              </label>
              <label className="settings-select-label">Región
                <select className="settings-select" defaultValue="Colombia">
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
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><rect x="4.5" y="9" width="11" height="7.5" rx="1.4" /><path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" /></svg>Privacidad</h2>
            <div className="settings-card">
              <ToggleRow label="Mostrar mi perfil a empresas" defaultChecked />
              <ToggleRow label="Mostrar disponibilidad laboral" defaultChecked />
              <ToggleRow label="Permitir recomendaciones IA" defaultChecked />
              <ToggleRow label="Ocultar salario esperado" />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10" rx="2" /><path d="M8 2.5v2.5M12 2.5v2.5M8 15v2.5M12 15v2.5M2.5 8H5M2.5 12H5M15 8h2.5M15 12h2.5" /></svg>IA y Recomendaciones</h2>
            <div className="settings-card">
              <ToggleRow label="Recomendaciones de ofertas" defaultChecked />
              <ToggleRow label="Sugerencia de habilidades" defaultChecked />
              <ToggleRow label="Simulaciones de entrevistas" defaultChecked />
              <ToggleRow label="Análisis de mi perfil" defaultChecked />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><path d="M10 2.5a4 4 0 014 4v2.3c0 .9.3 1.8.9 2.5l.6.7H4.5l.6-.7c.6-.7.9-1.6.9-2.5V6.5a4 4 0 014-4z" /><path d="M8 16a2 2 0 004 0" /></svg>Notificaciones</h2>
            <div className="settings-card">
              <ToggleRow label="Nuevas ofertas recomendadas" defaultChecked />
              <ToggleRow label="Recordatorios de postulaciones" defaultChecked />
              <ToggleRow label="Cambio en la postulación" defaultChecked />
            </div>
          </section>

          <section className="settings-section">
            <h2 className="settings-title"><svg viewBox="0 0 20 20"><rect x="3.5" y="3.5" width="13" height="13" rx="2" /><path d="M6.5 10.3l2 2 5-5" /></svg>Preferencias de Contenido</h2>
            <div className="settings-card">
              <LinkRow label="Tipos de empleo" value="Todos" />
              <LinkRow label="Categorías de interés" value="5 seleccionadas" />
              <LinkRow label="Empresas favoritas" value="3 seleccionadas" />
            </div>
          </section>
        </div>
      </div>

      {toast && <div className="sw-toast show">{toast}</div>}
    </CandidatoShell>
  );
}