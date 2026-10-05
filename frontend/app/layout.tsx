import "./globals.css";
import "./(auth)/estilo-auth.css";
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