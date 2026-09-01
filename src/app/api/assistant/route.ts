import { NextRequest } from "next/server";
import {
  getApiCareSession,
  unauthenticated,
  rankDocs,
  tokenize,
  formatCareDate,
  type RetrievalDoc,
} from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/assistant — Remma, the calm retrieval-only assistant.
 *
 * We deliberately DO NOT call any external LLM here (no key needed) and we
 * NEVER invent content. Instead:
 *
 *   1. Every answer is pulled only from the patient's OWN stored records
 *      (Memories + transcripts, People, Reminders, MoodCheckIns, Routines).
 *   2. A deterministic TF-IDF-style scorer ranks those records against the
 *      question; good hits are used to craft a gentle answer that QUOTES real
 *      data.
 *   3. If there is no good hit, Remma says the scripted safe fallback and
 *      warmly suggests sharing a new memory. No hallucination, ever.
 *
 * Chat semantics are stateless: the server receives the full recent message
 * list and derives context from it. No cookie needed.
 */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const HIT_THRESHOLD = 0.6;

const FALLBACK =
  "I don't remember that yet — tell me about it and I can keep it here for both of us 💛";

const MOOD_LABEL: Record<string, string> = {
  Happy: "happy",
  Sad: "sad",
  Fine: "fine",
  Worried: "worried",
  Confused: "a little confused",
  GOOD: "happy",
  OKAY: "fine",
  BAD: "sad",
};

function warmWrapOf(parent: string): string {
  return parent;
}

function lastUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

/** Simple, honest greeting/amenity intents — these are answers about Remma
 *  herself, not the patient's memory, so they never fabricate anything. */
function amenityReply(message: string, userName: string): string | null {
  const m = message.toLowerCase().trim();
  const words = tokenize(message);

  if (/\b(thank\s*(you|s)|thanks|much\s*appreciated|bless\s*you)\b/.test(m)) {
    return "You're so welcome. It's truly what I'm here for.";
  }
  if (/^(hello|hi|hey|heya|yo|good\s*(morning|afternoon|evening))\b/.test(m) && words.length <= 2) {
    return `Hello, ${userName} — lovely to see you. I'm Remma, your calm companion. How are you feeling today?`;
  }
  if (/\b(i\s*love\s*you|love\s*you)\b/.test(m) && words.length <= 4) {
    return "And I'm so glad you're here with me. You are a very loved person.";
  }
  if (/\b(what\s*can\s*you\s*do|help|how\s*do\s*you\s*work)\b/.test(m) && words.length <= 7) {
    return (
      "I can remind you about the little things, keep and retell the memories you share with me, " +
      "bring back the faces you love, and check in on how you're feeling. " +
      "I only ever talk about what YOU have told me — I never guess. "
    );
  }
  if (/\b(how\s*are\s*you|how\s*do\s*you\s*feel|you\s*okay|you\s*ok)\b/.test(m)) {
    return "I'm doing my best, thank you for asking. But more importantly — how are you feeling today?";
  }
  return null;
}

/** Detect a mood / feelings question. */
function feelsLikeMoodQuestion(message: string): boolean {
  return /\b(mood|feeling|feel|feels|emotions|how am i|sad|happy|worried|scared|anxious|low|down|okay)\b/.test(
    message.toLowerCase(),
  );
}

interface AnswerCtx {
  userName: string;
  memories: Array<{
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    date: Date;
    transcript: string | null;
  }>;
  people: Array<{ name: string; relationship: string; nickname: string | null; description: string | null }>;
  reminders: Array<{ title: string; time: string; recurrence: string; description: string | null; completed: boolean }>;
  moods: Array<{ mood: string; note: string | null; createdAt: Date }>;
  routines: Array<{ name: string; steps: Array<{ title: string }> }>;
}

function buildAnswer(hits: ReturnType<typeof rankDocs>, ctx: AnswerCtx): string {
  const top = hits[0];
  if (!top) return FALLBACK;

  const one = (
    type: string,
  ) => {
    return top.kind === type ? 1 : 0;
  };

  if (one("memory")) {
    const mem = ctx.memories.find((m) => m.id === top.id);
    if (mem) {
      const when = mem.date ? `around ${formatCareDate(mem.date)}` : "";
      const where = mem.location ? ` at ${mem.location}` : "";
      const bits: string[] = [];
      bits.push(`I remember that! It was “${mem.title}”${where}${when ? ` ${when}` : ""}.`);
      if (mem.description) bits.push(mem.description.slice(0, 280));
      if (mem.transcript) bits.push(`You once said: “${mem.transcript.slice(0, 180)}”`);
      return warmWrapOf(bits.join(" "));
    }
    return FALLBACK;
  }

  if (one("person")) {
    const person = ctx.people.find((p) => (p.nickname ? p.nickname : p.name) === top.title);
    if (person) {
      const who = person.nickname || person.name;
      const relation = person.relationship ? `, who is your ${person.relationship}` : "";
      const desc = person.description ? ` ${person.description.slice(0, 160)}` : "";
      return warmWrapOf(`Yes! ${who}${relation}.${desc} They're one of your people — I keep them close.`);
    }
    return FALLBACK;
  }

  if (one("reminder")) {
    const reminder = ctx.reminders.find((r) => r.title === top.title);
    if (reminder) {
      const when = `${reminder.time}${reminder.recurrence === "DAILY" ? " every day" : ""}`;
      const state = reminder.completed ? " — and you've already done it today, lovely!" : " — would you like it done today?";
      const desc = reminder.description ? ` ${reminder.description.slice(0, 120)}` : "";
      return warmWrapOf(`Your reminder says: “${reminder.title}” at ${when}${state}${desc}`);
    }
    return FALLBACK;
  }

  if (one("mood")) {
    const mood = ctx.moods[0];
    if (mood) {
      const label = MOOD_LABEL[mood.mood] ?? "just so";
      const when = formatCareDate(mood.createdAt);
      const note = mood.note ? ` You wrote: “${mood.note.slice(0, 160)}”` : "";
      return warmWrapOf(`Last time you checked in (${when}) you were feeling ${label}.${note} Thank you for sharing that with me — however you feel is okay.`);
    }
    return FALLBACK;
  }

  if (one("routine")) {
    const routine = ctx.routines.find((r) => r.name === top.title);
    if (routine) {
      const steps = routine.steps.map((s) => s.title).join(", ");
      return warmWrapOf(`Your ${routine.name.toLowerCase()} plan includes: ${steps}. We can take it one gentle step at a time.`);
    }
    return FALLBACK;
  }

  return FALLBACK;
}

export async function POST(request: NextRequest) {
  const ctx = await getApiCareSession();
  if (!ctx) return unauthenticated();

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid message." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const latest = lastUserMessage(messages) || "";
  if (!latest.trim()) {
    return Response.json({ error: "Please say something first." }, { status: 400 });
  }

  const profileId = ctx.profile.id;

  // Gather the patient's own records once.
  const [memoryRows, people, reminderRows, moods, routineRows] = await Promise.all([
    prisma.memory.findMany({
      where: { patientId: profileId },
      orderBy: { date: "desc" },
      take: 60,
      include: { transcript: true },
    }),
    prisma.person.findMany({
      where: { patientId: profileId },
      orderBy: { createdAt: "asc" },
      take: 60,
    }),
    prisma.reminder.findMany({
      where: { patientId: profileId, isActive: true },
      orderBy: { createdAt: "asc" },
      take: 60,
      include: {
        occurrences: {
          orderBy: { scheduledFor: "desc" },
          take: 3,
        },
      },
    }),
    prisma.moodCheckIn.findMany({
      where: { patientId: profileId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.routine.findMany({
      where: { patientId: profileId, isActive: true },
      include: { steps: { orderBy: { order: "asc" } } },
    }),
  ]);

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const reminders = reminderRows.map((r) => ({
    title: r.title,
    time: r.time,
    recurrence: r.recurrence,
    description: r.description,
    completed: r.occurrences.some(
      (o) => o.status === "COMPLETED" && o.completedAt && o.completedAt >= startToday,
    ),
  }));

  const ctxData: AnswerCtx = {
    userName: ctx.userName,
    memories: memoryRows.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      location: m.location,
      date: m.date,
      transcript: m.transcript?.text ?? null,
    })),
    people: people.map((p) => ({
      name: p.name,
      relationship: p.relationship,
      nickname: p.nickname,
      description: p.description,
    })),
    reminders,
    moods: moods.map((m) => ({ mood: m.mood, note: m.note, createdAt: m.createdAt })),
    routines: routineRows.map((r) => ({
      name: r.name,
      steps: r.steps.map((s) => ({ title: s.title })),
    })),
  };

  // 1) Amenity / wellbeing intents (about Remma or the user directly).
  const amenity = amenityReply(latest, ctx.userName);
  if (amenity) {
    return Response.json({ message: amenity, kind: "conversation" });
  }

  // 2) Mood questions get a direct, kind answer from the real last check-in.
  if (feelsLikeMoodQuestion(latest) && ctxData.moods.length > 0) {
    const mood = ctxData.moods[0];
    const label = MOOD_LABEL[mood.mood] ?? "just so";
    const when = formatCareDate(mood.createdAt);
    const note = mood.note ? ` You wrote: “${mood.note.slice(0, 160)}”` : "";
    return Response.json({
      message: warmWrapOf(
        `Last time you checked in (${when}) you were feeling ${label}.${note} However you feel is okay today — I'm right here.`,
      ),
      kind: "mood",
    });
  }

  if (feelsLikeMoodQuestion(latest) && ctxData.moods.length === 0) {
    return Response.json({
      message:
        "I'd love to know how you're feeling. On the Mood page you can pick a face for the day — it helps both of us. 💛",
      kind: "mood",
    });
  }

  // 3) Retrieval over the patient's own records.
  const docs: RetrievalDoc[] = [
    ...ctxData.memories.map((m) => ({
      kind: "memory" as const,
      id: m.id,
      title: m.title,
      text: `${m.description ?? ""} ${m.location ?? ""} ${m.transcript ?? ""}`.trim(),
      date: m.date,
      extra: formatCareDate(m.date),
    })),
    ...ctxData.people.map((p, idx) => ({
      kind: "person" as const,
      id: `person-${idx}`,
      title: p.nickname || p.name,
      text: `${p.name} ${p.relationship} ${p.description ?? ""} ${p.nickname ?? ""}`.trim(),
    })),
    ...ctxData.reminders.map((r, idx) => ({
      kind: "reminder" as const,
      id: `reminder-${idx}`,
      title: r.title,
      text: `${r.title} ${r.description ?? ""} at ${r.time} ${r.recurrence}`.trim(),
    })),
    ...ctxData.moods.map((mood, idx) => ({
      kind: "mood" as const,
      id: `mood-${idx}`,
      title: `Mood ${MOOD_LABEL[mood.mood] ?? mood.mood}`,
      text: `${mood.mood} ${mood.note ?? ""} ${formatCareDate(mood.createdAt)}`.trim(),
    })),
    ...ctxData.routines.map((r) => ({
      kind: "routine" as const,
      id: r.name,
      title: r.name,
      text: `${r.name} plan: ${r.steps.map((s) => s.title).join(", ")}`.trim(),
    })),
  ];

  // Include a broader window of the conversation so "that" / "it" still works.
  const chatContext = messages
    .slice(-5)
    .map((m) => m.content)
    .join(" ");

  const ranked = rankDocs(docs, `${latest} ${chatContext}`);

  if (ranked.length > 0 && ranked[0].score >= HIT_THRESHOLD) {
    const hits = ranked.filter((r) => r.score >= HIT_THRESHOLD).slice(0, 3);
    const message = buildAnswer(hits, ctxData);
    return Response.json({
      message,
      kind: hits[0].kind,
      hasSources: true,
    });
  }

  // 4) No good hit → scripted safe fallback + gentle nudge.
  const hasAnyMemories = ctxData.memories.length > 0 || ctxData.people.length > 0;
  const nudge = hasAnyMemories
    ? " You can tell me about it now, or tap Share a memory and we'll keep it for always."
    : " Tap Share a memory and we'll start our little book of you together.";
  return Response.json({
    message: `${FALLBACK}${nudge}`,
    kind: "fallback",
  });
}

