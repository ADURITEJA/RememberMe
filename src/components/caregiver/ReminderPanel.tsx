"use client";

import * as React from "react";
import { Clock, Pencil, Trash2, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createReminder,
  updateReminder,
  toggleReminder,
  deleteReminder,
} from "@/components/caregiver/reminders-actions";

type ReminderRow = {
  id: string;
  title: string;
  description: string | null;
  time: string;
  category: string;
  recurrence: string;
  isActive: boolean;
};

const CATEGORIES = ["Medication", "Meals", "Appointments", "Exercise", "Hydration", "General"];
const RECURRENCES = ["DAILY", "WEEKLY", "ONCE"];

function ReminderDialog({
  open,
  onOpenChange,
  initial,
  patientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ReminderRow | null;
  patientId: string;
}) {
  const editing = initial !== null;
  const [title, setTitle] = React.useState("");
  const [time, setTime] = React.useState("09:00");
  const [recurrence, setRecurrence] = React.useState("DAILY");
  const [category, setCategory] = React.useState("General");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setTime(initial.time);
      setRecurrence(initial.recurrence);
      setCategory(initial.category);
      setDescription(initial.description ?? "");
    } else {
      setTitle("");
      setTime("09:00");
      setRecurrence("DAILY");
      setCategory("General");
      setDescription("");
    }
    setError(null);
  }, [open, initial]);

  const submit = async () => {
    if (!title.trim()) {
      setError("Give the reminder a name.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setError("Pick a valid time (HH:mm).");
      return;
    }
    setSaving(true);
    setError(null);
    const result = editing
      ? await updateReminder(patientId, initial.id, { title, time, recurrence, category, description })
      : await createReminder(patientId, { title, time, recurrence, category, description });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? "Edit reminder" : "Add a reminder"}>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="cg-reminder-title">Reminder name</Label>
            <Input
              id="cg-reminder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Morning medication"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cg-reminder-time">Time</Label>
              <Input id="cg-reminder-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cg-reminder-recurrence">Repeats</Label>
              <Select id="cg-reminder-recurrence" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                {RECURRENCES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="cg-reminder-category">Category</Label>
            <Select id="cg-reminder-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="cg-reminder-desc">Notes (optional)</Label>
            <Textarea
              id="cg-reminder-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Take with food."
              rows={3}
            />
          </div>
          {error ? <p className="text-base text-remme-status-attention">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} isLoading={saving}>
              {editing ? "Save changes" : "Add reminder"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Remove this reminder?">
        <p className="text-lg text-remme-ink/70">
          This will delete the reminder and its history. That action cannot be undone.
        </p>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} isLoading={loading}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ReminderPanel({
  patientId,
  reminders,
}: {
  patientId: string;
  reminders: ReminderRow[];
}) {
  const active = reminders.filter((r) => r.isActive);
  const inactive = reminders.filter((r) => !r.isActive);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ReminderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ReminderRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const Row = ({ r }: { r: ReminderRow }) => (
    <li className="flex flex-col gap-3 rounded-2xl border border-remme-sage/10 bg-white/55 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-remme-sage/15 text-remme-sage-deep">
          <Clock aria-hidden className="h-6 w-6" />
        </span>
        <div>
          <p className="text-lg font-medium text-remme-ink">{r.title}</p>
          <p className="text-sm text-remme-ink/55">
            {r.time} · {r.recurrence} · {r.category}
            {r.description ? ` · ${r.description}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={r.isActive ? "sage" : "outline"}>{r.isActive ? "Active" : "Paused"}</Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Edit reminder"
          onClick={() => {
            setEditing(r);
            setDialogOpen(true);
          }}
        >
          <Pencil aria-hidden className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={r.isActive ? "Pause reminder" : "Resume reminder"}
          onClick={async () => {
            const result = await toggleReminder(patientId, r.id, !r.isActive);
            if (!result.ok) setError(result.error);
          }}
        >
          <Power aria-hidden className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Delete reminder"
          onClick={() => setDeleteTarget(r)}
        >
          <Trash2 aria-hidden className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-remme-ink dark:text-remme-inklight">
          All reminders
        </h3>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add reminder
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-remme-status-attention/10 px-4 py-3 text-base text-remme-status-attention">
          {error}
        </p>
      ) : null}

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-lg text-remme-ink/55">
            No reminders yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="flex flex-col gap-3" aria-label="Reminders">
            {active.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
          {inactive.length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="mb-3 text-base font-medium text-remme-ink/65">Paused</p>
                <ul className="flex flex-col gap-3" aria-label="Paused reminders">
                  {inactive.map((r) => (
                    <Row key={r.id} r={r} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      <ReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        patientId={patientId}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          const result = await deleteReminder(patientId, deleteTarget.id);
          setDeleting(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
