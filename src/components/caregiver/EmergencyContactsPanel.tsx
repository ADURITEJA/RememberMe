"use client";

import * as React from "react";
import {
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "./emergency-contacts-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface EmergencyContact {
  id: string;
  patientId: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  order: number;
}

export function EmergencyContactsPanel({
  patientId,
  contacts,
}: {
  patientId: string;
  contacts: EmergencyContact[];
}) {
  const [dialog, setDialog] = React.useState<"add" | EmergencyContact | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EmergencyContact | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [relationship, setRelationship] = React.useState("");

  React.useEffect(() => {
    if (dialog === "add") {
      setName(""); setPhone(""); setRelationship(""); setError(null);
    } else if (dialog && typeof dialog === "object") {
      setName(dialog.name); setPhone(dialog.phoneNumber); setRelationship(dialog.relationship); setError(null);
    }
  }, [dialog]);

  async function handleSave() {
    if (!dialog) return;
    setLoading(true); setError(null);
    try {
      const result = typeof dialog === "object"
        ? await updateEmergencyContact(patientId, dialog.id, { name, phoneNumber: phone, relationship })
        : await createEmergencyContact(patientId, { name, phoneNumber: phone, relationship });
      if (!result.ok) { setError(result.error); return; }
      setDialog(null);
      // Page revalidates on server
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteEmergencyContact(patientId, deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setLoading(false);
    }
  }

  const relationshipColors: Record<string, string> = {
    "Spouse": "bg-pink-500/20 text-pink-700 dark:text-pink-400",
    "Son": "bg-blue-500/20 text-blue-700 dark:text-blue-400",
    "Daughter": "bg-purple-500/20 text-purple-700 dark:text-purple-400",
    "Sibling": "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    "Doctor": "bg-rose-500/20 text-rose-700 dark:text-rose-400",
    "Friend": "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-remme-ink dark:text-remme-inklight">
          Emergency Contacts
        </h2>
        <Button onClick={() => setDialog("add")}>
          <Plus aria-hidden className="mr-2 h-4 w-4" /> Add Contact
        </Button>
      </div>

      {/* Contacts list */}
      {contacts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-rose-400/40 bg-rose-50/30 p-8 text-center dark:border-rose-500/30 dark:bg-rose-950/20">
          <p className="text-remme-ink/60 dark:text-remme-inklight/60">
            No emergency contacts yet. Add one so they appear during SOS.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {contacts.map((c) => {
            const colorClass = relationshipColors[c.relationship] ?? "bg-slate-500/20 text-slate-700 dark:text-slate-400";
            return (
              <div
                key={c.id}
                className="glass-card flex items-center gap-4 rounded-3xl p-5"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <Phone aria-hidden className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-remme-ink dark:text-remme-inklight">{c.name}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                      {c.relationship}
                    </span>
                  </div>
                  <p className="text-sm text-remme-ink/55 dark:text-remme-inklight/55">
                    {c.phoneNumber}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDialog(c)}
                    className="rounded-full p-2 text-remme-ink/40 hover:bg-remme-sage/15 hover:text-remme-ink dark:text-remme-inklight/40 dark:hover:text-remme-inklight"
                    aria-label={`Edit ${c.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="rounded-full p-2 text-remme-ink/40 hover:bg-rose-500/15 hover:text-rose-600"
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      {dialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDialog(null)}>
          <div className="glass-card mx-4 w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-remme-ink dark:text-remme-inklight">
              {typeof dialog === "object" ? "Edit Contact" : "Add Contact"}
            </h3>
            {error && (
              <p className="mb-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{error}</p>
            )}
            <div className="space-y-3">
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
              />
              <Input
                placeholder="Relationship (e.g. Spouse, Son, Doctor)"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="glass-card mx-4 w-full max-w-sm rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-remme-ink dark:text-remme-inklight">
              Remove <strong>{deleteTarget.name}</strong> from emergency contacts?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} disabled={loading}>
                {loading ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
