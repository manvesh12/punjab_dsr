import type { ReactNode } from "react";

type ContentWrapperProps = {
  children: ReactNode;
};

export function ContentWrapper({ children }: ContentWrapperProps) {
  return (
    <main className="portal-content">
      <div className="portal-content-container">{children}</div>
    </main>
  );
}
