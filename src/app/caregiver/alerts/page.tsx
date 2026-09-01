import { format, differenceInCalendarDays } from "date-fns";
import {
  Filter,
  CheckCircle2,
  CircleAlert,
  MoreVertical,
  ChevronRight,
  BellRing,
  ShieldAlert,
  Info,
} from "lucide-react";
import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertRow } from "@/components/caregiver/AlertRow";
import { AlertFilterBar } from "@/components/caregiver/AlertFilterBar";

const STATUS_ORDER = ["UNREAD", "READ"] as const;

function relativeLabel(date: Date) {
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function typeLabel(type: string) {
  return type.replace(/_/g, " ").toLowerCase();
}

function severityBadge(severity: string) {
  const map: Record<string, "emergency" | "attention" | "sage" | "ink"> = {
    SOS: "emergency",
    ZONE_EXIT: "attention",
    ZONE_ENTRY: "attention",
    MISSED_REMINDER: "attention",
    LOW_BATTERY: "attention",
    INFO: "ink",
  };
  const found = Object.keys(map).find((k) => severity.toUpperCase().includes(k));
  return <Badge variant={map[found ?? "INFO"] ?? "ink"}>{severity}</Badge>;
}

function statusBadge(isRead: boolean) {
  return isRead ? (
    <Badge variant="sage">Handled</Badge>
  ) : (
    <Badge variant="outline">Unread</Badge>
  );
}

export const metadata = { title: "Alerts — Remme Caregiver" };

export default async function CaregiverAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[]; status?: string }>;
}) {
  const { patient, status } = await searchParams;
  const { patient: active } = await requireActivePatient(patient);

  const where: Record<string, unknown> = { patientId: active.id };
  if (status && STATUS_ORDER.includes(status as any)) {
    where.isRead = status === "READ";
  }

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
              Alerts for {active.name}
            </h2>
            <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
              {alerts.length} alert{alerts.length === 1 ? "" : "s"}{" "}
              {unreadCount > 0 ? (
                <span className="font-semibold text-remme-status-attention">
                  ({unreadCount} unread)
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AlertFilterBar status={status ?? null} patient={patient} />
          </div>
        </div>
      </section>

      {/* Alerts list */}
      <section>
        <Card>
          <CardContent className="p-0">
            {alerts.length === 0 ? (
              <div className="glass-card flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
                <ShieldAlert aria-hidden className="h-14 w-14 text-remme-sage/60" />
                <p className="text-xl font-medium text-remme-ink">All quiet 💚</p>
                <p className="max-w-md text-remme-ink/60">
                  No alerts match your filter. When something needs your attention, it will appear here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-remme-sage/10">
                {alerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={{
                      id: alert.id,
                      type: alert.type,
                      message: alert.message,
                      isRead: alert.isRead,
                      createdAt: alert.createdAt.toISOString(),
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}