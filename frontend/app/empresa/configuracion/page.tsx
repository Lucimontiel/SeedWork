import EmpresaShell from "../EmpresaShell";
import html from "./content";

export default function ConfiguracionEmpresaPage() {
  return (
    <EmpresaShell pageTitle="Configuración" pageSubtitle="Administra tus preferencias, seguridad y demás opciones de tu cuenta">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </EmpresaShell>
  );
}