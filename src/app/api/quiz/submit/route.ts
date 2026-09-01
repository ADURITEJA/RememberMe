import { NextRequest } from "next/server";
import { getApiCareSession, unauthenticated } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/quiz/submit — Grade a completed quiz.
 *
 * Body: { quizId: string, answers: Record<string, string> }
 * Each answer key is questionId, value is the selected option string.
 * Returns: { score: number, total: number, details: { questionId, selected, correct, isCorrect }[] }
 * Persists a MemoryQuizAttempt.
 */

export async function POST(request: NextRequest) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  let body: { quizId?: string; answers?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { quizId, answers } = body;
  if (!quizId || !answers) {
    return Response.json({ error: "quizId and answers are required." }, { status: 400 });
  }

  // Fetch the quiz with questions (including correct answers)
  const quiz = await prisma.memoryQuiz.findUnique({
    where: { id: quizId, patientId: ctx.profile.id },
    include: { questions: true },
  });

  if (!quiz) {
    return Response.json({ error: "Quiz not found." }, { status: 404 });
  }

  // Grade each answer
  const details: Array<{
    questionId: string;
    questionText: string;
    selected: string;
    correct: string;
    isCorrect: boolean;
  }> = [];

  let score = 0;

  for (const question of quiz.questions) {
    const selected = answers[question.id] ?? "";
    const isCorrect = selected === question.correctAnswer;
    if (isCorrect) score++;
    details.push({
      questionId: question.id,
      questionText: question.questionText,
      selected,
      correct: question.correctAnswer,
      isCorrect,
    });
  }

  // Persist the attempt
  await prisma.memoryQuizAttempt.create({
    data: {
      quizId,
      score,
      details: JSON.stringify(details),
    },
  });

  return Response.json({
    score,
    total: quiz.questions.length,
    details,
    passed: score >= Math.ceil(quiz.questions.length / 2),
  });
}

/**
 * GET /api/quiz/submit — List past attempts for the patient.
 */
export async function GET() {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  const attempts = await prisma.memoryQuizAttempt.findMany({
    where: { quiz: { patientId: ctx.profile.id } },
    include: { quiz: { select: { id: true, date: true } } },
    orderBy: { completedAt: "desc" },
    take: 20,
  });

  return Response.json({
    attempts: attempts.map((a) => ({
      id: a.id,
      quizId: a.quizId,
      score: a.score,
      details: JSON.parse(a.details),
      completedAt: a.completedAt,
      quizDate: a.quiz.date,
    })),
  });
}