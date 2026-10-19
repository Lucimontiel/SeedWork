"use client";

import { useState } from "react";
import EmpresaShell from "../EmpresaShell";

type ToggleProps = {
  label: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
};

function Toggle({ label, defaultChecked = false, onChange }: ToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="settings-row-toggle">
      <span>{label}</span>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
            onChange?.(e.target.checked);
          }}
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
  const [modo, setModo] = useState<"light" | "dark">("light");

  return (
    <EmpresaShell
      pageTitle="Configuración"
      pageSubtitle="Administra tus preferencias, seguridad y demás opciones de tu cuenta"
    >
      <div className="settings-layout">
        {/* COLUMNA IZQUIERDA */}
        <div className="settings-col">
          {/* Información General */}
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><circle cx="10" cy="6.5" r="3" /><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" /></svg>
              Información General
            </h2>
            <div className="settings-card">
              <RowLink label="Nombre de la empresa" />
              <RowLink label="Información de contacto" />
              <RowLink label="Ubicación" />
              <RowLink label="Sector y tamaño de la empresa" />
              <RowLink label="Zona horaria" />
            </div>
          </section>

          {/* Seguridad */}
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><path d="M10 2.5l6.5 2.4v4.8c0 4-2.7 6.8-6.5 8.3-3.8-1.5-6.5-4.3-6.5-8.3V4.9z" /></svg>
              Seguridad
            </h2>
            <div className="settings-card">
              <RowLink label="Cambiar contraseña" />
              <Toggle label="Verificación en dos pasos" />
              <RowLink label="Correo administrador" />
              <RowLink label="Sesiones activas" />
              <RowLink label="Historial de accesos" />
            </div>
          </section>

          {/* Accesibilidad */}
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.6" /><path d="M3.5 7h13M10 7v4M10 11l-3 6M10 11l3 6M6.5 9.5h7" /></svg>
              Accesibilidad
            </h2>
            <div className="settings-card">
              <Toggle label="Texto de alto contraste" />
              <Toggle label="Reducir animaciones" />
              <Toggle label="Navegación con teclado" defaultChecked />
            </div>
          </section>

          {/* Apariencia */}
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
          {/* Privacidad */}
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><rect x="4.5" y="9" width="11" height="7.5" rx="1.4" /><path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" /></svg>
              Privacidad
            </h2>
            <div className="settings-card">
              <Toggle label="Mostrar mi empresa públicamente" defaultChecked />
              <Toggle label="Mostrar empleados y tamaño de empresa" defaultChecked />
              <Toggle label="Permitir que SeedWork use sus datos" defaultChecked />
              <Toggle label="Ocultar mis ofertas al finalizar" defaultChecked />
            </div>
          </section>

          {/* Notificaciones */}
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><path d="M10 2.5a4 4 0 014 4v2.3c0 .9.3 1.8.9 2.5l.6.7H4.5l.6-.7c.6-.7.9-1.6.9-2.5V6.5a4 4 0 014-4z" /><path d="M8 16a2 2 0 004 0" /></svg>
              Notificaciones
            </h2>
            <div className="settings-card">
              <Toggle label="Nuevos candidatos a mis ofertas" defaultChecked />
              <Toggle label="Aplicaciones destacadas" />
              <Toggle label="Recordatorio de seguimiento" defaultChecked />
              <Toggle label="Novedades de SeedWork" />
            </div>
          </section>

          {/* Datos de la Cuenta */}
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><ellipse cx="10" cy="5" rx="6.5" ry="2.3" /><path d="M3.5 5v10c0 1.3 2.9 2.3 6.5 2.3s6.5-1 6.5-2.3V5" /><path d="M3.5 10c0 1.3 2.9 2.3 6.5 2.3s6.5-1 6.5-2.3" /></svg>
              Datos de la Cuenta
            </h2>
            <div className="settings-card settings-card-pad">
              <div className="pref-list">
                <div className="pref-row"><span className="k">Ofertas publicadas</span><span className="v">—</span></div>
                <div className="pref-row"><span className="k">Candidatos contactados</span><span className="v">—</span></div>
                <div className="pref-row"><span className="k">Próxima renovación</span><span className="v">—</span></div>
              </div>
            </div>
          </section>

          {/* Idioma y Región */}
          <section className="settings-section">
            <h2 className="settings-title">
              <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2" /><path d="M2.8 10h14.4M10 2.8c2 2 3 4.5 3 7.2s-1 5.2-3 7.2c-2-2-3-4.5-3-7.2s1-5.2 3-7.2z" /></svg>
              Idioma y Región
            </h2>
            <div className="settings-card settings-card-pad">
              <label className="settings-select-label">
                Idioma
                <select className="settings-select" defaultValue="es-CO">
                  <option value="es-CO">Español (Latinoamérica)</option>
                  <option value="es-ES">Español (España)</option>
                  <option value="en-US">English (US)</option>
                  <option value="pt-BR">Português (Brasil)</option>
                </select>
              </label>
              <label className="settings-select-label">
                Región
                <select className="settings-select" defaultValue="CO">
                  <option value="CO">Colombia</option>
                  <option value="MX">México</option>
                  <option value="PE">Perú</option>
                  <option value="CL">Chile</option>
                  <option value="AR">Argentina</option>
                </select>
              </label>
            </div>
          </section>
        </div>
      </div>
    </EmpresaShell>
  );
}