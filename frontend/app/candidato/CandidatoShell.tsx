"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { avatarColorFromName } from "../lib/avatarColor";

const NAV_ITEMS = [
  { href: "/candidato/inicio", label: "Inicio", icon: <><path d="M3 8.5L10 3l7 5.5"/><path d="M5 8v8h10V8"/></> },
  { href: "/candidato/perfil", label: "Perfil", icon: <><circle cx="10" cy="6.5" r="3"/><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5"/></> },
  { href: "/candidato/mi-cv", label: "Mi CV", icon: <><path d="M6 2.5h6l3 3v12H6z"/><path d="M9 8h4M9 11h4M9 14h2"/></> },
  { href: "/candidato/vacantes", label: "Vacantes", icon: <><rect x="2.5" y="7" width="15" height="9" rx="1.5"/><path d="M7 7V5.5A1.5 1.5 0 018.5 4h3A1.5 1.5 0 0113 5.5V7"/></> },
  { href: "/candidato/postulaciones", label: "Mis postulaciones", icon: <><rect x="4" y="3.5" width="12" height="14" rx="1.5"/><rect x="7" y="2" width="6" height="3" rx="1"/><path d="M7 9h6M7 12h6M7 15h4"/></> },
  { href: "/candidato/consejos", label: "Consejos", icon: <><path d="M10 2.5a5 5 0 00-3 9c.5.4.8 1 .8 1.6v1h4.4v-1c0-.6.3-1.2.8-1.6a5 5 0 00-3-9z"/><path d="M8.3 17h3.4"/></> },
  { href: "/candidato/simulador", label: "Simulador", icon: <><path d="M3 4.5h14v8H8l-3 3v-3H3z"/></> },
  { href: "/candidato/configuracion", label: "Configuración", icon: <><circle cx="10" cy="10" r="2.6"/><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.3 5.3l1.4 1.4M13.3 13.3l1.4 1.4M5.3 14.7l1.4-1.4M13.3 6.7l1.4-1.4"/></> },
];

const NOTIFICACIONES = [
  { icon: "💼", color: "blue", titulo: "Nueva vacante recomendada", texto: "Desarrollador Frontend Junior", hace: "Hace 10 min" },
  { icon: "👁️", color: "green", titulo: "Postulación vista", texto: "Auxiliar de Desarrollo de Software", hace: "Hace 2 horas" },
  { icon: "⏳", color: "yellow", titulo: "Proceso actualizado", texto: "Analista de Sistemas", hace: "Ayer" },
  { icon: "🎤", color: "purple", titulo: "Entrevista programada", texto: "Empresa Innovatech", hace: "Hace 1 día" },
];

export default function CandidatoShell({
  children,
  nombre,
  fotoUrl,
  pageTitle,
  pageSubtitle,
}: {
  children: React.ReactNode;
  nombre?: string;
  fotoUrl?: string | null;
  pageTitle: string;
  pageSubtitle: string;
}) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const iniciales = nombre ? nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() : "";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <svg className="logo-icon" viewBox="0 0 24 24">
            <path d="M12 21c0-5 0-8 0-10"/><path d="M12 11c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 14c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5z"/>
          </svg>
          <div className="logo-text">
            <strong><span className="logo-seed">Seed</span><span className="logo-work">Work</span></strong>
            <span>Tu próximo empleo, tu futuro</span>
          </div>
        </div>
        <nav className="nav-list">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={"nav-item" + (pathname === item.href ? " active" : "")}>
              <svg viewBox="0 0 20 20">{item.icon}</svg>
              <span className="label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="nav-footer">
          <Link href="/login" className="nav-item">
            <svg viewBox="0 0 20 20"><path d="M8 4H4.5A1.5 1.5 0 003 5.5v9A1.5 1.5 0 004.5 16H8"/><path d="M12 10h5.5M15 7l3 3-3 3"/></svg>
            <span className="label">Cerrar sesión</span>
          </Link>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="page-title">
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>

          <div className="header-actions">
            <div className="notification-wrapper">
              <button className="icon-btn" onClick={() => setNotifOpen((o) => !o)} aria-label="Notificaciones">
                <svg viewBox="0 0 20 20"><path d="M10 2.5a4 4 0 014 4v2.3c0 .9.3 1.8.9 2.5l.6.7H4.5l.6-.7c.6-.7.9-1.6.9-2.5V6.5a4 4 0 014-4z"/><path d="M8 16a2 2 0 004 0"/></svg>
              </button>
              <div className={"notification-dropdown" + (notifOpen ? " show" : "")}>
                <div className="notification-title">
                  <h3>Notificaciones</h3>
                  <span>{NOTIFICACIONES.length} nuevas</span>
                </div>
                {NOTIFICACIONES.map((n, i) => (
                  <div className="notification-item" key={i}>
                    <div className={"notification-icon " + n.color}>{n.icon}</div>
                    <div className="notification-info">
                      <strong>{n.titulo}</strong>
                      <p>{n.texto}</p>
                      <small>{n.hace}</small>
                    </div>
                  </div>
                ))}
                <button className="view-all-btn">Ver todas las notificaciones</button>
              </div>
            </div>

            <div className="user-chip">
              <div
                className="avatar"
                style={
                  fotoUrl
                    ? { padding: 0, overflow: "hidden" }
                    : nombre
                    ? { backgroundColor: avatarColorFromName(nombre), color: "#fff" }
                    : { background: "#e5e7eb" }
                }
              >
                {fotoUrl ? (
                  <img src={fotoUrl} alt={nombre || ""} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }} />
                ) : (
                  iniciales
                )}
              </div>
              <div className="user-meta"><strong>{nombre || ""}</strong></div>
            </div>
          </div>
        </header>

        <div className="content-wrap">{children}</div>
      </div>
    </div>
  );
}