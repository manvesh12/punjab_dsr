import type { ReactNode } from "react";
import { ContentWrapper } from "@/src/components/layout/ContentWrapper";
import { Header } from "@/src/components/layout/Header";
import { Sidebar } from "@/src/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import "@/src/shared/design-system/portal-layout.css";

type DashboardLayoutProps = {
  children: ReactNode;
  className?: string;
  collapsed?: boolean;
};

export function DashboardLayout({ children, className, collapsed = false }: DashboardLayoutProps) {
  return (
    <div className={cn("portal-layout", collapsed && "portal-layout--collapsed", className)}>
      <Header />
      <Sidebar collapsed={collapsed} />
      <ContentWrapper>{children}</ContentWrapper>
    </div>
  );
}
