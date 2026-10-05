"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";

const NAV_ITEMS = [
  { href: "/administrador/inicio", label: "Inicio", icon: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></> },
  { href: "/administrador/usuarios", label: "Usuarios", icon: <><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4.5c1.8.4 3 2 3 3.9 0 1.9-1.2 3.5-3 3.9"/><path d="M19.5 14.5c1.8.5 2.9 1.9 3 3.9"/></> },
  { href: "/administrador/vacantes", label: "Vacantes", icon: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></> },
  { href: "/administrador/postulaciones", label: "Postulaciones", icon: <><path d="M9 12h6M9 16h6M9 8h1"/><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/></> },
  { href: "/administrador/reportes", label: "Reportes", icon: <><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></> },
  { href: "/administrador/notificaciones", label: "Notificaciones", icon: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></> },
  { href: "/administrador/configuracion", label: "Configuración", icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></> },
];

const NOTIFICACIONES = [
  { icon: "📥", color: "blue", titulo: "Nueva vacante enviada", texto: "Data Up · Analista de Datos Jr.", hace: "Hace 12 min" },
  { icon: "🏢", color: "green", titulo: "Solicitud de verificación", texto: "TechStart Solutions", hace: "Hace 1 hora" },
  { icon: "⚠️", color: "yellow", titulo: "Se abrió el reporte #0231", texto: "Vacante reportada como engañosa", hace: "Ayer" },
];

export default function AdministradorShell({
  children,
  pageTitle,
  pageSubtitle,
}: {
  children: React.ReactNode;
  pageTitle: string;
  pageSubtitle: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, cargando: cargandoAuth, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  // Protección: solo admin
  useEffect(() => {
    if (cargandoAuth) return;

    if (!user) {
      router.replace("/administrador/login");
      return;
    }

    if (user.tipo !== "administrador") {
      if (user.tipo === "candidato") router.replace("/candidato/inicio");
      else if (user.tipo === "empresa") router.replace("/empresa/inicio");
      else router.replace("/administrador/login");
    }
  }, [user, cargandoAuth, router]);

  if (cargandoAuth) {
    return (
      <div className="app-shell">
        <div className="main-area">
          <div className="content-wrap" style={{ padding: 40, textAlign: "center" }}>
            Cargando...
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.tipo !== "administrador") {
    return null;
  }

  // Iniciales del usuario logueado
  const iniciales = user.correo
    .split("@")[0]
    .split(/[._-]/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "AD";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <svg className="logo-icon" viewBox="0 0 24 24">
            <path d="M12 21c0-5 0-8 0-10"/><path d="M12 11c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 14c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5z"/>
          </svg>
          <div className="logo-text">
            <strong><span className="logo-seed">Seed</span><span className="logo-work">Work</span></strong>
            <span>Panel administrador</span>
          </div>
        </div>
        <span className="role-pill">Administrador</span>
        <nav className="nav-list">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={"nav-item" + (pathname === item.href ? " active" : "")}>
              <svg viewBox="0 0 24 24">{item.icon}</svg>
              <span className="label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="nav-footer">
          <button
            type="button"
            onClick={() => logout()}
            className="nav-item"
            style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <svg viewBox="0 0 20 20"><path d="M8 4H4.5A1.5 1.5 0 003 5.5v9A1.5 1.5 0 004.5 16H8"/><path d="M12 10h5.5M15 7l3 3-3 3"/></svg>
            <span className="label">Cerrar sesión</span>
          </button>
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
                <Link href="/administrador/notificaciones" className="view-all-btn">Ver todas las notificaciones</Link>
              </div>
            </div>

            <div className="user-chip">
              <div className="avatar">{iniciales}</div>
              <div className="user-meta"><strong>{user.correo}</strong></div>
            </div>
          </div>
        </header>

        <div className="content-wrap">{children}</div>
      </div>
    </div>
  );
}