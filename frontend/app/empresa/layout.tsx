import Script from "next/script";

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script src="/empresa-script.js" strategy="afterInteractive" />
    </>
  );
}
