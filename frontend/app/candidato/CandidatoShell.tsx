"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import { useState, useEffect } from "react"; 
import { avatarColorFromName } from "../lib/avatarColor";
import { useTheme } from "../lib/useTheme";
import { useLocalization } from "../lib/useLocalization";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api";

const NAV_ITEMS = [
  { href: "/candidato/inicio", labelKey: "inicio", icon: <><path d="M3 8.5L10 3l7 5.5"/><path d="M5 8v8h10V8"/></> },
  { href: "/candidato/perfil", labelKey: "perfil", icon: <><circle cx="10" cy="6.5" r="3"/><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5"/></> },
  { href: "/candidato/mi-cv", labelKey: "miCV", icon: <><path d="M6 2.5h6l3 3v12H6z"/><path d="M9 8h4M9 11h4M9 14h2"/></> },
  { href: "/candidato/vacantes", labelKey: "vacantes", icon: <><rect x="2.5" y="7" width="15" height="9" rx="1.5"/><path d="M7 7V5.5A1.5 1.5 0 018.5 4h3A1.5 1.5 0 0113 5.5V7"/></> },
  { href: "/candidato/postulaciones", labelKey: "postulaciones", icon: <><rect x="4" y="3.5" width="12" height="14" rx="1.5"/><rect x="7" y="2" width="6" height="3" rx="1"/><path d="M7 9h6M7 12h6M7 15h4"/></> },
  { href: "/candidato/consejos", labelKey: "consejos", icon: <><path d="M10 2.5a5 5 0 00-3 9c.5.4.8 1 .8 1.6v1h4.4v-1c0-.6.3-1.2.8-1.6a5 5 0 00-3-9z"/><path d="M8.3 17h3.4"/></> },
  { href: "/candidato/simulador", labelKey: "simulador", icon: <><path d="M3 4.5h14v8H8l-3 3v-3H3z"/></> },
  { href: "/candidato/configuracion", labelKey: "configuracion", icon: <><circle cx="10" cy="10" r="2.6"/><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.3 5.3l1.4 1.4M13.3 13.3l1.4 1.4M5.3 14.7l1.4-1.4M13.3 6.7l1.4-1.4"/></> },
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
  const { t } = useLocalization();
  const router = useRouter();
  const { user, cargando: cargandoAuth, logout } = useAuth();
  
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const { theme } = useTheme();

  // 1. Protección de ruta
  useEffect(() => {
    if (cargandoAuth) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.tipo !== "candidato") {
      if (user.tipo === "empresa") router.replace("/empresa/inicio");
      else if (user.tipo === "administrador") router.replace("/administrador/inicio");
      else router.replace("/login");
    }
  }, [user, cargandoAuth, router]);

  // 2. Cargar notificaciones
  useEffect(() => {
    if (user?.idCandidato) {
      apiFetch<any[]>(`/api/candidato/${user.idCandidato}/notificaciones`)
        .then(setNotificaciones)
        .catch(() => {});
    }
  }, [user?.idCandidato]);

  const iniciales = nombre
    ? nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()
    : "";

  function handleLogout() {
    document.documentElement.removeAttribute("data-theme");
    logout();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <img src="/logo_azul.png" alt="SeedWork Logo" className="logo-icon" />
          <div className="logo-text">
            <strong>
              <span className="logo-seed">Seed</span>
              <span className="logo-work">Work</span>
            </strong>
            <span>Tu próximo empleo, tu futuro</span>
          </div>
        </div>
        <nav className="nav-list">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={"nav-item" + (pathname === item.href ? " active" : "")}>
              <svg viewBox="0 0 20 20">{item.icon}</svg>
              <span className="label">{t(item.labelKey)}</span>
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
              <path d="M8 4H4.5A1.5 1.5 0 003 5.5v9A1.5 1.5 0 004.5 16H8"/>
              <path d="M12 10h5.5M15 7l3 3-3 3"/>
            </svg>
            <span className="label">{t("cerrarSesion")}</span>
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
                  <span>{notificaciones.filter(n => !n.leida).length} nuevas</span>
                </div>
                
                {notificaciones.length === 0 ? (
                  <p style={{ padding: "20px 0", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
                    No tienes notificaciones por ahora.
                  </p>
                ) : (
                  notificaciones.slice(0, 4).map((n) => (
                    <div className="notification-item" key={n.idNotificacion}>
                      <div className="notification-icon blue">🔔</div>
                      <div className="notification-info">
                        <strong>{n.titulo}</strong>
                        <p>{n.mensaje}</p>
                        <small>{new Date(n.fecha).toLocaleDateString()}</small>
                      </div>
                    </div>
                  ))
                )}
                
                <Link href="/candidato/notificaciones" className="view-all-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                  Ver todas las notificaciones
                </Link>
              </div>
            </div> {/* ⬅️ ESTE ERA EL </div> QUE FALTABA */}

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