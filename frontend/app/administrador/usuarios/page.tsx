import AdministradorShell from "../AdministradorShell";
import LegacyAdminContent from "../LegacyAdminContent";
import html from "./content";

export default function UsuariosAdminPage() {
  return (
    <AdministradorShell pageTitle="Usuarios" pageSubtitle="Gestiona las cuentas de candidatos y empresas registradas en SeedWork">
      <LegacyAdminContent html={html} />
    </AdministradorShell>
  );
}