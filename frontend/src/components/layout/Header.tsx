import { Bell, LogOut, Moon, Search, UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="portal-header">
      <div className="portal-brand">
        <img src="/legacy/assets/dsr-logo.png" alt="Punjab Government Smart DSR Logo" className="portal-brand-logo" />
        <div className="portal-brand-copy">
          <strong>District Survey Report Automation Portal</strong>
          <span>Government of Punjab</span>
        </div>
      </div>
      <div className="portal-header-actions">
        <label className="portal-search">
          <Search aria-hidden="true" />
          <input type="search" placeholder="Search portal..." aria-label="Search portal" />
        </label>
        <button type="button" className="portal-icon-button" aria-label="Notifications">
          <Bell aria-hidden="true" />
        </button>
        <button type="button" className="portal-icon-button" aria-label="Toggle theme">
          <Moon aria-hidden="true" />
        </button>
        <button type="button" className="portal-profile-button" aria-label="User profile">
          <UserCircle aria-hidden="true" />
          <span>Profile</span>
        </button>
        <button type="button" className="portal-profile-button" aria-label="Logout">
          <LogOut aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
