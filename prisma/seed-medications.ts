/**
 * Seed demo medications + MedicationLog entries for Ravi Kumar.
 *
 * Run: npx tsx prisma/seed-medications.ts
 */

import { PrismaClient } from "@prisma/client";
import { subDays, setHours, setMinutes, startOfDay, subHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  // Find Ravi Kumar's CareProfile
  const raviUser = await prisma.user.findFirst({
    where: { email: "ravi@remme.demo" },
    include: { careProfile: true },
  });

  if (!raviUser?.careProfile) {
    console.error("Could not find ravi@remme.demo or their CareProfile.");
    process.exit(1);
  }

  const patientId = raviUser.careProfile.id;
  console.log(`Seeding medications for patient ${patientId} (Ravi Kumar)...`);

  // Remove existing medications for this patient (idempotent re-seed)
  await prisma.medicationLog.deleteMany({
    where: { medication: { patientId } },
  });
  await prisma.medication.deleteMany({ where: { patientId } });

  const now = new Date();

  // Create medications
  const donepezil = await prisma.medication.create({
    data: {
      patientId,
      name: "Donepezil",
      dosage: "10mg",
      instructions: "Take with breakfast",
      frequency: "DAILY",
      times: "09:00",
      refillDate: new Date(now.getTime() + 14 * 86400000), // 14 days from now
    },
  });

  const metformin = await prisma.medication.create({
    data: {
      patientId,
      name: "Metformin",
      dosage: "500mg",
      instructions: "Take with lunch",
      frequency: "DAILY",
      times: "13:00",
      refillDate: new Date(now.getTime() + 21 * 86400000), // 21 days from now
    },
  });

  const amlodipine = await prisma.medication.create({
    data: {
      patientId,
      name: "Amlodipine",
      dosage: "5mg",
      instructions: "Take at bedtime",
      frequency: "DAILY",
      times: "21:00",
      refillDate: new Date(now.getTime() + 30 * 86400000), // 30 days from now
    },
  });

  console.log(`Created 3 medications: ${donepezil.name}, ${metformin.name}, ${amlodipine.name}`);

  // Generate logs for the last 7 days to populate adherence data
  const meds = [
    { id: donepezil.id, time: "09:00" },
    { id: metformin.id, time: "13:00" },
    { id: amlodipine.id, time: "21:00" },
  ];

  let logCount = 0;

  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const day = startOfDay(subDays(now, daysAgo));
    const [h, m] = ["0", "1", "2"].map(() => 0); // placeholder, overridden per med

    for (const med of meds) {
      const [medH, medM] = med.time.split(":").map(Number);
      const scheduledFor = setMinutes(setHours(day, medH), medM);

      // Vary status: mostly TAKEN, a few SKIPPED, one MISSED
      let status: "TAKEN" | "SKIPPED" | "MISSED";
      const rand = Math.random();

      if (daysAgo === 0) {
        // Today: only past doses are logged
        const hourNow = now.getHours();
        if (medH > hourNow) continue; // Not yet due
        status = rand > 0.15 ? "TAKEN" : "SKIPPED";
      } else if (daysAgo === 1 && med.id === metformin.id) {
        status = "SKIPPED"; // Consistent skip for demo
      } else if (daysAgo === 3 && med.id === donepezil.id) {
        status = "MISSED"; // One missed dose for demo
      } else {
        status = rand > 0.1 ? "TAKEN" : (rand > 0.05 ? "SKIPPED" : "MISSED");
      }

      const takenAt = status !== "MISSED"
        ? new Date(scheduledFor.getTime() + (Math.random() * 1800000)) // within 30 min
        : null;

      try {
        await prisma.medicationLog.create({
          data: {
            medicationId: med.id,
            scheduledFor,
            status,
            takenAt,
          },
        });
        logCount++;
      } catch {
        // Skip duplicates (shouldn't happen with deleteMany above)
      }
    }
  }

  console.log(`Created ${logCount} MedicationLog entries across the last 7 days.`);

  // Seed notifications for Ravi
  await prisma.notification.deleteMany({ where: { patientId } });

  const yesterday = subDays(now, 1);
  const twoDaysAgo = subDays(now, 2);

  await prisma.notification.createMany({
    data: [
      {
        patientId,
        title: "Missed medication",
        body: "You missed Donepezil 10mg at 9:00 AM yesterday — that's okay, just a heads up 💛",
        type: "MISSED_MEDICATION",
        isRead: true,
        createdAt: yesterday,
      },
      {
        patientId,
        title: "Reminder from Anitha",
        body: "Don't forget your evening walk with Anitha today! 🌇",
        type: "CAREGIVER_NOTE",
        isRead: false,
        createdAt: yesterday,
      },
      {
        patientId,
        title: "Check-in",
        body: "Anitha wants to know how your day was 💛",
        type: "CHECK_IN",
        isRead: false,
        createdAt: twoDaysAgo,
      },
      {
        patientId,
        title: "Missed medication",
        body: "You missed Metformin 500mg at 1:00 PM — no worries, just letting you know 💛",
        type: "MISSED_MEDICATION",
        isRead: false,
        createdAt: twoDaysAgo,
      },
    ],
  });

  console.log("Created 4 demo notifications.");
  console.log("Done! 🎉");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
