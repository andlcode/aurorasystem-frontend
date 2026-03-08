/**
 * Corresponde ao enum WorkerRole do backend.
 */
export const USER_ROLES = ["SUPER_ADMIN", "COORDENADOR", "EVANGELIZADOR"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const WORKER_ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "COORDENADOR", label: "Coordenador" },
  { value: "EVANGELIZADOR", label: "Evangelizador" },
] as const;

export const WORKER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  COORDENADOR: "Coordenador",
  EVANGELIZADOR: "Evangelizador",
};

export type User = {
  userId: string;
  username: string;
  role: UserRole;
  name: string;
};
