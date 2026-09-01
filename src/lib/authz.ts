import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ROLES = {
  CARE_USER: "CARE_USER",
  CAREGIVER: "CAREGIVER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface ServerUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  image?: string | null;
}

/**
 * Returns the signed-in user from the JWT session or null.
 * Safe to call in server components and route handlers.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    image: session.user.image,
  };
}

/**
 * Returns the signed-in user or redirects to /login.
 */
export async function requireUser(): Promise<ServerUser> {
  const user = await getServerUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Returns the signed-in user if their role is in `allowed`, otherwise
 * redirects to /login (no session) or the appropriate home for their role.
 */
export async function requireRole(...allowed: Role[]): Promise<ServerUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role as Role)) {
    redirect(user.role === "CAREGIVER" ? "/caregiver/dashboard" : "/home");
  }
  return user;
}

/**
 * Returns the session user if they are allowed to access `profileId`:
 * - ADMIN always passes
 * - CARE_USER only if it is their own CareProfile
 * - CAREGIVER only if a CaregiverRelationship links them to that patient
 * Redirects to their home otherwise.
 */
export async function canAccessPatient(profileId: string): Promise<ServerUser> {
  const user = await requireUser();
  if (user.role === ROLES.ADMIN) return user;

  const profile = await prisma.careProfile.findUnique({
    where: { id: profileId },
    include: {
      caregivers: { select: { caregiverId: true } },
    },
  });
  if (!profile) redirect("/");

  const isOwn =
    user.role === ROLES.CARE_USER && profile.userId === user.id;
  const isLinkedCaregiver =
    user.role === ROLES.CAREGIVER &&
    profile.caregivers.some((rel) => rel.caregiverId === user.id);

  if (!isOwn && !isLinkedCaregiver) {
    redirect(user.role === "CAREGIVER" ? "/caregiver/dashboard" : "/home");
  }
  return user;
}

/**
 * Convenience: fetch the CareProfile id for the signed-in CARE_USER,
 * or the first patient they are a caregiver for. Returns null when there is
 * no accessible patient context.
 */
export async function getAccessibleProfileId(
  user?: ServerUser | null,
): Promise<string | null> {
  const sessionUser = user ?? (await getServerUser());
  if (!sessionUser) return null;

  if (sessionUser.role === ROLES.CARE_USER) {
    const profile = await prisma.careProfile.findUnique({
      where: { userId: sessionUser.id },
      select: { id: true },
    });
    return profile?.id ?? null;
  }

  if (sessionUser.role === ROLES.CAREGIVER) {
    const rel = await prisma.caregiverRelationship.findFirst({
      where: { caregiverId: sessionUser.id },
      select: { patientId: true },
      orderBy: { createdAt: "asc" },
    });
    return rel?.patientId ?? null;
  }

  return null;
}