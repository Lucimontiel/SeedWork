"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/auth-context";

const NAV_ITEMS = [
  { href: "/empresa/inicio", label: "Inicio", icon: <><path d="M3 8.5L10 3l7 5.5"/><path d="M5 8v8h10V8"/></> },
  { href: "/empresa/perfil", label: "Perfil", icon: <><circle cx="10" cy="6.5" r="3"/><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5"/></> },
  { href: "/empresa/mis-ofertas", label: "Mis Ofertas", icon: <><rect x="4" y="3.5" width="12" height="14" rx="1.5"/><path d="M7 9h6M7 12h6M7 15h4"/></> },
  { href: "/empresa/candidatos", label: "Candidatos", icon: <><circle cx="10" cy="7" r="3"/><path d="M4.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/></> },
  { href: "/empresa/notificaciones", label: "Notificaciones", icon: <><path d="M10 2.5a4 4 0 014 4v2.3c0 .9.3 1.8.9 2.5l.6.7H4.5l.6-.7c.6-.7.9-1.6.9-2.5V6.5a4 4 0 014-4z"/><path d="M8 16a2 2 0 004 0"/></> },
];

export default function EmpresaShell({
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
  const router = useRouter();
  const { user, cargando: cargandoAuth, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  // Protección: solo empresas
  useEffect(() => {
    if (cargandoAuth) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.tipo !== "empresa") {
      if (user.tipo === "candidato") router.replace("/candidato/inicio");
      else if (user.tipo === "administrador") router.replace("/administrador/inicio");
      else router.replace("/login");
    }
  }, [user, cargandoAuth, router]);

  if (cargandoAuth) {
    return <div style={{ padding: 40, textAlign: "center" }}>Cargando panel...</div>;
  }

  if (!user || user.tipo !== "empresa") return null;

  const iniciales = nombre 
    ? nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() 
    : user.correo.substring(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <img src="/logo-seedwork.png" alt="SeedWork Logo" className="logo-icon" style={{ objectFit: "contain" }} />
          <div className="logo-text">
            <strong><span className="logo-seed">Seed</span><span className="logo-work">Work</span></strong>
            <span>Panel Empresa</span>
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
            </div>

            <div className="user-chip">
              <div
                className="avatar"
                style={fotoUrl ? { padding: 0, overflow: "hidden" } : { background: "#2D6CDF", color: "#fff" }}
              >
                {fotoUrl ? (
                  <img src={fotoUrl} alt={nombre || ""} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }} />
                ) : (
                  iniciales
                )}
              </div>
              <div className="user-meta"><strong>{nombre || user.correo}</strong></div>
            </div>
          </div>
        </header>

        <div className="content-wrap">{children}</div>
      </div>
    </div>
  );
}