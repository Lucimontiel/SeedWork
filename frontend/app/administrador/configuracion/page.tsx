import AdministradorShell from "../AdministradorShell";
import LegacyAdminContent from "../LegacyAdminContent";
import html from "./content";

export default function ConfiguracionAdminPage() {
  return (
    <AdministradorShell pageTitle="Configuración" pageSubtitle="Datos de tu cuenta, seguridad y parámetros generales de la plataforma">
      <LegacyAdminContent html={html} />
    </AdministradorShell>
  );
}