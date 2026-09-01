import { requireCareSession } from "@/components/care/care-db";
import ShareMemoryForm from "@/components/care/ShareMemoryForm";

export const metadata = { title: "Share a memory — Remme Care" };

/**
 * Share-a-memory page — a single form holding the whole memory together:
 * photo + what happened + voice recording (transcripted + stored).
 */
export default async function NewMemoryPage() {
  await requireCareSession();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-caretitle font-semibold leading-tight text-remme-ink">
          Share a memory
        </h1>
        <p className="max-w-xl text-caresubtitle leading-snug text-remme-ink/70">
          Tell it your way — with a photo, a few words, or by speaking. Remme will
          keep it safe for both of you.
        </p>
      </header>
      <ShareMemoryForm />
    </div>
  );
}