import { NextResponse } from "next/server";
import {
  getApiCaregiverSession,
  unauthenticated,
} from "@/components/caregiver/caregiver-db";

/**
 * GET /api/caregiver/relationships
 * Returns the signed-in caregiver plus every patient CareProfile they are
 * linked to. The client PatientSwitcher renders this to offer patient names.
 */
export async function GET() {
  const ctx = await getApiCaregiverSession();
  if (!ctx) return unauthenticated();

  return NextResponse.json({
    user: {
      id: ctx.userId,
      name: ctx.userName,
      email: ctx.userEmail ?? null,
    },
    patients: ctx.patients,
  });
}
