/**
 * Corresponde ao enum WorkerRole do backend.
 */
export const USER_ROLES = ["super_admin", "admin", "worker"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type User = {
  personId: string;
  username: string;
  role: UserRole;
  fullName: string;
};
