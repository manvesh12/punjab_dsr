export type FeatureKey =
  | "dashboard"
  | "projects"
  | "workflow"
  | "audit"
  | "settings"
  | "districts"
  | "reports"
  | "annexures"
  | "users"
  | "notifications"
  | "analytics"
  | "profile"
  | "support"
  | "authentication";

export type FeatureManifestEntry = {
  key: FeatureKey;
  title: string;
  identity: string;
  routeScope: string[];
  owns: string[];
  performance: string[];
};

export const featureManifest: FeatureManifestEntry[] = [
  {
    key: "dashboard",
    title: "Dashboard",
    identity: "Executive Overview",
    routeScope: ["/legacy/login.html#dashboard", "/dashboard"],
    owns: ["dashboard KPIs", "welcome sections", "dashboard cards", "notices", "quick navigation"],
    performance: ["lazy load charts", "memoize KPI cards", "defer map initialization"]
  },
  {
    key: "projects",
    title: "Projects",
    identity: "Project Management Workspace",
    routeScope: ["/legacy/login.html#projects", "/projects"],
    owns: ["project listing", "project creation", "filters", "project detail panels", "project actions"],
    performance: ["virtualized project tables", "debounced search", "optimistic local filters"]
  },
  {
    key: "workflow",
    title: "Workflow",
    identity: "Approval Pipeline",
    routeScope: ["/legacy/login.html#workflow", "/workflow"],
    owns: ["approval stages", "review actions", "submission timeline", "workflow status"],
    performance: ["lazy load timeline", "memoize stage calculations", "skeleton stage rows"]
  },
  {
    key: "audit",
    title: "Audit Logs",
    identity: "Security Monitoring",
    routeScope: ["/legacy/login.html#audit-logs", "/audit"],
    owns: ["audit event table", "security filters", "export actions", "event detail drawer"],
    performance: ["virtualized audit table", "server-side pagination", "deferred export preparation"]
  },
  {
    key: "settings",
    title: "Settings",
    identity: "Configuration Center",
    routeScope: ["/legacy/login.html#settings", "/settings"],
    owns: ["configuration panels", "role settings", "portal preferences", "admin controls"],
    performance: ["split admin panels", "lazy load advanced sections", "memoize option lists"]
  },
  {
    key: "districts",
    title: "Districts",
    identity: "District Management",
    routeScope: ["/legacy/login.html#districts", "/districts"],
    owns: ["district map", "district filters", "district metadata", "coverage views"],
    performance: ["defer map rendering", "cache geojson", "lazy load district details"]
  },
  {
    key: "reports",
    title: "Reports",
    identity: "Report Management",
    routeScope: ["/legacy/login.html#reports", "/reports"],
    owns: ["PDF generation views", "report preview", "downloads", "report lifecycle"],
    performance: ["lazy load PDF preview", "stream large previews", "cache report metadata"]
  },
  {
    key: "annexures",
    title: "Annexures",
    identity: "Annexure Workspace",
    routeScope: ["/legacy/login.html#annexures", "/annexures"],
    owns: ["annexure forms", "annexure validation", "evidence uploads", "annexure navigation"],
    performance: ["split annexure routes", "lazy form sections", "memoize validation results"]
  },
  {
    key: "users",
    title: "Users",
    identity: "User Administration",
    routeScope: ["/legacy/login.html#users", "/users"],
    owns: ["user list", "role assignment", "access scope", "user status"],
    performance: ["virtualized users table", "debounced role filters", "lazy user drawer"]
  },
  {
    key: "notifications",
    title: "Notifications",
    identity: "Communication Center",
    routeScope: ["/legacy/login.html#notifications", "/notifications"],
    owns: ["notification inbox", "announcements", "alert badges", "message states"],
    performance: ["polling isolation", "memoized unread counts", "lazy notification drawer"]
  },
  {
    key: "analytics",
    title: "Analytics",
    identity: "Business Intelligence Dashboard",
    routeScope: ["/legacy/login.html#analytics", "/analytics"],
    owns: ["trend charts", "district metrics", "workflow throughput", "compliance insights"],
    performance: ["dynamic chart imports", "aggregate caching", "deferred heavy visualizations"]
  },
  {
    key: "profile",
    title: "Profile",
    identity: "Profile Center",
    routeScope: ["/legacy/login.html#profile", "/profile"],
    owns: ["profile summary", "preferences", "session details", "account settings"],
    performance: ["lazy account panels", "memoize preference state", "defer secondary data"]
  },
  {
    key: "support",
    title: "Support",
    identity: "Help Desk",
    routeScope: ["/legacy/login.html#support", "/support"],
    owns: ["contact panel", "FAQ", "guides", "support requests"],
    performance: ["lazy guide content", "search index chunking", "deferred attachments"]
  },
  {
    key: "authentication",
    title: "Authentication",
    identity: "Access Gateway",
    routeScope: ["/", "/forgot-password", "/verify-otp", "/reset-password"],
    owns: ["login", "forgot password", "OTP verification", "reset password"],
    performance: ["minimal first-load bundle", "lazy password guidance", "server-safe redirects"]
  }
];
