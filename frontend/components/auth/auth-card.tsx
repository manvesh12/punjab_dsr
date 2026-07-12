import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">{children}</section>
    </main>
  );
}

export function AuthHeader({
  title,
  description,
  tone = "default"
}: {
  title: string;
  description?: string;
  tone?: "default" | "success";
}) {
  return (
    <header className="auth-panel-header">
      <h1 className={cn("auth-panel-title", tone === "success" && "text-success")}>{title}</h1>
      {description ? <p className="auth-panel-description">{description}</p> : null}
    </header>
  );
}

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {hint ? <span className="form-hint">{hint}</span> : null}
    </label>
  );
}

export function Alert({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return <div className={cn("form-alert", tone === "success" ? "form-alert-success" : "form-alert-error")}>{children}</div>;
}
