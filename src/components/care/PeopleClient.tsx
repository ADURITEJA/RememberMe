"use client";

/**
 * PeopleClient — interactive "My People" photo cards with add / edit / remove.
 *
 * Photos are picked with a friendly <input type="file" accept="image/*"> and
 * previewed immediately (data-URL upload keeps it offline-friendly).
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, UserRound, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readCarePhoto } from "@/components/care/photo-upload";
import ConfirmDialog from "@/components/care/ConfirmDialog";

export interface PersonCardData {
  id: string;
  name: string;
  relationship: string;
  nickname?: string | null;
  phoneNumber?: string | null;
  description?: string | null;
  photoUrl?: string | null;
}

interface PeopleClientProps {
  people: PersonCardData[];
}

type Editing = {
  mode: "add" | "edit";
  person?: PersonCardData;
};

function initialForm(person?: PersonCardData) {
  return {
    name: person?.name ?? "",
    relationship: person?.relationship ?? "",
    nickname: person?.nickname ?? "",
    phoneNumber: person?.phoneNumber ?? "",
    description: person?.description ?? "",
    photoUrl: person?.photoUrl ?? "",
  };
}

export default function PeopleClient({ people }: PeopleClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<PersonCardData[]>(people);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<PersonCardData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setEditing({ mode: "add" });
    setError(null);
  };
  const openEdit = (person: PersonCardData) => {
    setEditing({ mode: "edit", person });
    setError(null);
  };
  const closeEditor = () => {
    setEditing(null);
    setPreview("");
    setError(null);
  };

  const form = editing ? initialForm(editing.person) : initialForm();

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const result = await readCarePhoto(file);
      if (result) {
        setPreview(result.dataUrl);
        setError(null);
      } else {
        setError("That doesn't look like a photo. Please choose a picture.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that photo.");
    }
  };

  const save = async (data: Record<string, string>) => {
    setBusy(true);
    setError(null);
    try {
      const editingPerson = editing?.person;
      const res = await fetch(
        editingPerson ? `/api/people/${editingPerson.id}` : "/api/people",
        {
          method: editingPerson ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Sorry, we couldn't save that. Please try again.");
        setBusy(false);
        return;
      }
      closeEditor();
      setBusy(false);
      const fresh = await fetch("/api/people").then((r) => r.json()).catch(() => null);
      if (fresh?.people) setItems(fresh.people);
      router.refresh();
    } catch {
      setError("Sorry, we couldn't reach the server. Please try again.");
      setBusy(false);
    }
  };

  const removePerson = async () => {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/people/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Sorry, we couldn't remove that person.");
        setBusy(false);
        setDeleting(null);
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
      setBusy(false);
      router.refresh();
    } catch {
      setError("Sorry, we couldn't reach the server. Please try again.");
      setBusy(false);
      setDeleting(null);
    }
  };

  const labelClass = "text-lg font-semibold text-remme-ink";
  const inputClass =
    "w-full min-h-14 rounded-2xl border-2 border-remme-sage/15 bg-white/80 px-5 py-3 text-lg text-remme-ink placeholder:text-remme-ink/40 focus:border-remme-sage focus:outline-none focus:ring-4 focus:ring-remme-sage/25";

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-remme-sage/10 text-remme-sage-deep">
              <UserRound aria-hidden className="h-10 w-10" />
            </span>
            <h2 className="text-2xl font-semibold text-remme-ink">Your people</h2>
            <p className="max-w-md text-lg leading-relaxed text-remme-ink/65">
              Add the faces you love — grandma, your daughter, your dear friend — so they are
              always one tap away.
            </p>
            <Button variant="sage" size="lg" onClick={openAdd} className="mt-1 gap-2 min-touch">
              <Plus aria-hidden className="h-6 w-6" /> Add a person
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-caretitle font-semibold leading-tight text-remme-ink">
                My people
              </h1>
              <Button variant="sage" size="default" onClick={openAdd} className="min-touch">
                <Plus aria-hidden className="mr-1 h-5 w-5" /> Add
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((person) => (
                <article
                  key={person.id}
                  className="glass-card flex flex-col gap-3 p-4 transition-all hover:shadow-glass"
                >
                  <button
                    type="button"
                    onClick={() => openEdit(person)}
                    className="flex min-h-0 flex-col items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40"
                    aria-label={`Edit ${person.name}`}
                  >
                    {person.photoUrl ? (
                      <img
                        src={person.photoUrl}
                        alt=""
                        className="h-28 w-28 rounded-full object-cover shadow-glass-sm sm:h-32 sm:w-32"
                        loading="lazy"
                      />
                    ) : (
                      <span className="grid h-28 w-28 place-items-center rounded-full bg-remme-sage/12 text-remme-sage-deep sm:h-32 sm:w-32">
                        <UserRound aria-hidden className="h-14 w-14" />
                      </span>
                    )}
                    <span className="flex flex-col items-center gap-0.5 text-center">
                      <span className="text-xl font-semibold text-remme-ink">
                        {person.nickname || person.name}
                      </span>
                      <span className="text-base text-remme-ink/55">
                        {person.relationship || "My person"}
                      </span>
                    </span>
                  </button>
                  {person.phoneNumber ? (
                    <a
                      href={`tel:${person.phoneNumber}`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-remme-sage/10 px-3 py-2 text-base font-medium text-remme-sage-deep transition-colors hover:bg-remme-sage/15"
                    >
                      <Phone aria-hidden className="h-4 w-4" /> Call
                    </a>
                  ) : null}
                  <div className="flex justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(person)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-base font-medium text-remme-sage-deep hover:bg-remme-sage/10 min-touch"
                    >
                      <Pencil aria-hidden className="h-4 w-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(person)}
                      aria-label={`Remove ${person.name}`}
                      className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-base font-medium text-remme-status-attention hover:bg-remme-status-attention/10 min-touch"
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Editor dialog */}
      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-remme-charcoal/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="person-editor-title"
        >
          <div className="glass-panel max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl rounded-b-none bg-remme-offwhite/95 p-6 sm:rounded-3xl sm:p-8">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2
                id="person-editor-title"
                className="text-2xl font-semibold leading-snug text-remme-ink"
              >
                {editing.mode === "add" ? "Add a person you love" : `Update ${editing.person?.name}`}
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                aria-label="Close"
                className="grid h-12 w-12 place-items-center rounded-full bg-black/5 text-remme-ink hover:bg-black/10 min-touch"
              >
                <X aria-hidden className="h-6 w-6" />
              </button>
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const data: Record<string, string> = {};
                const keys = ["name", "relationship", "nickname", "phoneNumber", "description"];
                for (const k of keys) {
                  data[k] = (fd.get(k) as string) ?? "";
                }
                data.photoUrl = preview || form.photoUrl || "";
                if (!data.name.trim()) {
                  setError("Please tell us the person's name.");
                  return;
                }
                void save(data);
              }}
            >
              {/* Photo */}
              <div className="flex flex-col items-center gap-3">
                {(preview || form.photoUrl) ? (
                  <img
                    src={preview || form.photoUrl}
                    alt=""
                    className="h-36 w-36 rounded-full object-cover shadow-glass"
                  />
                ) : (
                  <span className="grid h-36 w-36 place-items-center rounded-full bg-remme-sage/12 text-remme-sage-deep">
                    <UserRound aria-hidden className="h-16 w-16" />
                  </span>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-touch"
                  >
                    {preview || form.photoUrl ? "Change photo" : "Add a photo"}
                  </Button>
                  {(preview || form.photoUrl) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="default"
                      onClick={() => {
                        setPreview("");
                      }}
                      className="min-touch"
                    >
                      Remove photo
                    </Button>
                  ) : null}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Choose a photo"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="person-name" className={labelClass}>
                  Name *
                </label>
                <input
                  id="person-name"
                  name="name"
                  type="text"
                  defaultValue={form.name}
                  placeholder="Nana"
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="person-relationship" className={labelClass}>
                    How are you related?
                  </label>
                  <input
                    id="person-relationship"
                    name="relationship"
                    type="text"
                    defaultValue={form.relationship}
                    placeholder="My daughter"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="person-nickname" className={labelClass}>
                    A special name?
                  </label>
                  <input
                    id="person-nickname"
                    name="nickname"
                    type="text"
                    defaultValue={form.nickname}
                    placeholder="Sweetheart"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="person-phone" className={labelClass}>
                  Phone number
                </label>
                <input
                  id="person-phone"
                  name="phoneNumber"
                  type="tel"
                  defaultValue={form.phoneNumber}
                  placeholder="080 1234 5678"
                  inputMode="tel"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="person-notes" className={labelClass}>
                  A little note
                </label>
                <textarea
                  id="person-notes"
                  name="description"
                  defaultValue={form.description}
                  rows={3}
                  placeholder="Always makes the best chai…"
                  className={cn(inputClass, "resize-none")}
                />
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-remme-status-emergency/10 px-4 py-3 text-base font-medium text-remme-status-emergency"
                >
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
                <Button type="button" variant="ghost" size="lg" onClick={closeEditor}>
                  Back
                </Button>
                <Button type="submit" variant="sage" size="lg" isLoading={busy} className="min-touch">
                  {editing.mode === "add" ? "Save person" : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title={`Remove ${deleting?.nickname || deleting?.name}?`}
        message="They'll stay in your memory and your heart — this just removes their card."
        confirmLabel="Remove"
        tone="danger"
        busy={busy}
        onConfirm={() => void removePerson()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}