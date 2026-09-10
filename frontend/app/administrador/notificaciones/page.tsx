import AdministradorShell from "../AdministradorShell";
import LegacyAdminContent from "../LegacyAdminContent";
import html from "./content";

export default function NotificacionesAdminPage() {
  return (
    <AdministradorShell pageTitle="Notificaciones" pageSubtitle="Historial completo de notificaciones internas del sistema">
      <LegacyAdminContent html={html} />
    </AdministradorShell>
  );
}