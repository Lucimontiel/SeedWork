import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <div className="login-wrapper" style={{ maxWidth: "800px", padding: "20px 0" }}>
      <div className="container" style={{ textAlign: "left", padding: "40px" }}>
        <h1 style={{ color: "var(--sw-blue)", marginBottom: "24px", fontSize: "28px" }}>Política de Privacidad</h1>
        <p style={{ color: "var(--sw-text-muted)", marginBottom: "16px" }}>
          En SeedWork, nos tomamos muy en serio la protección de tus datos personales.
        </p>
        
        <h2 style={{ color: "var(--sw-text-dark)", marginTop: "24px", marginBottom: "12px", fontSize: "20px" }}>1. Datos que recopilamos</h2>
        <p style={{ color: "var(--sw-text-muted)", marginBottom: "16px", lineHeight: "1.6" }}>
          Recopilamos información como tu nombre, correo electrónico, teléfono y ciudad. En el caso de las empresas, también recopilamos el NIT y el sector.
        </p>

        <h2 style={{ color: "var(--sw-text-dark)", marginTop: "24px", marginBottom: "12px", fontSize: "20px" }}>2. Uso de la información</h2>
        <p style={{ color: "var(--sw-text-muted)", marginBottom: "16px", lineHeight: "1.6" }}>
          Utilizamos tus datos para conectar candidatos con empresas, enviar notificaciones sobre postulaciones y mejorar nuestros servicios.
        </p>

        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <Link href="/registro/candidato" className="btn-submit" style={{ display: "inline-block", textDecoration: "none", width: "auto", padding: "12px 32px" }}>
            Volver al registro
          </Link>
        </div>
      </div>
    </div>
  );
}