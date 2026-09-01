import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

/**
 * Generate a MISSED_MEDICATION alert + patient notification when a dose
 * is skipped or missed. Fire-and-forget: call with `.catch(console.error)`.
 */
export async function generateMissedMedicationAlert(
  medicationId: string,
  scheduledFor: Date,
) {
  const medication = await prisma.medication.findUnique({
    where: { id: medicationId },
    include: {
      patient: {
        include: {
          caregivers: {
            include: { caregiver: true },
          },
        },
      },
    },
  });

  if (!medication) return;

  const timeLabel = format(scheduledFor, "h:mm a");
  const medLabel = `${medication.name} ${medication.dosage}`;

  // Alert for the caregiver (target the first linked caregiver)
  const firstCaregiver = medication.patient.caregivers[0];
  if (firstCaregiver) {
    await prisma.alert.create({
      data: {
        patientId: medication.patientId,
        targetUserId: firstCaregiver.caregiverId,
        type: "MISSED_MEDICATION",
        message: `Missed dose of ${medLabel} at ${timeLabel}`,
        isRead: false,
      },
    });
  }

  // Notification for the patient
  await prisma.notification.create({
    data: {
      patientId: medication.patientId,
      title: "Missed medication",
      body: `You missed ${medLabel} at ${timeLabel} — that's okay, just a heads up 💛`,
      type: "MISSED_MEDICATION",
      isRead: false,
    },
  });
}
