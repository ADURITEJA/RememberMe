"use client";

/**
 * Quiz Page — "Let's remember together 💛"
 *
 * GET /api/quiz -> 3-5 MCQ from patient's own data
 * Shows one question at a time via QuizCard
 * POST /api/quiz/submit -> grades, persists MemoryQuizAttempt, gentle feedback
 */

import { useState, useEffect } from "react";
import { Sparkles, Award, Heart, ArrowRight, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import QuizCard, { type QuizQuestion } from "@/components/care/QuizCard";

type QuizStatus = "loading" | "ready" | "playing" | "results" | "empty";

interface QuizData {
  quizId: string;
  questions: Array<Omit<QuizQuestion, "correctAnswer">>;
}

interface SubmitResult {
  score: number;
  total: number;
  details: Array<{
    questionId: string;
    questionText: string;
    selected: string;
    correct: string;
    isCorrect: boolean;
  }>;
  passed: boolean;
}

export default function QuizPage() {
  const [status, setStatus] = useState<QuizStatus>("loading");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch a fresh quiz on mount
  useEffect(() => {
    let mounted = true;
    fetch("/api/quiz")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.quizId && data.questions?.length) {
          setQuizData({ quizId: data.quizId, questions: data.questions });
          setStatus("ready");
        } else {
          setStatus("empty");
        }
      })
      .catch(() => {
        if (mounted) setError("Couldn&apos;t load the quiz. Please try again.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const startQuiz = () => {
    setStatus("playing");
    setCurrentIndex(0);
    setAnswers({});
    setResults(null);
  };

  const handleAnswer = (answer: string, isCorrect: boolean) => {
    const questionId = quizData?.questions[currentIndex]?.id;
    if (questionId) {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    }
    // Gentle pause then auto-advance
    setTimeout(() => {
      if (currentIndex < (quizData?.questions.length ?? 0) - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        submitQuiz();
      }
    }, 1500);
  };

  const submitQuiz = async () => {
    if (!quizData) return;
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quizData.quizId, answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn&apos;t submit");
      setResults(data);
      setStatus("results");
    } catch {
      setError("Sorry, we couldn&apos;t submit your answers. Please try again.");
    }
  };

  const newQuiz = () => {
    setStatus("loading");
    setQuizData(null);
    setResults(null);
    setAnswers({});
    setCurrentIndex(0);
    // Re-fetch
    fetch("/api/quiz")
      .then((res) => res.json())
      .then((data) => {
        if (data.quizId && data.questions?.length) {
          setQuizData({ quizId: data.quizId, questions: data.questions });
          setStatus("ready");
        } else {
          setStatus("empty");
        }
      })
      .catch(() => setError("Couldn&apos;t load a new quiz."));
  };

  // --- Empty state ---
  if (status === "empty") {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-12 max-w-xl mx-auto text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-remme-sage/12 text-remme-sage-deep">
          <HelpCircle aria-hidden className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-semibold text-remme-ink">Not enough memories yet</h1>
        <p className="max-w-lg text-lg leading-relaxed text-remme-ink/70">
          We need a few memories or people to make a fun quiz. Tap below to share
          a memory or add someone you love — then come back!
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="/memories/new">
            <Button variant="sage" size="lg" className="min-touch gap-2 flex-1">
              <Sparkles aria-hidden className="h-5 w-5" /> Share a memory
            </Button>
          </a>
          <a href="/people">
            <Button variant="glass" size="lg" className="min-touch gap-2 flex-1">
              <Heart aria-hidden className="h-5 w-5" /> Add a person
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-12 max-w-xl mx-auto text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-remme-sage/10 animate-pulse">
          <Sparkles aria-hidden className="h-8 w-8 text-remme-sage" />
        </div>
        <p className="text-lg text-remme-ink/70">Getting your quiz ready…</p>
      </div>
    );
  }

  // --- Ready to start ---
  if (status === "ready") {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-12 max-w-xl mx-auto text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-remme-sage/12 text-remme-sage-deep">
          <Sparkles aria-hidden className="h-12 w-12" />
        </div>
        <h1 className="text-caretitle font-semibold leading-tight text-remme-ink">
          Let&apos;s remember together 💛
        </h1>
        <p className="max-w-lg text-caresubtitle leading-snug text-remme-ink/70">
          {quizData?.questions.length ?? 3} gentle questions from your own memories.
          No pressure — just see what comes back.
        </p>
        <Button onClick={startQuiz} variant="sage" size="xl" className="min-touch gap-2">
          <ArrowRight aria-hidden className="h-5 w-5" /> Start quiz
        </Button>
      </div>
    );
  }

  // --- Playing ---
  if (status === "playing" && quizData) {
    const question = quizData.questions[currentIndex];
    const progress = ((currentIndex + 1) / quizData.questions.length) * 100;

    return (
      <div className="flex flex-col gap-6 px-4 py-6 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-remme-sage/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-remme-sage transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-remme-ink/60 w-16 text-right">
            {currentIndex + 1} / {quizData.questions.length}
          </span>
        </div>

        <QuizCard
          question={question as QuizQuestion}
          onAnswer={handleAnswer}
          answered={answers[question.id] ?? null}
          showResult={true}
        />
      </div>
    );
  }

  // --- Results ---
  if (status === "results" && results && quizData) {
    const { score, total, passed } = results;

    return (
      <div className="flex flex-col items-center gap-6 px-4 py-10 max-w-xl mx-auto text-center">
        <div
          className={cn(
            "flex h-24 w-24 items-center justify-center rounded-full",
            passed
              ? "bg-remme-sage/12 text-remme-sage"
              : "bg-remme-amber/12 text-remme-amber",
          )}
        >
          {passed ? (
            <Award aria-hidden className="h-12 w-12" />
          ) : (
            <Heart aria-hidden className="h-12 w-12" />
          )}
        </div>

        <h1 className="text-2xl font-semibold text-remme-ink">
          {passed ? "Wonderful work! 💛" : "You gave it your best — that&apos;s what matters! 💛"}
        </h1>

        <p className="max-w-lg text-lg leading-relaxed text-remme-ink/75">
          You got <strong>{score} out of {total}</strong> right. Every memory you
          revisit keeps your story alive.
        </p>

        <div className="w-full max-w-md space-y-3">
          {results.details.map((d, idx) => (
            <div
              key={d.questionId}
              className={cn(
                "glass-card flex flex-col gap-2 p-4 text-left",
                d.isCorrect ? "border-l-4 border-remme-sage" : "border-l-4 border-remme-amber",
              )}
            >
              <p className="text-sm font-medium text-remme-ink/70">
                Q{idx + 1}: {d.questionText}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className={cn("font-medium", d.isCorrect ? "text-remme-sage" : "text-remme-status-attention")}>
                  Your answer: {d.selected || "(skipped)"}
                </span>
                {d.isCorrect && <Sparkles aria-hidden className="h-4 w-4 text-remme-sage" />}
              </div>
              {!d.isCorrect && d.selected && (
                <p className="text-sm text-remme-ink/60">
                  The answer was: <strong>{d.correct}</strong>
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={newQuiz} variant="sage" size="lg" className="min-touch gap-2 flex-1">
            <RefreshCw aria-hidden className="h-5 w-5" /> Try another quiz
          </Button>
          <a href="/home">
            <Button variant="glass" size="lg" className="min-touch gap-2 flex-1">
              <Heart aria-hidden className="h-5 w-5" /> Go home
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
      <p className="text-remme-ink/70">Something went wrong.</p>
      <Button onClick={newQuiz} variant="sage">Try again</Button>
    </div>
  );
}