import { NextRequest } from "next/server";
import { getApiCareSession, unauthenticated } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/quiz — Generate a fresh memory quiz for the patient.
 *
 * Samples 3–5 questions from the patient's own Memories, People, and Reminders.
 * Distractors are drawn from other real data the patient has stored.
 * Returns questions WITHOUT correctAnswer (so the client can't cheat).
 * Also persists a MemoryQuiz record so we can grade on submit.
 */

type QuestionType = "WHO_IS_THIS" | "WHERE_WAS_THIS" | "WHAT_HAPPENED";

interface GeneratedQuestion {
  id: string;
  questionType: QuestionType;
  questionText: string;
  imageUrl?: string | null;
  options: string[];
  correctAnswer: string;
  sourcePersonId?: string | null;
  sourceMemoryId?: string | null;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistinct<T>(arr: T[], count: number, exclude?: T): T[] {
  const pool = exclude ? arr.filter((x) => x !== exclude) : arr;
  return shuffle(pool).slice(0, count);
}

export async function GET() {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  const profileId = ctx.profile.id;

  // Fetch the patient's data
  const [memories, people, reminders] = await Promise.all([
    prisma.memory.findMany({
      where: { patientId: profileId },
      include: { media: true },
      take: 50,
      orderBy: { date: "desc" },
    }),
    prisma.person.findMany({
      where: { patientId: profileId },
      take: 30,
      orderBy: { createdAt: "asc" },
    }),
    prisma.reminder.findMany({
      where: { patientId: profileId, isActive: true },
      take: 30,
    }),
  ]);

  const questions: GeneratedQuestion[] = [];

  // --- WHO_IS_THIS questions (from People with photos) ---
  const peopleWithPhotos = people.filter((p) => p.photoUrl);
  for (const person of peopleWithPhotos.slice(0, 2)) {
    const otherNames = people
      .filter((p) => p.id !== person.id)
      .map((p) => p.nickname || p.name)
      .filter(Boolean);
    const distractors = shuffle(otherNames).slice(0, 3);
    if (distractors.length < 3) continue; // need at least 3 distractors

    const correct = person.nickname || person.name;
    const options = shuffle([correct, ...distractors]);

    questions.push({
      id: `q-${person.id}`,
      questionType: "WHO_IS_THIS",
      questionText: `Who is this person?`,
      imageUrl: person.photoUrl,
      options,
      correctAnswer: correct,
      sourcePersonId: person.id,
    });
  }

  // --- WHERE_WAS_THIS questions (from Memories with locations) ---
  const memoriesWithLocation = memories.filter((m) => m.location);
  for (const memory of memoriesWithLocation.slice(0, 2)) {
    const otherLocations = memories
      .filter((m) => m.id !== memory.id && m.location)
      .map((m) => m.location!)
      .filter(Boolean);
    const distractors = shuffle(otherLocations).slice(0, 3);
    if (distractors.length < 3) continue;

    const correct = memory.location!;
    const options = shuffle([correct, ...distractors]);

    questions.push({
      id: `q-${memory.id}`,
      questionType: "WHERE_WAS_THIS",
      questionText: `Where was this memory taken?`,
      imageUrl: memory.media.find((m) => m.type === "PHOTO")?.url ?? null,
      options,
      correctAnswer: correct,
      sourceMemoryId: memory.id,
    });
  }

  // --- WHAT_HAPPENED questions (from Memories with descriptions) ---
  const memoriesWithDesc = memories.filter((m) => m.description && m.description.length > 20);
  for (const memory of memoriesWithDesc.slice(0, 2)) {
    const otherDescriptions = memories
      .filter((m) => m.id !== memory.id && m.description && m.description.length > 20)
      .map((m) => m.description!)
      .filter(Boolean);
    const distractors = shuffle(otherDescriptions).slice(0, 3);
    if (distractors.length < 3) continue;

    const correct = memory.description!;
    // For "what happened", use a short excerpt as the question and full description as options
    const excerpt = correct.slice(0, 80) + (correct.length > 80 ? "…" : "");
    const options = shuffle([correct, ...distractors]);

    questions.push({
      id: `q-${memory.id}-happened`,
      questionType: "WHAT_HAPPENED",
      questionText: `What happened here? "${excerpt}"`,
      imageUrl: memory.media.find((m) => m.type === "PHOTO")?.url ?? null,
      options,
      correctAnswer: correct,
      sourceMemoryId: memory.id,
    });
  }

  // If we don't have enough data, fall back to reminder-based questions
  if (questions.length < 3 && reminders.length > 0) {
    for (const reminder of reminders.slice(0, 3)) {
      const otherReminders = reminders
        .filter((r) => r.id !== reminder.id)
        .map((r) => r.title)
        .filter(Boolean);
      const distractors = shuffle(otherReminders).slice(0, 3);
      if (distractors.length < 3) continue;

      const correct = reminder.title;
      const options = shuffle([correct, ...distractors]);

      questions.push({
        id: `q-reminder-${reminder.id}`,
        questionType: "WHAT_HAPPENED",
        questionText: `Which reminder is this?`,
        options,
        correctAnswer: correct,
      });
    }
  }

  // Ensure we have 3-5 questions
  const finalQuestions = shuffle(questions).slice(0, Math.max(3, Math.min(5, questions.length)));

  if (finalQuestions.length === 0) {
    return Response.json({
      quizId: null,
      questions: [],
      message: "Not enough memories or people yet to make a quiz. Share a memory or add a person first! 💛",
    });
  }

  // Persist the quiz + questions (with correct answers) so we can grade on submit
  const quiz = await prisma.memoryQuiz.create({
    data: {
      patientId: profileId,
      questions: {
        create: finalQuestions.map((q) => ({
          sourcePersonId: q.sourcePersonId ?? null,
          sourceMemoryId: q.sourceMemoryId ?? null,
          questionText: q.questionText,
          questionType: q.questionType,
          imageUrl: q.imageUrl ?? null,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
        })),
      },
    },
    include: { questions: true },
  });

  // Return questions WITHOUT correctAnswer
  const clientQuestions = quiz.questions.map((q) => ({
    id: q.id,
    questionType: q.questionType,
    questionText: q.questionText,
    imageUrl: q.imageUrl,
    options: JSON.parse(q.options),
    // correctAnswer omitted intentionally
  }));

  return Response.json({
    quizId: quiz.id,
    questions: clientQuestions,
  });
}

/**
 * POST /api/quiz — Create a quiz manually (not used by the flow; kept for completeness).
 * The GET endpoint above already creates the quiz.
 */
export async function POST(request: NextRequest) {
  return Response.json({ error: "Use GET to generate a quiz." }, { status: 405 });
}