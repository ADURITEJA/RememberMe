import { NextRequest, NextResponse } from "next/server";
import { getApiCaregiverSession, unauthenticated } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, differenceInCalendarDays } from "date-fns";
import { jsPDF } from "jspdf";

/**
 * GET /api/reports?patient=<profileId>&period=DAY|WEEK|MONTH&start=ISO&end=ISO
 * Returns aggregated data for the period.
 *
 * POST /api/reports
 * Generates and returns a PDF report.
 * Body: { patientId, period, startDate, endDate }
 */
function periodToRange(period: string, anchor = new Date()) {
  const end = endOfDay(anchor);
  let start: Date;
  if (period === "DAY") start = startOfDay(anchor);
  else if (period === "WEEK") start = startOfDay(subDays(anchor, 6));
  else if (period === "MONTH") start = startOfDay(subDays(anchor, 29));
  else start = startOfDay(subDays(anchor, 6));
  return { start, end };
}

async function buildReportData(patientId: string, period: string, start: Date, end: Date) {
  const [quizAttempts, moodCheckIns, memoryCount, reminderCompletion] = await Promise.all([
    prisma.memoryQuizAttempt.findMany({
      where: {
        quiz: { patientId },
        completedAt: { gte: start, lte: end },
      },
      orderBy: { completedAt: "asc" },
      include: { quiz: { select: { id: true } } },
    }),
    prisma.moodCheckIn.findMany({
      where: { patientId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.memory.count({ where: { patientId } }),
    prisma.reminder.findMany({
      where: { patientId, isActive: true },
      include: {
        occurrences: {
          where: { scheduledFor: { gte: start, lte: end } },
        },
      },
    }),
  ]);

  // Compute reminder completion rate
  let completed = 0;
  let total = 0;
  for (const r of reminderCompletion) {
    for (const occ of r.occurrences) {
      total++;
      if (occ.status === "COMPLETED") completed++;
    }
  }

  return {
    period,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    quizAttempts: quizAttempts.map((a) => ({
      score: a.score,
      completedAt: a.completedAt.toISOString(),
      details: a.details,
    })),
    moodCheckIns: moodCheckIns.map((m) => ({
      mood: m.mood,
      createdAt: m.createdAt.toISOString(),
    })),
    memoryCount,
    reminderCompletion: { completed, total },
  };
}

export async function GET(request: NextRequest) {
  const ctx = await getApiCaregiverSession();
  if (!ctx) return unauthenticated();

  const patientId = request.nextUrl.searchParams.get("patient");
  if (!patientId || !ctx.patients.some((p) => p.id === patientId)) {
    return NextResponse.json({ error: "You're not linked to that patient." }, { status: 403 });
  }

  const period = request.nextUrl.searchParams.get("period") ?? "WEEK";
  const startParam = request.nextUrl.searchParams.get("start");
  const endParam = request.nextUrl.searchParams.get("end");

  let start: Date, end: Date;
  if (startParam && endParam) {
    start = new Date(startParam);
    end = new Date(endParam);
  } else {
    const range = periodToRange(period);
    start = range.start;
    end = range.end;
  }

  const data = await buildReportData(patientId, period, start, end);
  return NextResponse.json(data);
}

function generatePDF(data: Awaited<ReturnType<typeof buildReportData>>, patientName: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 25;

  // Colors as tuples
  const sage: [number, number, number] = [91, 140, 114]; // #5B8C72
  const amber: [number, number, number] = [232, 169, 76]; // #E8A94C
  const ink: [number, number, number] = [38, 48, 43]; // #26302B
  const inkLight: [number, number, number] = [243, 239, 232]; // #F3EFE8

  // Header background
  doc.setFillColor(...sage);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Remme — Memory Care Report", margin, 22);

  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${patientName} • ${data.period} report`, margin, 32);

  y = 50;
  doc.setTextColor(...ink);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Period: ${new Date(data.startDate).toLocaleDateString()} – ${new Date(data.endDate).toLocaleDateString()}`,
    margin,
    y,
  );
  y += 8;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 14;

  // Quiz scores
  doc.setFillColor(...inkLight);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
  doc.setTextColor(...sage);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Memory Quiz Scores", margin + 4, y + 5.5);
  y += 14;

  if (data.quizAttempts.length === 0) {
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("No quiz attempts in this period.", margin, y);
    y += 10;
  } else {
    const scores = data.quizAttempts.map((a) => a.score);
    const avg = (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Attempts: ${data.quizAttempts.length}`, margin, y);
    y += 7;
    doc.text(`Average score: ${avg}`, margin, y);
    y += 7;
    doc.text(`Latest: ${data.quizAttempts[data.quizAttempts.length - 1].score}`, margin, y);
    y += 12;
  }

  // Mood check-ins
  doc.setFillColor(...inkLight);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
  doc.setTextColor(...amber);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Mood Check-ins", margin + 4, y + 5.5);
  y += 14;

  if (data.moodCheckIns.length === 0) {
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("No mood check-ins in this period.", margin, y);
    y += 10;
  } else {
    const dist = data.moodCheckIns.reduce(
      (acc, m) => ({ ...acc, [m.mood]: (acc[m.mood] ?? 0) + 1 }),
      {} as Record<string, number>,
    );
    const labels: Record<string, string> = { GOOD: "Good", OKAY: "Okay", BAD: "Low" };
    for (const [mood, count] of Object.entries(dist)) {
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`${labels[mood] ?? mood}: ${count}`, margin, y);
      y += 7;
    }
    y += 5;
  }

  // Activity
  doc.setFillColor(...inkLight);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
  doc.setTextColor(...sage);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Activity Summary", margin + 4, y + 5.5);
  y += 14;

  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Memories shared: ${data.memoryCount}`, margin, y);
  y += 7;
  doc.text(
    `Reminders completed: ${data.reminderCompletion.completed}/${data.reminderCompletion.total}`,
    margin,
    y,
  );
  y += 7;
  if (data.reminderCompletion.total > 0) {
    const pct = Math.round((data.reminderCompletion.completed / data.reminderCompletion.total) * 100);
    doc.text(`Completion rate: ${pct}%`, margin, y);
    y += 7;
  }
  y += 10;

  // Disclaimer
  doc.setDrawColor(...amber);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Disclaimer", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const disclaimer =
    "Remme reports support memory care. They are not a medical diagnosis. " +
    "This summary aggregates data the patient chose to share in Remme. " +
    "It does not replace clinical assessment. Share it with the care team as a conversation aid, not as evidence.";
  const lines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin);
  doc.text(lines, margin, y);

  return doc.output("blob");
}

export async function POST(request: NextRequest) {
  const ctx = await getApiCaregiverSession();
  if (!ctx) return unauthenticated();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const patientId = body.patientId as string;
  if (!patientId || !ctx.patients.some((p) => p.id === patientId)) {
    return NextResponse.json({ error: "You're not linked to that patient." }, { status: 403 });
  }

  const period = (body.period as string) ?? "WEEK";
  const startDate = body.startDate ? new Date(body.startDate as string) : new Date();
  const endDate = body.endDate ? new Date(body.endDate as string) : new Date();

  const patient = await prisma.careProfile.findUnique({
    where: { id: patientId },
    include: { user: { select: { name: true } } },
  });
  const patientName = patient?.user?.name ?? "Patient";

  const data = await buildReportData(patientId, period, startDate, endDate);
  const pdfBlob = generatePDF(data, patientName);

  return new NextResponse(pdfBlob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="remme-report-${patientName.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}