import "./globals.css";
import "./(auth)/estilo-auth.css"; // CSS del Login y Registro
import "./empresa/estilo-empresa.css"; // CSS del Dashboard
import "./candidato/estilo-candidato.css"; // CSS del Dashboard del Candidato

export const metadata = {
  title: "SeedWork",
  description: "Plataforma SeedWork",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}