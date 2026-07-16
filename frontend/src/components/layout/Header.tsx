"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bell, LogOut, Moon, Search, Sun, UserCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

const SEARCH_ROUTES: Array<[string[], string]> = [
  [["project", "projects"], "/legacy/login.html#projects"],
  [["report", "reports", "dsr"], "/legacy/login.html#reports"],
  [["workflow", "approval", "review"], "/legacy/login.html#workflow"],
  [["district", "districts"], "/legacy/login.html#districts"],
  [["audit", "logs"], "/legacy/login.html#audit"],
  [["setting", "settings"], "/legacy/login.html#settings"],
  [["profile", "account"], "/legacy/login.html#profile"],
  [["notification", "notifications", "alert"], "/legacy/login.html#notifications"]
];

export function Header() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<"notifications" | "profile" | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const close = (event: MouseEvent) => {
      if (!actionsRef.current?.contains(event.target as Node)) setPanel(null);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setPanel(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = query.trim().toLowerCase();
    if (!term) return;
    const match = SEARCH_ROUTES.find(([keywords]) => keywords.some((keyword) => term.includes(keyword)));
    router.push(match?.[1] ?? `/legacy/login.html#search?q=${encodeURIComponent(term)}`);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      ["dsr_token", "dsr_user", "dsr_role", "dsr_active_project"].forEach((key) => localStorage.removeItem(key));
      router.replace("/legacy/login.html");
    }
  };

  return (
    <header className="portal-header">
      <a className="portal-brand" href="/legacy/home.html" aria-label="DSR portal home">
        <img src="/legacy/assets/dsr-logo.png" alt="Punjab Government Smart DSR Logo" className="portal-brand-logo" />
        <span className="portal-brand-copy">
          <strong>District Survey Report Automation Portal</strong>
          <span>Government of Punjab</span>
        </span>
      </a>
      <div className="portal-header-actions" ref={actionsRef}>
        <form className="portal-search" role="search" onSubmit={submitSearch}>
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search portal..." aria-label="Search portal" />
        </form>
        <button type="button" className="portal-icon-button" aria-label="Notifications" aria-expanded={panel === "notifications"} onClick={() => setPanel(panel === "notifications" ? null : "notifications")}>
          <Bell aria-hidden="true" />
        </button>
        <button type="button" className="portal-icon-button" aria-label={dark ? "Use light theme" : "Use dark theme"} aria-pressed={dark} onClick={toggleTheme}>
          {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
        <button type="button" className="portal-profile-button" aria-label="User profile" aria-expanded={panel === "profile"} onClick={() => setPanel(panel === "profile" ? null : "profile")}>
          <UserCircle aria-hidden="true" /><span>Profile</span>
        </button>
        <button type="button" className="portal-profile-button" aria-label="Logout" onClick={logout}>
          <LogOut aria-hidden="true" /><span>Logout</span>
        </button>
        {panel && (
          <section className="portal-header-popover" aria-live="polite">
            <button className="portal-popover-close" type="button" aria-label="Close" onClick={() => setPanel(null)}><X aria-hidden="true" /></button>
            {panel === "notifications" ? (
              <><strong>Notifications</strong><p>You have no new notifications.</p><a href="/legacy/login.html#notifications">View all notifications</a></>
            ) : (
              <><strong>Your profile</strong><p>Manage account details, preferences and active sessions.</p><a href="/legacy/login.html#profile">Open profile</a></>
            )}
          </section>
        )}
      </div>
    </header>
  );
}
