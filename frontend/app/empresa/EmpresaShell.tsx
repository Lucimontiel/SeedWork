"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api";
import { useToast } from "../lib/ToastProvider";

const NAV_ITEMS = [
  {href: "/empresa/inicio",label: "Inicio",icon: ( <> <path d="M3 8.5L10 3l7 5.5" /><path d="M5 8v8h10V8" /></>),},
  {href: "/empresa/perfil",label: "Perfil",icon: (<><circle cx="10" cy="6.5" r="3" /><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" /> </> ),},
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

type EmpresaShellProps = {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  variant?: "titulo" | "busqueda";
};

export default function EmpresaShell({ children, pageTitle, pageSubtitle, variant = "titulo" }: EmpresaShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, cargando: cargandoAuth, logout } = useAuth();

  const [notifOpen, setNotifOpen] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState("Empresa");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const { showToast } = useToast();

  // Protección + carga de datos de la empresa
  useEffect(() => {
    if (cargandoAuth) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.tipo !== "empresa" || !user.idEmpresa) {
      if (user.tipo === "candidato") router.replace("/candidato/inicio");
      else if (user.tipo === "administrador") router.replace("/administrador/inicio");
      else router.replace("/login");
      return;
    }

    apiFetch<{ nombreEmpresa: string; logoUrl?: string }>(`/api/empresa/${user.idEmpresa}`)
      .then((data) => {
        if (data) {
          setNombreEmpresa(data.nombreEmpresa);
          setLogoUrl(data.logoUrl || null);
        }
      })
      .catch(() => {});
  }, [user, cargandoAuth, router]);

    // Protección + carga de datos de la empresa
  useEffect(() => {
    if (cargandoAuth) return;
    if (!user || user.tipo !== "empresa" || !user.idEmpresa) return;

    // ... (aquí está tu apiFetch de la empresa que ya tenías) ...
  }, [user, cargandoAuth, router]);

  // ⬇️ AÑADE ESTE NUEVO EFECTO ⬇️
  useEffect(() => {
    if (user?.idEmpresa) {
      apiFetch<any[]>(`/api/empresa/${user.idEmpresa}/notificaciones`)
        .then(setNotificaciones)
        .catch(() => {});
    }
  }, [user?.idEmpresa]);

  function handleLogout() {
  // Limpiar tema y accesibilidad al cerrar sesión
    const html = document.documentElement;
    html.removeAttribute("data-theme");
    html.removeAttribute("data-contrast");
    html.removeAttribute("data-reduce-motion");
    html.removeAttribute("data-keyboard-nav");
    logout();
}

  const inicial = nombreEmpresa.trim().charAt(0).toUpperCase() || "E";

  // Mientras carga, mostramos un placeholder para no romper el layout
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

  // Si no hay sesión, el useEffect ya está redirigiendo
  if (!user || user.tipo !== "empresa") {
    return null;
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
                
                {/* En CandidatoShell es <Link href="/candidato/notificaciones"...> */}
                {/* En EmpresaShell es <Link href="/empresa/notificaciones"...> */}
                <Link href="/empresa/notificaciones" className="view-all-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
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

        {/* BANNER DE VERIFICACIÓN DE CORREO */}
        {user && !user.emailVerificado && (
          <div style={{ background: "#FDF1DC", borderBottom: "1px solid #F5D8A0", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#B5750C", fontSize: 13.5, fontWeight: 600 }}>
              <span>⚠️</span>
              <span>Por favor, verifica tu correo electrónico para desbloquear todas las funciones.</span>
            </div>
            <button 
              onClick={async () => {
                try {
                  await apiFetch("/api/auth/reenviar-verificacion", { method: "POST", body: { correo: user.correo } });
                  showToast("Te hemos enviado un nuevo enlace de verificación. Revisa tu correo.", "success");
                } catch {
                  showToast("Error al reenviar el correo. Intenta de nuevo más tarde.", "error");
                }
              }}
              style={{ background: "#B5750C", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
            >
              Reenviar correo
            </button>
          </div>
        )}

        <div className="content-wrap">{children}</div>
      </div>
    </div>
  );
}