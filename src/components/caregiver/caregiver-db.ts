/**
 * caregiver-db.ts — server-only helpers for Caregiver Mode.
 *
 * IMPORTANT: This module imports Prisma / NextAuth and MUST only be imported
 * from Server Components and Route Handlers. Never import it from a client
 * component (add a separate fetch component that calls the API routes instead).
 *
 * Relation notes taken from prisma/schema.prisma:
 *   - CaregiverRelationship.caregiverId -> User (the caregiver)
 *   - CaregiverRelationship.patientId   -> CareProfile (the patient)
 *   - CareProfile.userId                -> User (the patient's account)
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface PatientSummary {
  id: string;
  name: string;
  email?: string | null;
}

export interface CaregiverSession {
  userId: string;
  userName: string;
  userEmail?: string | null;
  patients: PatientSummary[];
}

/**
 * Resolve the signed-in CAREGIVER and every patient they are linked to,
 * or null. Returns null when there is no session or when the user's role
 * is not CAREGIVER.
 */
export async function getCaregiverSession(): Promise<CaregiverSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role && session.user.role !== "CAREGIVER") return null;

  const relationships = await prisma.caregiverRelationship.findMany({
    where: { caregiverId: session.user.id },
    include: {
      patient: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const patients: PatientSummary[] = relationships
    .filter((rel) => rel.patient?.user)
    .map((rel) => ({
      id: rel.patientId,
      name: rel.patient.user?.name || "Patient",
      email: rel.patient.user?.email,
    }));

  return {
    userId: session.user.id,
    userName: session.user.name || "there",
    userEmail: session.user.email,
    patients,
  };
}

/**
 * Server Component helper: returns the Caregiver session or redirects.
 * Non-CAREGIVER users are sent to their own home.
 */
export async function requireCaregiverSession(): Promise<CaregiverSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role && session.user.role !== "CAREGIVER") {
    redirect(session.user.role === "CARE_USER" ? "/home" : "/role");
  }
  const ctx = await getCaregiverSession();
  if (!ctx) redirect("/login");
  return ctx;
}

/**
 * Route Handler helper: returns the Caregiver session or null with a status
 * that the route handler can turn into a 401/403 JSON response.
 */
export async function getApiCaregiverSession(): Promise<CaregiverSession | null> {
  return getCaregiverSession();
}

export function unauthenticated() {
  return Response.json({ error: "Please sign in first." }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "This action is for caregivers only." }, { status: 403 });
}

/**
 * Pick the active patient id from an incoming `patient` search param. Falls
 * back to the first linked patient. Returns null only when the caregiver has
 * no linked patients at all.
 */
export function resolvePatientId(
  candidates: string | string[] | undefined,
  patients: PatientSummary[],
): string | null {
  if (patients.length === 0) return null;
  const raw = Array.isArray(candidates) ? candidates[0] : candidates;
  if (raw && patients.some((p) => p.id === raw)) return raw;
  return patients[0].id;
}

/**
 * Guard: like requireCaregiverSession but also deterministically resolves
 * which patient the page is operating on (from `patient` search param) and
 * redirects to /caregiver/relationships if there are no linked patients.
 */
export async function requireActivePatient(
  patientParam: string | string[] | undefined,
): Promise<{ session: CaregiverSession; patient: PatientSummary }> {
  const session = await requireCaregiverSession();
  const patientId = resolvePatientId(patientParam, session.patients);
  if (!patientId) redirect("/caregiver/settings?setup=relationship");
  const patient = session.patients.find((p) => p.id === patientId) as PatientSummary;
  return { session, patient };
}
