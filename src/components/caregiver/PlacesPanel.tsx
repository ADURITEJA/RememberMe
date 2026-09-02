"use client";

import * as React from "react";
import { createPlace, updatePlace, deletePlace } from "./places-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Pencil, Trash2, Phone, StickyNote } from "lucide-react";

interface Place {
  id: string;
  patientId: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  contactNumber: string | null;
  notes: string | null;
  photoUrl: string | null;
}

export function PlacesPanel({
  patientId,
  places,
}: {
  patientId: string;
  places: Place[];
}) {
  const [dialog, setDialog] = React.useState<"add" | Place | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Place | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [contactNumber, setContactNumber] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (dialog === "add") {
      setName(""); setAddress(""); setContactNumber(""); setNotes(""); setError(null);
    } else if (dialog && typeof dialog === "object") {
      setName(dialog.name); setAddress(dialog.address);
      setContactNumber(dialog.contactNumber ?? ""); setNotes(dialog.notes ?? ""); setError(null);
    }
  }, [dialog]);

  async function handleSave() {
    if (!dialog) return;
    setLoading(true); setError(null);
    try {
      const result = typeof dialog === "object"
        ? await updatePlace(patientId, dialog.id, { name, address, contactNumber: contactNumber || undefined, notes: notes || undefined })
        : await createPlace(patientId, { name, address, contactNumber: contactNumber || undefined, notes: notes || undefined });
      if (!result.ok) { setError(result.error); return; }
      setDialog(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deletePlace(patientId, deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-remme-ink dark:text-remme-inklight">
          Important Places
        </h2>
        <Button onClick={() => setDialog("add")}>
          <Plus aria-hidden className="mr-2 h-4 w-4" /> Add Place
        </Button>
      </div>

      {/* Places list */}
      {places.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-amber-400/40 bg-amber-50/30 p-8 text-center dark:border-amber-500/30 dark:bg-amber-950/20">
          <p className="text-remme-ink/60 dark:text-remme-inklight/60">
            No important places added yet. Add familiar places to help orientation.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {places.map((p) => (
            <div key={p.id} className="glass-card rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <MapPin aria-hidden className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-remme-ink dark:text-remme-inklight">{p.name}</p>
                  <p className="text-sm text-remme-ink/55 dark:text-remme-inklight/55">{p.address}</p>
                  {p.contactNumber && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-remme-ink/45 dark:text-remme-inklight/45">
                      <Phone className="h-3 w-3" /> {p.contactNumber}
                    </p>
                  )}
                  {p.notes && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-remme-ink/45 dark:text-remme-inklight/45">
                      <StickyNote className="h-3 w-3" /> {p.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDialog(p)}
                    className="rounded-full p-2 text-remme-ink/40 hover:bg-remme-sage/15 hover:text-remme-ink dark:text-remme-inklight/40 dark:hover:text-remme-inklight"
                    aria-label={`Edit ${p.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="rounded-full p-2 text-remme-ink/40 hover:bg-rose-500/15 hover:text-rose-600"
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      {dialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDialog(null)}>
          <div className="glass-card mx-4 w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-remme-ink dark:text-remme-inklight">
              {typeof dialog === "object" ? "Edit Place" : "Add Place"}
            </h3>
            {error && (
              <p className="mb-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{error}</p>
            )}
            <div className="space-y-3">
              <Input
                placeholder="Place name (e.g. Home, Grocery Store)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                placeholder="Contact number (optional)"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                type="tel"
              />
              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              Remove <strong>{deleteTarget.name}</strong> from important places?
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
