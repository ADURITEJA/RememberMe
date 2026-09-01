import { requireCareSession } from "@/components/care/care-db";
import AssistantChat from "@/components/care/AssistantChat";

export const metadata = { title: "Remma — Remme Care" };

export default async function AssistantPage() {
  const ctx = await requireCareSession();
  return <AssistantChat userName={ctx.userName} />;
}