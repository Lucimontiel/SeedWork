import Link from "next/link";
import './landing.css';

export default function LandingPage() {
  return (
    <main className="sw-landing">
      {/* Iconos flotantes */}
      <div className="sw-float-icon sw-float-icon-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      </div>
      <div className="sw-float-icon sw-float-icon-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
      </div>

      <div className="sw-landing-inner">
        <header className="sw-header">
          <div className="sw-landing-logo">
            <img src="/logo_blanco.png" alt="SeedWork Logo"/>
          </div>
          <h1 className="sw-title">SEEDWORK</h1>
        </header>

        <p className="sw-tagline">
          Talento <span>·</span> Oportunidades <span>·</span> Crecimiento
        </p>

        <h2 className="sw-headline">
          Tu talento merece su <br />
          <span className="accent">primera oportunidad.</span>
        </h2>

        <p className="sw-subtitle">
          Conectamos personas con ganas de crecer con empresas dispuestas a descubrir su potencial.
        </p>

        <div className="sw-actions">
          {/* 👇 RUTAS CORREGIDAS SEGÚN TU ESTRUCTURA DE CARPETAS 👇 */}
          <Link href="/login" className="sw-btn sw-btn-primary">
            Iniciar sesión
            <span className="sw-btn-arrow">→</span>
          </Link>
          
          {/* Como tienes dos registros, el botón principal puede ir al de candidato. 
              Allí el usuario puede cambiar a empresa con las pestañas que ya programaste. */}
          <Link href="/registro/candidato" className="sw-btn sw-btn-secondary">
            Crear cuenta
          </Link>
        </div>

        <footer className="sw-footer-quote">
          Un primer paso hacia nuevas oportunidades.
        </footer>
      </div>
    </main>
  );
}