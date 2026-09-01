/**
 * Seed demo data for Ravi Kumar across all non-medication features:
 * People, Memories, Mood Check-ins, Routines, Memory Quiz, Emergency
 * Contacts, Important Places, Safety Zones, Location Pings, Zone Events,
 * and a Memory Report.
 *
 * Run: npx tsx prisma/seed-demo.ts
 */

import { PrismaClient } from "@prisma/client";
import { subDays, subHours } from "date-fns";

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
  console.log(`Seeding demo data for patient ${patientId} (Ravi Kumar)...`);

  const now = new Date();

  // --- Idempotent cleanup (order matters for FK constraints) ---
  await prisma.zoneEvent.deleteMany({ where: { ping: { patientId } } });
  await prisma.locationPing.deleteMany({ where: { patientId } });
  await prisma.safetyZone.deleteMany({ where: { patientId } });
  await prisma.importantPlace.deleteMany({ where: { patientId } });
  await prisma.emergencyContact.deleteMany({ where: { patientId } });
  await prisma.memoryQuizAttempt.deleteMany({ where: { quiz: { patientId } } });
  await prisma.memoryQuizQuestion.deleteMany({ where: { quiz: { patientId } } });
  await prisma.memoryQuiz.deleteMany({ where: { patientId } });
  await prisma.memoryTranscript.deleteMany({ where: { memory: { patientId } } });
  await prisma.memoryMedia.deleteMany({ where: { memory: { patientId } } });
  await prisma.memory.deleteMany({ where: { patientId } });
  await prisma.routineStep.deleteMany({ where: { routine: { patientId } } });
  await prisma.routine.deleteMany({ where: { patientId } });
  await prisma.moodCheckIn.deleteMany({ where: { patientId } });
  await prisma.person.deleteMany({ where: { patientId } });
  await prisma.memoryReport.deleteMany({ where: { patientId } });

  // --- 1. PEOPLE ---
  const people = await Promise.all([
    prisma.person.create({
      data: {
        patientId,
        name: "Anitha",
        relationship: "Daughter",
        nickname: "Anni",
        phoneNumber: "+91-98765-43210",
        description: "Appa, I'll bring your favourite sweets this weekend",
      },
    }),
    prisma.person.create({
      data: {
        patientId,
        name: "Rajesh",
        relationship: "Son",
        phoneNumber: "+91-98765-43211",
        description: "Call me whenever you need, Appa",
      },
    }),
    prisma.person.create({
      data: {
        patientId,
        name: "Dr. Lakshmi",
        relationship: "Doctor",
        phoneNumber: "+91-98765-43212",
        description: "Regular checkup every month",
      },
    }),
    prisma.person.create({
      data: {
        patientId,
        name: "Priya",
        relationship: "Granddaughter",
        nickname: "Pinky",
        description: "I made this drawing for you, Thatha!",
      },
    }),
    prisma.person.create({
      data: {
        patientId,
        name: "Sunil",
        relationship: "Neighbour",
        phoneNumber: "+91-98765-43213",
        description: "Morning walk at 6:30 AM, don't be late!",
      },
    }),
    prisma.person.create({
      data: {
        patientId,
        name: "Meena",
        relationship: "Care Nurse",
        phoneNumber: "+91-98765-43214",
        description: "I visit on Tuesdays and Fridays",
      },
    }),
  ]);
  console.log(`Created ${people.length} people.`);

  // --- 2. MEMORIES ---
  const memoriesData = [
    {
      title: "Wedding Day",
      description:
        "Our wedding at Mysore Palace. Amma looked beautiful in the silk saree.",
      date: new Date("1968-04-12"),
      location: "Mysore Palace",
    },
    {
      title: "First House",
      description: "We bought our first home. Rajesh was just 2 years old.",
      date: new Date("1972-01-15"),
      location: "Jay Nagar, Bangalore",
    },
    {
      title: "Rajesh's Graduation",
      description:
        "So proud of Rajesh graduating with honours from Bangalore University.",
      date: new Date("1994-06-20"),
      location: "Bangalore University",
    },
    {
      title: "Family Trip to Ooty",
      description:
        "Christmas trip to Ooty with the whole family. Priya loved the toy train.",
      date: new Date("2005-12-25"),
      location: "Ooty",
    },
    {
      title: "My Garden",
      description: "My roses bloomed beautifully this year.",
      date: new Date("2010-03-15"),
      location: "Home Garden",
    },
  ];

  const memories = [];
  for (const m of memoriesData) {
    const memory = await prisma.memory.create({
      data: {
        patientId,
        title: m.title,
        description: m.description,
        date: m.date,
        location: m.location,
      },
    });
    await prisma.memoryMedia.create({
      data: { memoryId: memory.id, type: "PHOTO", url: "/demo/memory.jpg" },
    });
    memories.push(memory);
  }
  console.log(`Created ${memories.length} memories (each with a photo placeholder).`);

  // --- 3. MOOD CHECK-INS (last 7 days) ---
  const moodData = [
    { mood: "GOOD", note: "Had a lovely walk with Sunil" },
    { mood: "OKAY", note: "Felt a bit confused after lunch" },
    { mood: "GOOD", note: "Beautiful sunny day" },
    { mood: "BAD", note: "Couldn't sleep well last night" },
    { mood: "OKAY", note: "Rajesh called — felt happy" },
    { mood: "GOOD", note: "Morning yoga went well" },
    { mood: "GOOD", note: "Peaceful day at home" },
  ];

  for (let i = 0; i < moodData.length; i++) {
    await prisma.moodCheckIn.create({
      data: {
        patientId,
        mood: moodData[i].mood,
        note: moodData[i].note,
        createdAt: subDays(now, moodData.length - 1 - i),
      },
    });
  }
  console.log(`Created ${moodData.length} mood check-ins.`);

  // --- 4. ROUTINES + STEPS ---
  const routinesData = [
    {
      name: "Morning Routine",
      steps: [
        { title: "Wake up & wash face", timeEst: "06:30 AM" },
        { title: "Take morning medication", timeEst: "08:00 AM" },
        { title: "Breakfast", timeEst: "08:30 AM" },
      ],
    },
    {
      name: "Afternoon Routine",
      steps: [
        { title: "Lunch", timeEst: "12:30 PM" },
        { title: "Afternoon rest", timeEst: "01:30 PM" },
        { title: "Tea", timeEst: "04:00 PM" },
      ],
    },
    {
      name: "Evening Routine",
      steps: [
        { title: "Evening walk with Sunil", timeEst: "06:00 PM" },
        { title: "Dinner", timeEst: "07:30 PM" },
        { title: "Take evening medication", timeEst: "08:30 PM" },
        { title: "Bedtime", timeEst: "09:30 PM" },
      ],
    },
  ];

  for (const r of routinesData) {
    const routine = await prisma.routine.create({
      data: { patientId, name: r.name },
    });
    for (let i = 0; i < r.steps.length; i++) {
      await prisma.routineStep.create({
        data: {
          routineId: routine.id,
          title: r.steps[i].title,
          timeEst: r.steps[i].timeEst,
          order: i,
        },
      });
    }
  }
  console.log(`Created ${routinesData.length} routines with steps.`);

  // --- 5. MEMORY QUIZ + QUESTIONS ---
  const quiz = await prisma.memoryQuiz.create({
    data: { patientId, date: now },
  });

  const questionsData = [
    {
      questionText: "Where did our wedding take place?",
      questionType: "WHERE_WAS_THIS",
      options: JSON.stringify(["Tirupati Temple", "Mysore Palace", "Bangalore", "Chennai"]),
      correctAnswer: "Mysore Palace",
      sourceMemoryId: memories[0].id,
    },
    {
      questionText: "When did we buy our first house?",
      questionType: "WHAT_HAPPENED",
      options: JSON.stringify(["1965", "1972", "1980", "1995"]),
      correctAnswer: "1972",
      sourceMemoryId: memories[1].id,
    },
    {
      questionText: "Who is this?",
      questionType: "WHO_IS_THIS",
      options: JSON.stringify(["Anitha", "Rajesh", "Priya", "Sunil"]),
      correctAnswer: "Rajesh",
      sourcePersonId: people[1].id,
    },
    {
      questionText: "Where did we go on our Christmas family trip?",
      questionType: "WHERE_WAS_THIS",
      options: JSON.stringify(["Mysore", "Ooty", "Goa", "Delhi"]),
      correctAnswer: "Ooty",
      sourceMemoryId: memories[3].id,
    },
    {
      questionText: "What did Priya love on the Ooty trip?",
      questionType: "WHAT_HAPPENED",
      options: JSON.stringify(["The lake", "The toy train", "The chocolate", "The garden"]),
      correctAnswer: "The toy train",
      sourceMemoryId: memories[3].id,
    },
  ];

  for (const q of questionsData) {
    await prisma.memoryQuizQuestion.create({
      data: {
        quizId: quiz.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        correctAnswer: q.correctAnswer,
        sourcePersonId: q.sourcePersonId ?? null,
        sourceMemoryId: q.sourceMemoryId ?? null,
      },
    });
  }
  console.log(`Created quiz with ${questionsData.length} questions.`);

  // --- 6. EMERGENCY CONTACTS ---
  const contactsData = [
    { name: "Anitha", phoneNumber: "+91-98765-43210", relationship: "Daughter", order: 1 },
    { name: "Rajesh", phoneNumber: "+91-98765-43211", relationship: "Son", order: 2 },
    { name: "Dr. Lakshmi", phoneNumber: "+91-98765-43212", relationship: "Doctor", order: 3 },
  ];

  for (const c of contactsData) {
    await prisma.emergencyContact.create({ data: { patientId, ...c } });
  }
  console.log(`Created ${contactsData.length} emergency contacts.`);

  // --- 7. IMPORTANT PLACES ---
  const placesData = [
    {
      name: "Home",
      address: "12 Jay Nagar, Bangalore 560041",
      lat: 12.9716,
      lng: 77.5946,
      contactNumber: "+91-98765-43210",
      notes: "Our family home",
    },
    {
      name: "Mysore Palace",
      address: "Mysore Palace, Mysuru 570001",
      lat: 12.3052,
      lng: 76.6551,
      notes: "Where we got married",
    },
    {
      name: "Sanjay Gandhi Hospital",
      address: "Vijayanagar, Bangalore 560040",
      lat: 12.974,
      lng: 77.54,
      contactNumber: "+91-98765-43215",
      notes: "Dr. Lakshmi's clinic",
    },
  ];

  for (const p of placesData) {
    await prisma.importantPlace.create({ data: { patientId, ...p } });
  }
  console.log(`Created ${placesData.length} important places.`);

  // --- 8. SAFETY ZONES ---
  const home = await prisma.safetyZone.create({
    data: {
      patientId,
      name: "Home Zone",
      lat: 12.9716,
      lng: 77.5946,
      radius: 500,
      isActive: true,
    },
  });
  const walk = await prisma.safetyZone.create({
    data: {
      patientId,
      name: "Neighbourhood Walk Zone",
      lat: 12.972,
      lng: 77.596,
      radius: 1000,
      isActive: true,
    },
  });
  console.log("Created 2 safety zones.");
  const zones = [home, walk];

  // --- 9. LOCATION PINGS + ZONE EVENTS ---
  const pingsData = [
    { lat: 12.9716, lng: 77.5946, hoursAgo: 60 }, // inside home
    { lat: 12.9718, lng: 77.5948, hoursAgo: 48 }, // inside home
    { lat: 12.9755, lng: 77.5990, hoursAgo: 30 }, // inside walk zone
    { lat: 12.9820, lng: 77.6020, hoursAgo: 22 }, // outside zones
    { lat: 12.9715, lng: 77.5945, hoursAgo: 2 },  // back at home
  ];
  const pings = [];
  for (let i = 0; i < pingsData.length; i++) {
    const ping = await prisma.locationPing.create({
      data: {
        patientId,
        lat: pingsData[i].lat,
        lng: pingsData[i].lng,
        accuracy: 12,
        battery: 70 - i * 5,
        createdAt: subHours(now, pingsData[i].hoursAgo),
      },
    });
    pings.push(ping);
  }

  // Zone events: one EXIT (ping #3 heading out) and one ENTRY (ping #4 returning)
  await prisma.zoneEvent.create({
    data: {
      zoneId: walk.id,
      pingId: pings[3].id,
      type: "EXIT",
      createdAt: pings[3].createdAt,
    },
  });
  await prisma.zoneEvent.create({
    data: {
      zoneId: home.id,
      pingId: pings[4].id,
      type: "ENTRY",
      createdAt: pings[4].createdAt,
    },
  });
  console.log(`Created ${pings.length} location pings and 2 zone events.`);

  // --- 10. MEMORY REPORT ---
  await prisma.memoryReport.create({
    data: {
      patientId,
      period: "WEEKLY",
      startDate: subDays(now, 7),
      endDate: now,
      fileUrl: "/reports/weekly-summary.pdf",
      generatedBy: "System",
    },
  });
  console.log("Created 1 memory report.");

  console.log("Demo data seeding complete! 🎉");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
