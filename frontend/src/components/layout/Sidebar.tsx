import {
  Activity,
  ClipboardList,
  Ellipsis,
  Folder,
  Home,
  Info,
  MapPin,
  Phone,
  Settings
} from "lucide-react";

const sidebarItems = [
  { label: "Home", icon: Home },
  { label: "About DSR", icon: Info },
  { label: "Projects", icon: Folder },
  { label: "Workflow", icon: Activity },
  { label: "Audit Logs", icon: ClipboardList },
  { label: "Settings", icon: Settings },
  { label: "Districts", icon: MapPin },
  { label: "Contact", icon: Phone },
  { label: "More", icon: Ellipsis }
];

type SidebarProps = {
  collapsed?: boolean;
};

export function Sidebar({ collapsed = false }: SidebarProps) {
  return (
    <aside className="portal-sidebar" aria-label="Portal navigation" data-collapsed={collapsed}>
      <div className="portal-sidebar-header">
        <strong>DSR Portal</strong>
        <span>Government Menu</span>
      </div>
      <nav className="portal-sidebar-nav">
        {sidebarItems.map(({ label, icon: Icon }, index) => (
          <a className={index === 0 ? "active" : undefined} href="/legacy/login.html" key={label} title={label}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
