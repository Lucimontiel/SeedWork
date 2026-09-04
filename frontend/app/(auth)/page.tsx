import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      fontFamily: "'Inter', sans-serif",
      background: "#1A56DB",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      overflow: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 800,
          fontSize: "3rem",
          letterSpacing: "0.04em",
          color: "#E7E7E7",
          textShadow: "3px 4px 0px #1B4EC2",
          margin: "0 0 2.5rem 0",
        }}>SEEDWORK</h1>
        <p style={{ color: "#DEE6FB", fontSize: "1rem", lineHeight: 1.4, margin: "0 0 4rem 0" }}>
          Sembramos conexiones que impulsan carreras y hacen crecer empresas.
        </p>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/login" style={{
            display: "block", width: "100%", padding: "0.875rem 1.5rem", borderRadius: 9999,
            fontWeight: 600, fontSize: "1rem", textDecoration: "none", textAlign: "center",
            background: "#E6E6E6", color: "#1A56DB",
          }}>Iniciar sesión</Link>
          <Link href="/registro/candidato" style={{
            display: "block", width: "100%", padding: "0.875rem 1.5rem", borderRadius: 9999,
            fontWeight: 600, fontSize: "1rem", textDecoration: "none", textAlign: "center",
            background: "transparent", color: "#ffffff", border: "2px solid #C3CDE4",
          }}>Crear cuenta</Link>
        </div>
      </div>
    </div>
  );
}