export const APP_ADMIN_ROLE = "admin";
export const MIN_PASSWORD_LENGTH = 8;

export function isAppAdmin(role: string | null | undefined): boolean {
  if (!role) return false;

  return role.split(",").some((part) => part.trim() === APP_ADMIN_ROLE);
}

export function roleFromUnknown(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("role" in value)) {
    return null;
  }

  return typeof value.role === "string" ? value.role : null;
}
