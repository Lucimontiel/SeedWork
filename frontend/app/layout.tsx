import "./globals.css";
import "./(auth)/estilo-auth.css"; // CSS del Login y Registro
import "./empresa/estilo-empresa.css"; // CSS del Dashboard
import "./candidato/estilo-candidato.css"; // CSS del Dashboard del Candidato
import { AuthProvider } from "./lib/auth-context"; // Ajusta la ruta si tu archivo está en otro lado

export const metadata = {
  title: "SeedWork",
  description: "Plataforma SeedWork",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var path = window.location.pathname;
                  var themeKey = null;
                  var prefix = null;
                  if (path.indexOf('/candidato') === 0) { themeKey = 'theme:candidato'; prefix = 'settings:candidato:'; }
                  else if (path.indexOf('/empresa') === 0) { themeKey = 'theme:empresa'; prefix = 'settings:empresa:'; }
                  else if (path.indexOf('/admin') === 0) { themeKey = 'theme:admin'; prefix = 'settings:admin:'; }
                  if (!themeKey) return;

                  // Tema
                  if (localStorage.getItem(themeKey) === 'oscuro') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }

                  // Accesibilidad
                  if (prefix) {
                    if (localStorage.getItem(prefix + 'accesibilidad:contraste') === 'true') {
                      document.documentElement.setAttribute('data-contrast', 'high');
                    }
                    if (localStorage.getItem(prefix + 'accesibilidad:reducirAnim') === 'true') {
                      document.documentElement.setAttribute('data-reduce-motion', 'true');
                    }
                    if (localStorage.getItem(prefix + 'accesibilidad:navTeclado') === 'true') {
                      document.documentElement.setAttribute('data-keyboard-nav', 'true');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {/* Envolvemos toda la app con el AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}