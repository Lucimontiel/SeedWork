import AdministradorShell from "../AdministradorShell";
import LegacyAdminContent from "../LegacyAdminContent";
import html from "./content";

export default function InicioAdminPage() {
  return (
    <AdministradorShell pageTitle="Panel de control" pageSubtitle="Supervisa candidatos, empresas y vacantes en un solo lugar">
      <LegacyAdminContent html={html} />
    </AdministradorShell>
  );
}