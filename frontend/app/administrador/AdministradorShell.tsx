"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/auth-context"; // Usando la ruta correcta

const NAV_ITEMS = [
  { href: "/administrador/inicio", label: "Inicio", icon: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></> },
  // Agrega aquí los demás ítems de navegación si los tenías (Vacantes, Empresas, etc.)
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

  // Iniciales del usuario logueado (usando el correo del admin)
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
          <img src="/logo-seedwork.png" alt="SeedWork Logo" className="logo-icon" style={{ objectFit: "contain" }} />
          <div className="logo-text">
            <strong><span className="logo-seed">Seed</span><span className="logo-work">Work</span></strong>
            <span>Panel Administrador</span>
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
            onClick={() => logout()}
            className="nav-item"
            style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <svg viewBox="0 0 20 20">
              <path d="M8 4H4.5A1.5 1.5 0 003 5.5v9A1.5 1.5 0 004.5 16H8"/>
              <path d="M12 10h5.5M15 7l3 3-3 3"/>
            </svg>
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
              {/* Dropdown de notificaciones (opcional) */}
              <div className={"notification-dropdown" + (notifOpen ? " show" : "")}>
                <div className="notification-title">
                  <h3>Notificaciones</h3>
                </div>
                <div style={{ padding: 20, textAlign: "center", color: "#667085", fontSize: 14 }}>
                  No hay notificaciones nuevas.
                </div>
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

      <div className="toast-wrap" id="toast-wrap"></div>
    </div>
  );
}