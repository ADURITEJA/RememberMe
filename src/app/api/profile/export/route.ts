import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile/export — Export all of the current user's data as JSON (GDPR).
 * Returns a downloadable JSON file with all linked records.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      careProfile: {
        select: {
          id: true,
          dateOfBirth: true,
          address: true,
          diagnosis: true,
          medicalNotes: true,
          reminders: true,
          medications: true,
          people: true,
          memories: true,
          routines: { include: { steps: true } },
          moodCheckIns: true,
          importantPlaces: true,
          safetyZones: true,
          emergencyContacts: true,
          notifications: true,
          memoryQuizzes: true,
        },
      },
      caregiverRelationships: {
        select: {
          id: true,
          patientId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Serialize dates to ISO strings
  const data = JSON.parse(JSON.stringify(user, (_key, value) => {
    if (value instanceof Date) return value.toISOString();
    return value;
  }));

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="remme-data-${user.email ?? user.id}.json"`,
    },
  });
}
