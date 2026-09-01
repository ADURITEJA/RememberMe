"use client";

import * as React from "react";
import { Clock, Pencil, Trash2, Power, Plus, AlertTriangle, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createMedication,
  updateMedication,
  toggleMedication,
  deleteMedication,
} from "@/components/caregiver/medications-actions";

type MedicationRow = {
  id: string;
  name: string;
  dosage: string;
  instructions: string | null;
  imageUrl: string | null;
  frequency: string;
  times: string;
  refillDate: string | null;
  isActive: boolean;
  adherence: { taken: number; skipped: number; missed: number; total: number };
};

type LogEntry = {
  medicationId: string;
  status: string;
  scheduledFor: string;
};

const FREQUENCIES = ["DAILY", "WEEKLY", "AS_NEEDED"];

/* ------------------------------------------------------------------ *
 *  Adherence Ring (SVG donut)
 * ------------------------------------------------------------------ */

function AdherenceRing({
  taken,
  skipped,
  missed,
}: {
  taken: number;
  skipped: number;
  missed: number;
}) {
  const total = taken + skipped + missed;
  if (total === 0) return <div className="h-24 w-24 rounded-full border-4 border-dashed border-remme-sage/20" />;

  const pct = (n: number) => (n / total) * 100;
  const r = 40;
  const circumference = 2 * Math.PI * r;

  const takenArc = pct(taken);
  const skippedArc = pct(skipped);

  const offset = (p: number) => -((p / 100) * circumference) / 4; // start from top

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        {/* Taken */}
        {takenArc > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="rgb(107 142 95)"   // remme-sage
            strokeWidth="12"
            strokeDasharray={`${(takenArc / 100) * circumference} ${circumference}`}
            strokeDashoffset="0"
          />
        )}
        {/* Skipped */}
        {skippedArc > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="rgb(200 170 100)"  // remme-amber
            strokeWidth="12"
            strokeDasharray={`${(skippedArc / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((takenArc / 100) * circumference)}
          />
        )}
        {/* Missed */}
        {missed > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="rgb(180 120 100)"  // muted red
            strokeWidth="12"
            strokeDasharray={`${((100 - takenArc - skippedArc) / 100) * circumference} ${circumference}`}
            strokeDashoffset={-(((takenArc + skippedArc) / 100) * circumference)}
          />
        )}
        {/* Background ring */}
        {total < (taken + skipped + missed) && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="rgb(200 200 200)"
            strokeWidth="12"
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl font-bold text-remme-ink">
          {total > 0 ? Math.round((taken / total) * 100) : 0}%
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Medication Dialog (Add / Edit)
 * ------------------------------------------------------------------ */

function MedicationDialog({
  open,
  onOpenChange,
  initial,
  patientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: MedicationRow | null;
  patientId: string;
}) {
  const editing = initial !== null;
  const [name, setName] = React.useState("");
  const [dosage, setDosage] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [frequency, setFrequency] = React.useState("DAILY");
  const [times, setTimes] = React.useState("09:00");
  const [refillDate, setRefillDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setDosage(initial.dosage);
      setInstructions(initial.instructions ?? "");
      setFrequency(initial.frequency);
      setTimes(initial.times);
      setRefillDate(initial.refillDate ? initial.refillDate.slice(0, 10) : "");
    } else {
      setName("");
      setDosage("");
      setInstructions("");
      setFrequency("DAILY");
      setTimes("09:00");
      setRefillDate("");
    }
    setError(null);
  }, [open, initial]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Give the medication a name.");
      return;
    }
    if (!dosage.trim()) {
      setError("Enter the dosage (e.g. 1 tablet).");
      return;
    }
    setSaving(true);
    const result = editing
      ? await updateMedication(patientId, initial.id, { name, dosage, instructions, frequency, times, refillDate })
      : await createMedication(patientId, { name, dosage, instructions, frequency, times, refillDate });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? "Edit medication" : "Add a medication"}>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="cg-med-name">Medication name</Label>
            <Input
              id="cg-med-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Donepezil"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cg-med-dosage">Dosage</Label>
              <Input
                id="cg-med-dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="10mg"
              />
            </div>
            <div>
              <Label htmlFor="cg-med-frequency">Frequency</Label>
              <Select id="cg-med-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{f.replace("_", " ")}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cg-med-times">Scheduled time(s)</Label>
              <Input
                id="cg-med-times"
                value={times}
                onChange={(e) => setTimes(e.target.value)}
                placeholder="09:00, 21:00"
              />
              <p className="mt-1 text-xs text-remme-ink/50">Comma-separated, e.g. 09:00, 21:00</p>
            </div>
            <div>
              <Label htmlFor="cg-med-refill">Refill date (optional)</Label>
              <Input
                id="cg-med-refill"
                type="date"
                value={refillDate}
                onChange={(e) => setRefillDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="cg-med-instructions">Notes / instructions</Label>
            <Textarea
              id="cg-med-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Take with food, after breakfast"
              rows={3}
            />
          </div>
          {error ? <p className="text-base text-remme-status-attention">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} isLoading={saving}>
              {editing ? "Save changes" : "Add medication"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ *
 *  Confirm Delete Dialog
 * ------------------------------------------------------------------ */

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
      <DialogContent title="Remove this medication?">
        <p className="text-lg text-remme-ink/70">
          This will delete the medication and all its dose history. That action cannot be undone.
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

/* ------------------------------------------------------------------ *
 *  Main Panel
 * ------------------------------------------------------------------ */

export default function MedicationPanel({
  patientId,
  medications,
  logs,
}: {
  patientId: string;
  medications: MedicationRow[];
  logs: LogEntry[];
}) {
  const active = medications.filter((m) => m.isActive);
  const inactive = medications.filter((m) => !m.isActive);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MedicationRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MedicationRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Compute total adherence across all meds
  const totalTaken = active.reduce((s, m) => s + m.adherence.taken, 0);
  const totalSkipped = active.reduce((s, m) => s + m.adherence.skipped, 0);
  const totalMissed = active.reduce((s, m) => s + m.adherence.missed, 0);

  // Missed doses in last 7 days
  const missedCount = logs.filter((l) => l.status === "MISSED").length;

  const Row = ({ m }: { m: MedicationRow }) => (
    <li className="flex flex-col gap-3 rounded-2xl border border-remme-sage/10 bg-white/55 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-remme-sage/15 text-remme-sage-deep">
          <Clock aria-hidden className="h-6 w-6" />
        </span>
        <div>
          <p className="text-lg font-medium text-remme-ink">{m.name}</p>
          <p className="text-sm text-remme-ink/55">
            {m.dosage} · {m.frequency.replace("_", " ")} · {m.times}
            {m.instructions ? ` · ${m.instructions}` : ""}
          </p>
          {m.refillDate ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-remme-amber">
              <CalendarClock aria-hidden className="h-3 w-3" />
              Refill: {new Date(m.refillDate).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Mini adherence badge */}
        {m.adherence.total > 0 && (
          <Badge variant="sage">
            {Math.round((m.adherence.taken / m.adherence.total) * 100)}% taken
          </Badge>
        )}
        <Badge variant={m.isActive ? "sage" : "outline"}>{m.isActive ? "Active" : "Paused"}</Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Edit medication"
          onClick={() => { setEditing(m); setDialogOpen(true); }}
        >
          <Pencil aria-hidden className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={m.isActive ? "Pause medication" : "Resume medication"}
          onClick={async () => {
            const result = await toggleMedication(patientId, m.id, !m.isActive);
            if (!result.ok) setError(result.error);
          }}
        >
          <Power aria-hidden className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Delete medication"
          onClick={() => setDeleteTarget(m)}
        >
          <Trash2 aria-hidden className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Adherence overview */}
      <div className="flex items-center gap-5 rounded-2xl border border-remme-sage/10 bg-white/55 p-5">
        <AdherenceRing taken={totalTaken} skipped={totalSkipped} missed={totalMissed} />
        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold text-remme-ink">30-day adherence</p>
          <p className="text-sm text-remme-ink/60">
            {totalTaken + totalSkipped + totalMissed > 0
              ? `${totalTaken} taken · ${totalSkipped} skipped · ${totalMissed} missed`
              : "No dose data yet — doses will appear once your loved one logs them."}
          </p>
          {missedCount > 0 && (
            <p className="flex items-center gap-1 text-sm text-remme-status-attention">
              <AlertTriangle aria-hidden className="h-3.5 w-3.5" />
              {missedCount} missed dose{missedCount !== 1 ? "s" : ""} in last 7 days
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-remme-ink/55">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-remme-sage" /> Taken</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-remme-amber" /> Skipped</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-red-400" /> Missed</span>
      </div>

      {/* Active medications */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-remme-ink dark:text-remme-inklight">
          Active medications
        </h3>
        <Button
          type="button"
          size="sm"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus aria-hidden className="h-4 w-4 mr-1" /> Add medication
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-remme-status-attention/10 px-4 py-3 text-base text-remme-status-attention">
          {error}
        </p>
      ) : null}

      {active.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-remme-sage/20 px-5 py-8 text-center text-lg text-remme-ink/50">
          No active medications. Add one to start tracking adherence.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">{active.map((m) => <Row key={m.id} m={m} />)}</ul>
      )}

      {/* Inactive / paused */}
      {inactive.length > 0 && (
        <>
          <h3 className="text-lg font-medium text-remme-ink/50">Paused</h3>
          <ul className="flex flex-col gap-3">{inactive.map((m) => <Row key={m.id} m={m} />)}</ul>
        </>
      )}

      {/* Dialogs */}
      <MedicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        patientId={patientId}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          const result = await deleteMedication(patientId, deleteTarget.id);
          setDeleting(false);
          if (!result.ok) {
            setError(result.error);
          } else {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}