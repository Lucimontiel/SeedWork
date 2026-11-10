import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "./lib/auth-context";
import { ToastProvider } from "./lib/ToastProvider"; // ⬅️ NUEVO

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
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var raw = localStorage.getItem("theme:candidato");
                var t = raw ? (raw.startsWith('"') ? JSON.parse(raw) : raw) : null;
                if (t === "oscuro") {
                  document.documentElement.setAttribute("data-theme", "dark");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          {/* ⬇️ ENVOLVEMOS CON EL TOAST PROVIDER ⬇️ */}
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}