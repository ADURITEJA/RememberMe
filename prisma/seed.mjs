/**
 * Remme — Demo Seed
 * -------------------
 * This seed creates clearly-marked demo data for local development:
 *
 *   Ravi Kumar     — CARE_USER + CareProfile (the patient)
 *   Anitha Kumar   — CAREGIVER linked to Ravi (his daughter)
 *
 *   + 4 daily Reminders (10am meds, 1pm lunch, 5pm walk, 9pm meds)
 *   + 3 People (Anitha · daughter, Rahul · son, Meera · granddaughter)
 *   + 3 Memories (Goa trip, Birthday, Childhood home) each with
 *     MemoryMedia and a MemoryTranscript
 *   + 1 SafetyZone ("Home", Bangalore, 300m radius, active)
 *   + MoodCheckIns for the past seven days
 *   + 1 MemoryQuiz (3 questions) + 2 sample attempts
 *
 * All demo users are passwordless OAuth-style records but include a
 * known password hash so the demo can also be reached with:
 *     email: ravi@remme.demo        password: remme-demo-password
 *
 * Idempotent: re-running replaces the same demo content.
 *
 * Run with: npm run db:seed   (prisma db seed)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "remme-demo-password";
const DEMO_TAG = "[demo-seed]";

/* ------------------------------------------------------------------ helpers */

async function upsertByEmail({ name, email, role }) {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { name, email, role, password, emailVerified: new Date() },
  });
}

function daysAgoUTC(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 30, 0, 0);
  return d;
}

/* ------------------------------------------------------------------ main */

async function main() {
  console.log(`${DEMO_TAG} Starting demo seed…`);

  // 1. Users ---------------------------------------------------------------
  const ravi = await upsertByEmail({
    name: "Ravi Kumar",
    email: "ravi@remme.demo",
    role: "CARE_USER",
  });
  const anitha = await upsertByEmail({
    name: "Anitha Kumar",
    email: "anitha@remme.demo",
    role: "CAREGIVER",
  });

  const careProfile = await prisma.careProfile.upsert({
    where: { userId: ravi.id },
    update: {
      dateOfBirth: new Date("1949-03-14T00:00:00.000Z"),
      address: "12, Palm Grove, Indiranagar, Bengaluru",
      diagnosis: "Early-stage dementia (demo record)",
      medicalNotes:
        "Demo notes: keep routines gentle, prefer simple one-step instructions.",
    },
    create: {
      userId: ravi.id,
      dateOfBirth: new Date("1949-03-14T00:00:00.000Z"),
      address: "12, Palm Grove, Indiranagar, Bengaluru",
      diagnosis: "Early-stage dementia (demo record)",
      medicalNotes:
        "Demo notes: keep routines gentle, prefer simple one-step instructions.",
    },
  });

  // 2. Clear this patient's prior demo content (idempotency) -----------------
  await prisma.zoneEvent.deleteMany({
    where: { zone: { patientId: careProfile.id } },
  });
  await prisma.locationPing.deleteMany({
    where: { patientId: careProfile.id },
  });
  await prisma.safetyZone.deleteMany({
    where: { patientId: careProfile.id },
  });
  await prisma.memoryQuizAttempt.deleteMany({
    where: { quiz: { patientId: careProfile.id } },
  });
  await prisma.memoryQuizQuestion.deleteMany({
    where: { quiz: { patientId: careProfile.id } },
  });
  await prisma.memoryQuiz.deleteMany({
    where: { patientId: careProfile.id },
  });
  await prisma.memoryTranscript.deleteMany({
    where: { memory: { patientId: careProfile.id } },
  });
  await prisma.memoryMedia.deleteMany({
    where: { memory: { patientId: careProfile.id } },
  });
  await prisma.memory.deleteMany({
    where: { patientId: careProfile.id },
  });
  await prisma.person.deleteMany({
    where: { patientId: careProfile.id },
  });
  await prisma.reminderOccurrence.deleteMany({
    where: { reminder: { patientId: careProfile.id } },
  });
  await prisma.reminder.deleteMany({
    where: { patientId: careProfile.id },
  });
  await prisma.moodCheckIn.deleteMany({
    where: { patientId: careProfile.id },
  });
  await prisma.notification.deleteMany({
    where: { patientId: careProfile.id },
  });
  await prisma.caregiverRelationship.deleteMany({
    where: { patientId: careProfile.id },
  });

  // 3. Caregiver link ---------------------------------------------------------
  await prisma.caregiverRelationship.create({
    data: {
      caregiverId: anitha.id,
      patientId: careProfile.id,
      permissions: JSON.stringify({
        alerts: true,
        reminders: true,
        location: true,
        memories: true,
      }),
    },
  });

  // 4. Reminders ----------------------------------------------------------------
  const reminderDefaults = { recurrence: "DAILY", isActive: true, patientId: careProfile.id };
  await prisma.reminder.createMany({
    data: [
      { ...reminderDefaults, title: "Morning pills", description: "Blood pressure + vitamin D", time: "10:00", category: "Medication" },
      { ...reminderDefaults, title: "Lunch time", description: "Warm meal with a glass of water", time: "13:00", category: "Meals" },
      { ...reminderDefaults, title: "Evening walk", description: "A gentle stroll around the garden", time: "17:00", category: "Exercise" },
      { ...reminderDefaults, title: "Night pills", description: "Evening medication after dinner", time: "21:00", category: "Medication" },
    ],
  });

  // 5. People ---------------------------------------------------------------------
  const [anithaPerson, rahulPerson, meeraPerson] = await Promise.all([
    prisma.person.create({
      data: {
        patientId: careProfile.id,
        name: "Anitha",
        relationship: "Daughter",
        nickname: "Anu",
        phoneNumber: "+91 98450 12345",
        description: "Lives nearby and checks in every morning.",
      },
    }),
    prisma.person.create({
      data: {
        patientId: careProfile.id,
        name: "Rahul",
        relationship: "Son",
        nickname: "Rahul",
        phoneNumber: "+91 98450 67890",
        description: "Far away but calls on Sundays.",
      },
    }),
    prisma.person.create({
      data: {
        patientId: careProfile.id,
        name: "Meera",
        relationship: "Granddaughter",
        nickname: "Chinnu",
        phoneNumber: "+91 98220 12345",
        description: "Visits every school holiday.",
      },
    }),
  ]);

  // 6. Memories (each with media + transcript) -----------------------------------
  const memories = [
    {
      title: "Goa beach trip",
      description: "The family holiday to Calangute beach in 1998.",
      location: "Calangute, Goa",
      date: new Date("1998-12-20T00:00:00.000Z"),
      media: [
        { type: "PHOTO", url: "/images/demo/goa-beach.jpg" },
        { type: "VOICE", url: "/audio/demo/goa-trip-note.mp3" },
      ],
      transcriptText:
        "We walked along Calangute beach in the evening. The children had ice cream and we watched the boats come in.",
    },
    {
      title: "My 60th birthday",
      description: "A surprise family dinner for Ravi's 60th.",
      location: "Bengaluru",
      date: new Date("2009-03-14T00:00:00.000Z"),
      media: [{ type: "PHOTO", url: "/images/demo/birthday-dinner.jpg" }],
      transcriptText:
        "The whole family surprised me on my sixtieth birthday. There was a big chocolate cake and everyone sang.",
    },
    {
      title: "Childhood home in Mysuru",
      description: "The house where Ravi grew up.",
      location: "Mysuru, Karnataka",
      date: new Date("1965-08-01T00:00:00.000Z"),
      media: [
        { type: "PHOTO", url: "/images/demo/old-home.jpg" },
        { type: "PHOTO", url: "/images/demo/old-home-garden.jpg" },
      ],
      transcriptText:
        "Our house in Mysuru had a big tamarind tree in the garden. Amma used to make pickle from the fruit every year.",
    },
  ];

  for (const m of memories) {
    const memory = await prisma.memory.create({
      data: {
        patientId: careProfile.id,
        title: m.title,
        description: m.description,
        location: m.location,
        date: m.date,
      },
    });
    for (const media of m.media) {
      await prisma.memoryMedia.create({
        data: { memoryId: memory.id, type: media.type, url: media.url },
      });
    }
    await prisma.memoryTranscript.create({
      data: { memoryId: memory.id, text: m.transcriptText },
    });
  }

  // 7. SafetyZone -----------------------------------------------------------------
  const homeZone = await prisma.safetyZone.create({
    data: {
      patientId: careProfile.id,
      name: "Home",
      lat: 12.9784,
      lng: 77.6408,
      radius: 300,
      isActive: true,
      activeHours: JSON.stringify([
        { start: "20:00", end: "08:00" },
      ]),
    },
  });
  void homeZone; // referenced above for clarity; zone fully created

  // 8. MoodCheckIns for the past week ----------------------------------------------
  const moods = ["GOOD", "OKAY", "GOOD", "BAD", "OKAY", "GOOD", "OKAY"];
  for (let i = 6; i >= 0; i--) {
    await prisma.moodCheckIn.create({
      data: {
        patientId: careProfile.id,
        mood: moods[i],
        note: i === 3 ? "Slightly confused in the afternoon." : undefined,
        createdAt: daysAgo(i, 18),
      },
    });
  }

  // 9. MemoryQuiz + attempts ---------------------------------------------------------
  // Re-fetch the demo memories to reference them in questions.
  const demoMemories = await prisma.memory.findMany({
    where: { patientId: careProfile.id },
    orderBy: { date: "asc" },
  });
  const goa = demoMemories.find((m) => m.title.includes("Goa"));
  const birthday = demoMemories.find((m) => m.title.includes("birthday"));

  const quiz = await prisma.memoryQuiz.create({
    data: { patientId: careProfile.id, date: daysAgoUTC(1) },
  });

  const questionSeed = [
    {
      questionText: "Who came with you to Goa on that beach holiday?",
      questionType: "WHO_IS_THIS",
      sourceMemoryId: goa?.id ?? null,
      sourcePersonId: anithaPerson.id,
      options: JSON.stringify(["Anitha", "Rahul", "Meera", "All of them"]),
      correctAnswer: "All of them",
    },
    {
      questionText: "Where was the beach trip?",
      questionType: "WHERE_WAS_THIS",
      sourceMemoryId: goa?.id ?? null,
      sourcePersonId: null,
      options: JSON.stringify(["Bengaluru", "Calangute, Goa", "Mysuru", "Ooty"]),
      correctAnswer: "Calangute, Goa",
    },
    {
      questionText: "What happened on your 60th birthday?",
      questionType: "WHAT_HAPPENED",
      sourceMemoryId: birthday?.id ?? null,
      sourcePersonId: null,
      options: JSON.stringify([
        "A surprise family dinner with a big cake",
        "A trip to the doctor",
        "A quiet day at home",
        "We moved houses",
      ]),
      correctAnswer: "A surprise family dinner with a big cake",
    },
  ];

  for (const q of questionSeed) {
    await prisma.memoryQuizQuestion.create({
      data: {
        quizId: quiz.id,
        sourceMemoryId: q.sourceMemoryId,
        sourcePersonId: q.sourcePersonId,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        correctAnswer: q.correctAnswer,
      },
    });
  }

  await prisma.memoryQuizAttempt.create({
    data: {
      quizId: quiz.id,
      score: 3,
      details: JSON.stringify(
        questionSeed.map((q, index) => ({
          question: q.questionText,
          userAnswer: q.correctAnswer,
          correct: true,
          order: index,
        })),
      ),
      completedAt: daysAgoUTC(1),
    },
  });
  await prisma.memoryQuizAttempt.create({
    data: {
      quizId: quiz.id,
      score: 2,
      details: JSON.stringify(
        questionSeed.map((q, index) => ({
          question: q.questionText,
          userAnswer: index === 2 ? "A quiet day at home" : q.correctAnswer,
          correct: index !== 2,
          order: index,
        })),
      ),
      completedAt: daysAgoUTC(0),
    },
  });

  console.log(
    `${DEMO_TAG} Done. Demo logins — ravi@remme.demo / anitha@remme.demo with password "${DEMO_PASSWORD}".`,
  );
  console.log(`${DEMO_TAG} Patient profile: ${careProfile.id}`);
}

main()
  .catch((e) => {
    console.error(`${DEMO_TAG} Seed failed:`, e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });