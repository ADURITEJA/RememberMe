"use client";

import * as React from "react";
import { useState } from "react";
import { format, subDays, startOfDay, endOfDay, differenceInCalendarDays } from "date-fns";
import {
  Calendar,
  Download,
  BarChart2,
  Brain,
  Heart,
  Bell,
  FileText,
  AlertCircle,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Sparkline } from "@/components/caregiver/Sparkline";

const MOOD_VALUE: Record<string, number> = { GOOD: 3, OKAY: 2, BAD: 1, UNSPECIFIED: 1.5 };
const MOOD_LABEL: Record<string, string> = { GOOD: "Good", OKAY: "Okay", BAD: "Low" };

type Period = "DAY" | "WEEK" | "MONTH";

interface ReportData {
  period: Period;
  startDate: Date;
  endDate: Date;
  quizAttempts: Array<{ score: number; completedAt: string; details: any }>;
  moodCheckIns: Array<{ mood: string; createdAt: string }>;
  memoryCount: number;
  reminderCompletion: { completed: number; total: number };
}

function relativeLabel(date: Date) {
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function periodToRange(period: Period, anchor = new Date()) {
  const end = endOfDay(anchor);
  let start: Date;
  if (period === "DAY") start = startOfDay(anchor);
  else if (period === "WEEK") start = startOfDay(subDays(anchor, 6));
  else start = startOfDay(subDays(anchor, 29));
  return { start, end };
}

export function ReportGenerator({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const [period, setPeriod] = useState<Period>("WEEK");
  const [report, setReport] = useState<ReportData | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchReport = async (p: Period) => {
    const { start, end } = periodToRange(p);
    try {
      const res = await fetch(
        `/api/reports?patient=${patientId}&period=${p}&start=${start.toISOString()}&end=${end.toISOString()}`,
      );
      if (res.ok) {
        const data = await res.json();
        setReport({ ...data, period: p, startDate: start, endDate: end });
      }
    } catch (e) {
      console.error("Report fetch failed:", e);
    }
  };

  React.useEffect(() => {
    fetchReport(period);
  }, [period, patientId]);

  const generatePDF = async () => {
    if (!report) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          period: report.period,
          startDate: report.startDate.toISOString(),
          endDate: report.endDate.toISOString(),
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `remme-report-${patientName.replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  if (!report) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BarChart2 aria-hidden className="h-10 w-10 mx-auto mb-3 text-remme-sage/60" />
          <p className="text-lg text-remme-ink/60">Loading report...</p>
        </div>
      </div>
    );
  }

  const { quizAttempts, moodCheckIns, memoryCount, reminderCompletion } = report;
  const quizScores = quizAttempts.map((a) => a.score);
  const avgQuizScore = quizScores.length
    ? (quizScores.reduce((s, v) => s + v, 0) / quizScores.length).toFixed(1)
    : "—";
  const latestQuiz = quizAttempts[quizAttempts.length - 1];
  const moodSeries = moodCheckIns.map((m) => MOOD_VALUE[m.mood] ?? 1.5);
  const latestMood = moodCheckIns.length ? MOOD_LABEL[moodCheckIns[moodCheckIns.length - 1].mood] : null;
  const moodDist = moodCheckIns.reduce(
    (acc, m) => ({ ...acc, [m.mood]: (acc[m.mood] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-remme-ink dark:text-remme-inklight">
            {period === "DAY" ? "Today" : period === "WEEK" ? "Past 7 days" : "Past 30 days"}
          </h3>
          <p className="text-sm text-remme-ink/50">
            {format(report.startDate, "MMM d")} – {format(report.endDate, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="w-40"
          >
            <option value="DAY">Day</option>
            <option value="WEEK">Week</option>
            <option value="MONTH">Month</option>
          </Select>
          <Button
            variant="sage"
            size="lg"
            onClick={generatePDF}
            disabled={generating}
            className="min-touch gap-2"
          >
            <Download aria-hidden className="h-5 w-5" />
            {generating ? "Generating…" : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Quiz score trend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Brain aria-hidden className="h-5 w-5 text-remme-sage" />
            Memory quiz scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quizAttempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <Brain aria-hidden className="h-12 w-12 text-remme-ink/30" />
              <p className="text-lg text-remme-ink/60">No quiz attempts in this period.</p>
              <p className="text-sm text-remme-ink/50">The patient hasn&apos;t played the memory quiz yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="glass-solid rounded-2xl p-4 text-center">
                  <p className="text-4xl font-bold text-remme-sage-deep">{avgQuizScore}</p>
                  <p className="text-sm text-remme-ink/60">Average score</p>
                </div>
                <div className="glass-solid rounded-2xl p-4 text-center">
                  <p className="text-4xl font-bold text-remme-sage-deep">{quizAttempts.length}</p>
                  <p className="text-sm text-remme-ink/60">Attempts</p>
                </div>
                <div className="glass-solid rounded-2xl p-4 text-center">
                  <p className="text-4xl font-bold text-remme-sage-deep">
                    {latestQuiz ? latestQuiz.score : "—"}
                  </p>
                  <p className="text-sm text-remme-ink/60">Latest score</p>
                </div>
              </div>
              <Sparkline data={quizScores} height={80} />
              {latestQuiz && (
                <p className="text-sm text-remme-ink/60">
                  Latest attempt: {relativeLabel(new Date(latestQuiz.completedAt))} —{" "}
                  {latestQuiz.score}/{latestQuiz.details?.length ?? "?"} correct
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mood distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Heart aria-hidden className="h-5 w-5 text-remme-amber" />
              Mood check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moodCheckIns.length === 0 ? (
              <p className="text-lg text-remme-ink/55">No mood check-ins in this period.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <Sparkline data={moodSeries} height={80} />
                <div className="flex flex-wrap gap-2">
                  {Object.entries(moodDist).map(([mood, count]) => (
                    <Badge key={mood} variant="outline" className="gap-1">
                      {MOOD_LABEL[mood] ?? mood}: {count}
                    </Badge>
                  ))}
                </div>
                {latestMood && (
                  <p className="text-sm text-remme-ink/60">
                    Latest: <span className="font-semibold text-remme-sage-deep">{latestMood}</span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Memory & reminder activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText aria-hidden className="h-5 w-5 text-remme-sage" />
              Activity summary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="glass-solid rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-remme-ink">Memories shared</span>
                <span className="text-3xl font-bold text-remme-sage-deep">{memoryCount}</span>
              </div>
            </div>
            <div className="glass-solid rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-remme-ink">Reminders completed</span>
                <span className="text-3xl font-bold text-remme-sage-deep">
                  {reminderCompletion.completed}/{reminderCompletion.total}
                </span>
              </div>
              {reminderCompletion.total > 0 && (
                <div className="mt-2 h-2 rounded-full bg-remme-sage/15 overflow-hidden">
                  <div
                    className="h-full bg-remme-sage transition-all"
                    style={{ width: `${(reminderCompletion.completed / reminderCompletion.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-remme-amber" />
            <div className="text-base text-remme-ink/70">
              <p className="font-semibold">Remme reports support memory care. They are not a medical diagnosis.</p>
              <p className="mt-1">
                This summary aggregates data the patient chose to share in Remme. It does not replace
                clinical assessment. Share it with the care team as a conversation aid, not as evidence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
