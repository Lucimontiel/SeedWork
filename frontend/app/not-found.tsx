import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F4F6F9", textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 80, marginBottom: 20 }}>🔍</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#101828", margin: "0 0 10px" }}>Página no encontrada</h1>
      <p style={{ color: "#667085", fontSize: 16, marginBottom: 30 }}>Lo sentimos, la página que buscas no existe o fue movida.</p>
      <Link href="/" style={{ background: "#2D6CDF", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
        Volver al inicio
      </Link>
    </div>
  );
}