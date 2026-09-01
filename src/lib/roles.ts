/**
 * Shared role metadata used by the auth flows (signup role select, role
 * selector cards). Kept in one place so the naming stays consistent.
 */

export type NewUserRole = "CARE_USER" | "CAREGIVER";

export interface RoleOption {
  value: NewUserRole;
  label: string;
  description: string;
  /** Public path the user lands on after picking this role. */
  href: string;
}

export const SIGNUP_ROLES: RoleOption[] = [
  {
    value: "CARE_USER",
    label: "I am the person receiving care",
    description: "A gentle companion to help you remember, stay safe, and stay connected.",
    href: "/home",
  },
  {
    value: "CAREGIVER",
    label: "I am a caregiver or family member",
    description: "Support and look after someone you love from this account.",
    href: "/caregiver/dashboard",
  },
];

export const ROLE_LABELS: Record<string, string> = {
  CARE_USER: "Patient",
  CAREGIVER: "Caregiver",
  ADMIN: "Administrator",
};

export function isValidNewUserRole(value: string): value is NewUserRole {
  return value === "CARE_USER" || value === "CAREGIVER";
}