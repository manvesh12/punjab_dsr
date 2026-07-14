import { Role } from "@prisma/client";
import { rolePermissions } from "./permissions.js";

export function roleToFrontend(role: Role) {
  const reviewerRoles: Role[] = [Role.REVIEWER, Role.REVIEWER_1, Role.REVIEWER_2, Role.IIT_ROPAR, Role.GIS];
  if (role === Role.ADMIN || role === Role.STATE_ADMIN) return "admin";
  if (role === Role.SDLC) return "sdlc";
  if (role === Role.DISTRICT_OWNER) return "authority";
  if (reviewerRoles.includes(role)) return "reviewer";
  return "user";
}

export function permissionsFor(role: Role): string[] { return rolePermissions[role] || []; }
export function canUpload(role: Role) { return permissionsFor(role).includes("submit_reports") || canAdmin(role); }
export function canReview(role: Role) { return permissionsFor(role).includes("approve_reports") || canAdmin(role); }
export function canAdmin(role: Role) { return role === Role.ADMIN || role === Role.STATE_ADMIN; }
