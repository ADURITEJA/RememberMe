import { Bell, BellOff } from "lucide-react";
import { requireCareSession } from "@/components/care/care-db";
import { prisma } from "@/lib/prisma";
import NotificationRow from "@/components/care/NotificationRow";

export const metadata = { title: "Notifications — Remme Care" };

export default async function NotificationsPage() {
  const ctx = await requireCareSession();

  const notifications = await prisma.notification.findMany({
    where: { patientId: ctx.profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Bell aria-hidden className="h-7 w-7 text-remme-sage" />
          <h1 className="text-3xl font-semibold tracking-tight text-remme-ink">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-remme-status-attention px-2 text-sm font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="max-w-xl text-lg leading-snug text-remme-ink/65">
          Alerts, reminders, and updates from your care team.
        </p>
      </section>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <section className="glass-card flex flex-col items-center gap-3 p-8 text-center">
          <BellOff aria-hidden className="h-12 w-12 text-remme-ink/25" />
          <p className="text-xl text-remme-ink/55">
            No notifications yet — all quiet! 💛
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              notification={{
                id: n.id,
                title: n.title,
                body: n.body,
                type: n.type,
                isRead: n.isRead,
                createdAt: n.createdAt.toISOString(),
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
