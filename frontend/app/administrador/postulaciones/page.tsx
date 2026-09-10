import AdministradorShell from "../AdministradorShell";
import LegacyAdminContent from "../LegacyAdminContent";
import html from "./content";

export default function PostulacionesAdminPage() {
  return (
    <AdministradorShell pageTitle="Postulaciones" pageSubtitle="Vista global de postulaciones entre candidatos y empresas — útil para soporte y seguimiento">
      <LegacyAdminContent html={html} />
    </AdministradorShell>
  );
}