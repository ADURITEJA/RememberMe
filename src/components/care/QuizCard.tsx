"use client";

/**
 * QuizCard — one friendly multiple-choice question card for the memory quiz.
 *
 * Shows one question at a time, big answer buttons, gentle immediate feedback.
 * Handles both image questions (WHO_IS_THIS) and text questions.
 */

import { useState } from "react";
import { Check, X, Sparkles, HelpCircle, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface QuizQuestion {
  id: string;
  questionType: "WHO_IS_THIS" | "WHERE_WAS_THIS" | "WHAT_HAPPENED";
  questionText: string;
  imageUrl?: string | null;
  options: string[];
  correctAnswer: string;
}

export interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  answered?: string | null;
  showResult?: boolean;
}

export default function QuizCard({
  question,
  onAnswer,
  answered,
  showResult = false,
}: QuizCardProps) {
  const [picked, setPicked] = useState<string | null>(answered ?? null);

  const isAnswered = answered !== undefined && answered !== null;

  const handlePick = (ans: string) => {
    if (isAnswered) return;
    const correct = ans === question.correctAnswer;
    setPicked(ans);
    onAnswer(ans, correct);
  };

  const answerClass = (ans: string) => {
    if (!isAnswered) return "";
    if (ans === question.correctAnswer) return "correct";
    if (ans === picked) return "wrong";
    return "";
  };

  return (
    <Card variant="glass" className="overflow-hidden p-0">
      {/* Question header */}
      <div className="glass-solid p-5 sm:p-7 border-b border-black/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-remme-sage">
            <HelpCircle aria-hidden className="h-6 w-6" />
            <span className="text-lg font-semibold">
              {question.questionType === "WHO_IS_THIS" && "Who is this?"}
              {question.questionType === "WHERE_WAS_THIS" && "Where was this?"}
              {question.questionType === "WHAT_HAPPENED" && "What happened?"}
            </span>
          </div>
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt=""
              className="h-20 w-20 rounded-2xl object-cover shadow-md"
              loading="lazy"
            />
          )}
        </div>
        <p className="mt-3 text-xl leading-relaxed text-remme-ink">
          {question.questionText}
        </p>
      </div>

      {/* Options */}
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-3">
          {question.options.map((opt, idx) => {
            const cls = answerClass(opt);
            return (
              <Button
                key={opt}
                type="button"
                variant={
                  cls === "correct"
                    ? "sage"
                    : cls === "wrong"
                    ? "danger"
                    : "glass"
                }
                size="lg"
                disabled={isAnswered}
                onClick={() => handlePick(opt)}
                className={cn(
                  "min-touch w-full text-left text-base font-medium",
                  isAnswered && "pointer-events-none",
                )}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span>{opt}</span>
                  {cls === "correct" && (
                    <Check aria-hidden className="h-6 w-6 shrink-0 text-white/90" />
                  )}
                  {cls === "wrong" && (
                    <X aria-hidden className="h-6 w-6 shrink-0 text-white/90" />
                  )}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Gentle result message */}
        {showResult && picked !== null ? (
          <div
            className={cn(
              "mt-5 flex flex-col items-center gap-2 rounded-2xl p-5 text-center",
              picked === question.correctAnswer
                ? "bg-remme-sage/10 text-remme-sage-deep"
                : "bg-remme-amber/10 text-remme-status-attention",
            )}
          >
            {picked === question.correctAnswer ? (
              <>
                <Sparkles aria-hidden className="h-8 w-8 text-remme-sage" />
                <span className="text-lg font-semibold">
                  That&apos;s right, lovely! 💛
                </span>
              </>
            ) : (
              <>
                <Award aria-hidden className="h-8 w-8 text-remme-amber" />
                <span className="text-lg font-semibold">
                  No worries — it&apos;s okay to forget.
                </span>
                <p className="text-base leading-relaxed">
                  The answer was: <strong>{question.correctAnswer}</strong>
                </p>
              </>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}