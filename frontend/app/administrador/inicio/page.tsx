import AdministradorShell from "../AdministradorShell";
import InicioDashboard from "./InicioDashboard";

export default function InicioAdminPage() {
  return (
    <AdministradorShell pageTitle="Panel de control" pageSubtitle="Supervisa candidatos, empresas y vacantes en un solo lugar">
      <InicioDashboard />
    </AdministradorShell>
  );
}
