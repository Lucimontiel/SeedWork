import AdministradorShell from "../AdministradorShell";
import LegacyAdminContent from "../LegacyAdminContent";
import html from "./content";

export default function ReportesAdminPage() {
  return (
    <AdministradorShell pageTitle="Reportes y moderación" pageSubtitle="Casos reportados por candidatos o empresas, pendientes de revisión">
      <LegacyAdminContent html={html} />
    </AdministradorShell>
  );
}