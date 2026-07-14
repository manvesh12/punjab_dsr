import type { User } from "@prisma/client";

export type AuthUser = Pick<
  User,
  "id" | "username" | "email" | "fullName" | "role" | "district" | "blockName" | "sectionName" | "accessScope"
>;

declare global {
  namespace Express {
    interface Request { user?: AuthUser; }
  }
}
