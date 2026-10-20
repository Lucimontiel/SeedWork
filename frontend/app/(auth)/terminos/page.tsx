import Link from "next/link";

export default function TerminosPage() {
  return (
    <div className="login-wrapper" style={{ maxWidth: "800px", padding: "20px 0" }}>
      <div className="container" style={{ textAlign: "left", padding: "40px" }}>
        <h1 style={{ color: "var(--sw-blue)", marginBottom: "24px", fontSize: "28px" }}>Términos y Condiciones</h1>
        <p style={{ color: "var(--sw-text-muted)", marginBottom: "16px" }}>
          Bienvenido/a a SeedWork. Al acceder y utilizar nuestra plataforma, aceptas los siguientes términos y condiciones.
        </p>
        
        <h2 style={{ color: "var(--sw-text-dark)", marginTop: "24px", marginBottom: "12px", fontSize: "20px" }}>1. Uso de la Plataforma</h2>
        <p style={{ color: "var(--sw-text-muted)", marginBottom: "16px", lineHeight: "1.6" }}>
          SeedWork es una plataforma diseñada para conectar talento con oportunidades laborales. Los usuarios se comprometen a proporcionar información veraz y actualizada.
        </p>

        <h2 style={{ color: "var(--sw-text-dark)", marginTop: "24px", marginBottom: "12px", fontSize: "20px" }}>2. Privacidad de los Datos</h2>
        <p style={{ color: "var(--sw-text-muted)", marginBottom: "16px", lineHeight: "1.6" }}>
          Tus datos serán tratados de acuerdo con nuestra Política de Privacidad. No compartimos tu información con terceros sin tu consentimiento.
        </p>

        <h2 style={{ color: "var(--sw-text-dark)", marginTop: "24px", marginBottom: "12px", fontSize: "20px" }}>3. Responsabilidades</h2>
        <p style={{ color: "var(--sw-text-muted)", marginBottom: "16px", lineHeight: "1.6" }}>
          El usuario es responsable de mantener la confidencialidad de su contraseña. SeedWork no se hace responsable por el uso indebido de la cuenta.
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