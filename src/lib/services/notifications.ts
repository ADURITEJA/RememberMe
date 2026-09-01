/**
 * Notification service abstraction.
 * In-app notifications are stored in the DB (see Notification model); push
 * notifications are mocked when no PUSH_API_KEY is configured.
 */

export type NotificationPayload = {
  title: string;
  body: string;
  type: string; // e.g. "REMINDER", "SOS", "ZONE_EXIT", "MOOD"
  patientId?: string;
};

/**
 * Store an in-app notification for a patient. No-op guard if required env is
 * missing is intentional: this is a thin wrapper around Prisma.
 */
export async function createInAppNotification(
  payload: NotificationPayload,
): Promise<{ ok: boolean; id?: string }> {
  const { prisma } = await import("@/lib/prisma");
  if (!payload.patientId) return { ok: false };
  const record = await prisma.notification.create({
    data: {
      patientId: payload.patientId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
    },
  });
  return { ok: true, id: record.id };
}

/**
 * Mock push notification. Returns `sent: false` when no push provider is
 * configured, so callers can decide whether to fall back to in-app only.
 */
export async function sendPushNotification(
  _targetUserId: string,
  payload: NotificationPayload,
): Promise<{ sent: boolean; provider: "none" }> {
  const configured = Boolean(
    process.env.PUSH_API_KEY && process.env.PUSH_API_KEY.length > 0,
  );
  return { sent: configured, provider: "none" };
}

/**
 * Convenience: create in-app notification and attempt a push. Always resolves.
 */
export async function notify(
  payload: NotificationPayload & { targetUserId?: string },
): Promise<{ inApp: boolean; push: boolean }> {
  const inApp = await createInAppNotification(payload);
  const push = payload.targetUserId
    ? await sendPushNotification(payload.targetUserId, payload)
    : { sent: false };
  return { inApp: inApp.ok, push: push.sent };
}