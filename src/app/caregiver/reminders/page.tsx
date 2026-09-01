import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import ReminderPanel from "@/components/caregiver/ReminderPanel";

export const metadata = { title: "Reminders — Remme Caregiver" };

export default async function CaregiverRemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient: active } = await requireActivePatient((await searchParams).patient);

  const reminders = await prisma.reminder.findMany({
    where: { patientId: active.id },
    orderBy: [{ isActive: "desc" }, { time: "asc" }, { createdAt: "asc" }],
  });

  const reminderRows = reminders.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    time: r.time,
    category: r.category,
    recurrence: r.recurrence,
    isActive: r.isActive,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
          {active.name}&apos;s reminders
        </h2>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          Add, pause, edit or remove reminders for the person you care for.
        </p>
      </section>

      <ReminderPanel patientId={active.id} reminders={reminderRows} />
    </div>
  );
}
