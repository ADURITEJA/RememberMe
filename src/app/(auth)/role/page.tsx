import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  RoleSelector,
  type RoleOptionData,
} from "@/components/auth/RoleSelector";
import type { PatientSummary } from "@/components/auth/PatientPicker";

/**
 * /role — "Who are you signing in as?"
 * Skips straight to the destination when the account can only act as one role.
 */
export default async function RolePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [careProfile, relationships] = await Promise.all([
    prisma.careProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
    prisma.caregiverRelationship.findMany({
      where: { caregiverId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: {
        patient: {
          select: {
            id: true,
            user: { select: { name: true, email: true, image: true } },
          },
        },
      },
    }),
  ]);

  const options: RoleOptionData[] = [];

  if (careProfile || session.user.role === "CARE_USER") {
    options.push({
      type: "patient",
      primary: "I am a patient",
      description:
        "Open your gentle daily companion — reminders, memories, and people.",
      href: "/home",
    });
  }

  const patients: PatientSummary[] = relationships.map((rel) => ({
    id: rel.patient.id,
    name: rel.patient.user.name,
    email: rel.patient.user.email,
    avatar: rel.patient.user.image,
  }));

  if (session.user.role === "CAREGIVER" || patients.length > 0) {
    options.push({
      type: "caregiver",
      primary: "I am a caregiver",
      description:
        "Look after the people you love — reach out, check in, stay aware.",
      href: "/caregiver/dashboard",
      patients,
    });
  }

  if (session.user.role === "ADMIN") {
    options.push({
      type: "admin",
      primary: "I am an administrator",
      description: "Manage Remme accounts and system settings.",
      href: "/admin",
    });
  }

  // Only a caregiver with no linked patients: still let them in.
  if (options.length === 0 && session.user.role === "CAREGIVER") {
    redirect("/caregiver/dashboard");
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-remme-ink dark:text-remme-inklight">
        Choose your view
      </h2>
      <p className="text-lg text-remme-ink/60 dark:text-remme-inklight/60">
        This account can act as more than one role.
      </p>
      <RoleSelector
        userName={session.user.name}
        email={session.user.email}
        options={options}
      />
    </div>
  );
}