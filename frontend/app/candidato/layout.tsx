import Script from "next/script";

export default function CandidatoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Carga el script.js real de Candidato para que las páginas portadas
          (Perfil, Mi CV, Vacantes, etc.) conserven toda su interactividad
          original. El sidebar/topbar ya no lo necesita: ahora son React
          real (CandidatoShell), así que no hay conflicto. */}
      <Script src="/candidato-script.js" strategy="afterInteractive" />
    </>
  );
}
