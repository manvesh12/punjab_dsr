import type { Project } from "@prisma/client";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { canAdmin } from "./role.policy.js";

function normalized(value?: string | null) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");
}

export function assignedDistrictFor(user: AuthUser): string | null {
  if (canAdmin(user.role)) return null;
  const district = String(user.district || "").trim();
  if (!district) {
    throw new ApiError(403, "DISTRICT_NOT_ASSIGNED", "Your account has no district assignment. Please contact the administrator.");
  }
  return district;
}

export function canAccessProjectDistrict(user: AuthUser, district?: string | null) {
  return canAdmin(user.role) || (Boolean(district) && normalized(user.district) === normalized(district));
}

export function assertProjectDistrictAccess<T extends Pick<Project, "district">>(project: T | null, user: AuthUser): asserts project is T {
  if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found");
  if (!canAccessProjectDistrict(user, project.district)) {
    throw new ApiError(403, "PROJECT_DISTRICT_FORBIDDEN", "This project belongs to another district.");
  }
}
