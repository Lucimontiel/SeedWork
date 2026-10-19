import "./estilo-auth.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-scope">{children}</div>;
}
