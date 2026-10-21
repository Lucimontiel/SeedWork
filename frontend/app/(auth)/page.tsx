import "../landing.css";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="sw-landing">
      {/* Formas de fondo (Blobs) */}
      <div className="sw-deco sw-deco-1" aria-hidden="true">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="100" fill="url(#g1)" opacity="0.3" />
          <defs>
            <radialGradient id="g1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div className="sw-deco sw-deco-2" aria-hidden="true">
        <svg width="240" height="240" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="120" fill="url(#g2)" opacity="0.25" />
          <defs>
            <radialGradient id="g2">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Iconos flotantes sutiles */}
      <div className="sw-float-icon sw-float-icon-1" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(168, 197, 255, 0.4)" strokeWidth="1.5">
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
      <div className="sw-float-icon sw-float-icon-2" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(168, 197, 255, 0.35)" strokeWidth="1.5">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      </div>

      {/* Contenido principal */}
      <div className="sw-landing-inner">
        
                {/* Header: Logo + Nombre */}
        <div className="sw-header">
          <img 
            src="/logo_blanco.png" 
            alt="SeedWork Logo" 
            className="sw-landing-logo" 
          />
          <h1 className="sw-title">SEEDWORK</h1>
        </div>

        <div className="sw-tagline">
          Talento <span>·</span> Oportunidades <span>·</span> Crecimiento
        </div>

        <h2 className="sw-headline">
          Tu talento merece su<br />
          <span className="accent">primera oportunidad.</span>
        </h2>

        <p className="sw-subtitle">
          Conectamos personas con ganas de crecer con empresas dispuestas a
          descubrir su potencial.
        </p>

        <div className="sw-actions">
          <Link href="/login" className="sw-btn sw-btn-primary">
            Iniciar sesión
            <span className="sw-btn-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
          <Link href="/registro/candidato" className="sw-btn sw-btn-secondary">
            Crear cuenta
          </Link>
        </div>

        <p className="sw-footer-quote">Un primer paso hacia nuevas oportunidades.</p>
      </div>
    </div>
  );
}