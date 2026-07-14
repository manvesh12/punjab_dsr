import type { ReactNode } from "react";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";

type PageHeaderProps = {
  title: string;
  description: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;
};

export function PageHeader({ title, description, breadcrumb = [], actions }: PageHeaderProps) {
  return (
    <section className="portal-page-header">
      <div>
        {breadcrumb.length > 0 ? <Breadcrumb items={breadcrumb} /> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="portal-page-actions">{actions}</div> : null}
    </section>
  );
}
