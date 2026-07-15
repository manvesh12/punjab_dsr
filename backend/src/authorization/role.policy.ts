import { Role } from "@prisma/client";
import { rolePermissions } from "./permissions.js";

export function roleToFrontend(role: Role) {
  const reviewerRoles: Role[] = [Role.REVIEWER, Role.DISTRICT_ADMIN];
  if (role === Role.SUPER_ADMIN || role === Role.STATE_ADMIN) return "admin";
  if (reviewerRoles.includes(role)) return "reviewer";
  return "user";
}

export function permissionsFor(role: Role): string[] { return rolePermissions[role] || []; }
export function canUpload(role: Role) { return permissionsFor(role).includes("submit_reports") || canAdmin(role); }
export function canReview(role: Role) { return permissionsFor(role).includes("approve_reports") || canAdmin(role); }
export function canAdmin(role: Role) { return role === Role.SUPER_ADMIN || role === Role.STATE_ADMIN; }
