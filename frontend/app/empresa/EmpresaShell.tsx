"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getSession, clearSession } from "../lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const NAV_ITEMS = [
  {
    href: "/empresa/inicio",
    label: "Inicio",
    icon: (
      <>
        <path d="M3 8.5L10 3l7 5.5" />
        <path d="M5 8v8h10V8" />
      </>
    ),
  },
  {
    href: "/empresa/perfil",
    label: "Perfil",
    icon: (
      <>
        <circle cx="10" cy="6.5" r="3" />
        <path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" />
      </>
    ),
  },
  {
    href: "/empresa/mis-ofertas",
    label: "Mis ofertas",
    icon: (
      <>
        <rect x="2.5" y="7" width="15" height="9" rx="1.5" />
        <path d="M7 7V5.5A1.5 1.5 0 018.5 4h3A1.5 1.5 0 0113 5.5V7" />
      </>
    ),
  },
  {
    href: "/empresa/candidatos",
    label: "Candidatos",
    icon: (
      <>
        <circle cx="7" cy="6.5" r="2.6" />
        <path d="M2.5 17c0-2.7 2-4.5 4.5-4.5s4.5 1.8 4.5 4.5" />
        <circle cx="14.5" cy="7.5" r="2.1" />
        <path d="M12.5 12.6c2.2.2 3.8 1.8 3.8 4.4" />
      </>
    ),
  },
  {
    href: "/empresa/notificaciones",
    label: "Notificaciones",
    icon: (
      <>
        <path d="M10 2.5a4 4 0 014 4v2.3c0 .9.3 1.8.9 2.5l.6.7H4.5l.6-.7c.6-.7.9-1.6.9-2.5V6.5a4 4 0 014-4z" />
        <path d="M8 16a2 2 0 004 0" />
      </>
    ),
  },
  {
    href: "/empresa/configuracion",
    label: "Configuración",
    icon: (
      <>
        <circle cx="10" cy="10" r="2.6" />
        <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.3 5.3l1.4 1.4M13.3 13.3l1.4 1.4M5.3 14.7l1.4-1.4M13.3 6.7l1.4-1.4" />
      </>
    ),
  },
];

const NOTIFICACIONES = [
  { icon: "📄", color: "blue", titulo: "Nueva postulación", texto: "Andrea Perez aplicó a Desarrollador de Software", hace: "Hace 20 min" },
  { icon: "✅", color: "green", titulo: "Oferta publicada", texto: "Analista de Software ya está activa", hace: "Hace 3 horas" },
  { icon: "⏳", color: "yellow", titulo: "Recordatorio", texto: "Tienes 2 candidatos sin contactar", hace: "Ayer" },
];

type EmpresaShellProps = {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  variant?: "titulo" | "busqueda";
};

export default function EmpresaShell({ children, pageTitle, pageSubtitle, variant = "titulo" }: EmpresaShellProps) {
  const router = useRouter();
  const pathname = usePathname(); // 👈 CAMBIA A usePathname
  const [notifOpen, setNotifOpen] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState("Empresa");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.tipo !== "empresa") {
      router.push("/login");
      return;
    }
    fetch(`${API_BASE}/api/empresa/${session.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setNombreEmpresa(data.nombreEmpresa);
          setLogoUrl(data.logoUrl || null);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const inicial = nombreEmpresa.trim().charAt(0).toUpperCase() || "E";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <svg className="logo-icon" viewBox="0 0 24 24">
            <path d="M12 21c0-5 0-8 0-10" />
            <path d="M12 11c0-4-3-6-7-6 0 4 3 6 7 6z" />
            <path d="M12 14c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5z" />
          </svg>
          <div className="logo-text">
            <strong>
              <span className="logo-seed">Seed</span>
              <span className="logo-work">Work</span>
            </strong>
            <span>
              Conectamos talento, <br />
              impulsamos empresas
            </span>
          </div>
        </div>

        <nav className="nav-list">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={"nav-item" + (pathname === item.href ? " active" : "")}
            >
              <svg viewBox="0 0 20 20">{item.icon}</svg>
              <span className="label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="nav-footer">
          <button
            type="button"
            onClick={handleLogout}
            className="nav-item"
            style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <svg viewBox="0 0 20 20">
              <path d="M8 4H4.5A1.5 1.5 0 003 5.5v9A1.5 1.5 0 004.5 16H8" />
              <path d="M12 10h5.5M15 7l3 3-3 3" />
            </svg>
            <span className="label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className={"topbar" + (variant === "busqueda" ? " topbar-empresa" : "")}>
          {variant === "busqueda" ? (
            <div className="empresa-search-wrap">
              <svg viewBox="0 0 20 20">
                <circle cx="9" cy="9" r="6" />
                <path d="M17 17l-4-4" />
              </svg>
              <input type="text" placeholder="Busca candidatos, hojas de vida..." />
            </div>
          ) : (
            <div className="page-title">
              <h1>{pageTitle}</h1>
              <p>{pageSubtitle}</p>
            </div>
          )}

          <div className="header-actions">
            <div className="notification-wrapper">
              <button className="icon-btn" onClick={() => setNotifOpen((o) => !o)} aria-label="Notificaciones">
                <svg viewBox="0 0 20 20">
                  <path d="M10 2.5a4 4 0 014 4v2.3c0 .9.3 1.8.9 2.5l.6.7H4.5l.6-.7c.6-.7.9-1.6.9-2.5V6.5a4 4 0 014-4z" />
                  <path d="M8 16a2 2 0 004 0" />
                </svg>
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
                <Link href="/empresa/notificaciones" className="view-all-btn">
                  Ver todas las notificaciones
                </Link>
              </div>
            </div>

            <div className="user-chip">
              <div className="avatar avatar-empresa">
                {logoUrl ? (
                  <img src={logoUrl} alt={nombreEmpresa} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  inicial
                )}
              </div>
              <div className="user-meta">
                <strong>{nombreEmpresa}</strong>
              </div>
            </div>
          </div>
        </header>

        <div className="content-wrap">{children}</div>
      </div>
    </div>
  );
}