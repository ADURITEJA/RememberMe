/**
 * care-db.ts — server-only helpers for the Care Mode.
 *
 * IMPORTANT: This module imports Prisma / NextAuth and MUST only be imported
 * from Server Components and Route Handlers. Never import it from a client
 * component (add a separate fetch component that calls the API routes instead).
 *
 * Relation notes taken from prisma/schema.prisma:
 *   - CareProfile.userId  -> unique, links to User (patient)
 *   - Reminder.patientId  -> CareProfile   (NOT userId)
 *   - Person/Memory/Routine/MoodCheckIn/Alerts -> patientId -> CareProfile
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CareSession {
  userId: string;
  userName: string;
  userEmail?: string | null;
  profile: {
    id: string;
    dateOfBirth: Date | null;
    diagnosis: string | null;
    medicalNotes: string | null;
  };
}

/**
 * Resolve the signed-in CARE_USER + their CareProfile, or null.
 * Returns null when there is no session, when the user is not a CARE_USER,
 * or when the profile has not been created yet.
 */
export async function getCareSession(): Promise<CareSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role && session.user.role !== "CARE_USER") return null;

  const profile = await prisma.careProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      dateOfBirth: true,
      diagnosis: true,
      medicalNotes: true,
    },
  });
  if (!profile) return null;

  return {
    userId: session.user.id,
    userName: session.user.name || "there",
    userEmail: session.user.email,
    profile,
  };
}

/**
 * Server Component helper: returns the Care session or redirects.
 * Non-CARE users are sent to their own home so nobody is left on a page
 * that doesn't belong to them.
 */
export async function requireCareSession(): Promise<CareSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role && session.user.role !== "CARE_USER") {
    redirect(session.user.role === "CAREGIVER" ? "/caregiver/dashboard" : "/login");
  }
  const profile = await prisma.careProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/login");
  return {
    userId: session.user.id,
    userName: session.user.name || "there",
    userEmail: session.user.email,
    profile: {
      id: profile.id,
      dateOfBirth: profile.dateOfBirth,
      diagnosis: profile.diagnosis,
      medicalNotes: profile.medicalNotes,
    },
  };
}

/**
 * Route Handler helper: returns the Care session or null with a status that
 * the route handler can turn into a 401/403 JSON response.
 */
export async function getApiCareSession(): Promise<CareSession | null> {
  return getCareSession();
}

export function unauthenticated() {
  return Response.json({ error: "Please sign in first." }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "This page is for the person in care." }, { status: 403 });
}

/* ------------------------------------------------------------------ *
 *  Friendly helpers
 * ------------------------------------------------------------------ */

export function greetingForTime(date = new Date()): {
  greeting: string;
  period: "morning" | "afternoon" | "evening" | "night";
} {
  const h = date.getHours();
  if (h < 5) return { greeting: "Rest well", period: "night" };
  if (h < 12) return { greeting: "Good morning", period: "morning" };
  if (h < 17) return { greeting: "Good afternoon", period: "afternoon" };
  if (h < 21) return { greeting: "Good evening", period: "evening" };
  return { greeting: "A calm night", period: "night" };
}

/* ------------------------------------------------------------------ *
 *  Deterministic retrieval used by the Remma assistant (no LLM keys).
 *  A small TF-IDF-style scorer over the patient's OWN stored records.
 *  It ONLY quotes real stored data and never invents content.
 * ------------------------------------------------------------------ */

const STOP_WORDS = new Set([
  "a", "an", "the", "do", "did", "does", "done", "is", "are", "was", "were",
  "be", "been", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "at", "from", "by", "about", "into", "up", "down", "out", "over", "off",
  "what", "when", "where", "who", "how", "why", "which", "my", "our", "your",
  "me", "we", "i", "you", "he", "she", "it", "they", "them", "us", "him",
  "there", "that", "this", "these", "those", "can", "could", "would", "will",
  "should", "shall", "please", "tell", "remember", "me", "again", "happened",
  "went", "go", "went", "come", "came", "like", "want", "does", "have", "has",
  "had", "was", "were", "know", "knew", "think", "thought", "say", "said",
  "let", "its", "it's", "am", "i'm", "so", "really", "very", "just", "now",
  "too", "hello", "hi", "hey", "yes", "no", "okay", "ok", "sure",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export interface RetrievalDoc {
  kind: "memory" | "person" | "reminder" | "mood" | "routine" | "place";
  id: string;
  title: string;
  text: string;
  date?: Date;
  extra?: string;
}

interface ScoredDoc extends RetrievalDoc {
  score: number;
}

/**
 * Rank `docs` against the query terms using idf-weighted term frequency.
 * Returns docs with score > 0 sorted descending.
 */
export function rankDocs(docs: RetrievalDoc[], query: string): ScoredDoc[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const docCount = Math.max(docs.length, 1);

  const matchingDocs = docs.map((d) => {
    const haystack = `${d.title} ${d.title} ${d.text} ${d.extra ?? ""}`.toLowerCase();
    return { doc: d, haystack };
  });

  const idf = (term: string) => {
    const n = matchingDocs.filter(({ haystack }) => haystack.includes(term)).length;
    return Math.log((docCount + 1) / (1 + n)) + 1;
  };

  const scored: ScoredDoc[] = matchingDocs.map(({ doc, haystack }) => {
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) {
        const occurrences = haystack.split(term).length - 1;
        score += Math.min(occurrences, 5) * idf(term);
      }
    }
    // extra weight when the term appears in the title
    for (const term of terms) {
      if (doc.title.toLowerCase().includes(term)) score += idf(term) * 1.5;
    }
    // dampen long documents slightly — the smaller the cleaner the match
    score = score / (1 + Math.sqrt(doc.text.length / 220));
    return { ...doc, score };
  });

  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
}

export function formatCareDate(date: Date | null | undefined): string {
  if (!date) return "";
  try {
    return format(date, "MMMM d, yyyy");
  } catch {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

/** A tiny mock push notification — swap for the real service when it lands. */
export async function mockPushNotification(title: string, body: string) {
  // In production this would call a push provider (e.g. FCM) via
  // src/lib/services/notifications.ts. Here we just log so devs can see it.
  console.log(`[Remme mock push] ${title}: ${body}`);
}