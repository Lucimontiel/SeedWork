import "./estilo-empresa.css";

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  return <div className="scope-empresa">{children}</div>;
}