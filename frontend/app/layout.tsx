import "./globals.css";
import "./(auth)/estilo-auth.css"; // CSS del Login y Registro
import "./empresa/estilo-empresa.css"; // CSS del Dashboard
import "./candidato/estilo-candidato.css"; // CSS del Dashboard del Candidato
import { AuthProvider } from "./lib/auth-context";

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
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}