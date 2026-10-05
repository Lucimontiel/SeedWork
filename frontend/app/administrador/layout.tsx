import "./estilo-admin.css";

export default function AdministradorLayout({ children }: { children: React.ReactNode }) {
  return <div className="scope-admin">{children}</div>;
}