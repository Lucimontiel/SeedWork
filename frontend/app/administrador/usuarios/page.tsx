import AdministradorShell from "../AdministradorShell";
import UsuariosDashboard from "./UsuariosDashboard";

export default function UsuariosAdminPage() {
  return (
    <AdministradorShell pageTitle="Usuarios" pageSubtitle="Gestiona las cuentas de candidatos y empresas registradas en SeedWork">
      <UsuariosDashboard />
    </AdministradorShell>
  );
}
