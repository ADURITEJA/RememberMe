"use client";

import * as React from "react";
import {
  Clock,
  Pencil,
  Plus,
  Trash2,
  Power,
  ChevronUp,
  ChevronDown,
  Sunrise,
  Sun,
  Moon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createRoutine,
  updateRoutine,
  deleteRoutine,
  addStep,
  updateStep,
  deleteStep,
  reorderSteps,
} from "@/components/caregiver/routines-actions";

type StepRow = {
  id: string;
  title: string;
  timeEst: string | null;
  order: number;
};

type RoutineRow = {
  id: string;
  name: string;
  isActive: boolean;
  steps: StepRow[];
};

const PERIODS = [
  { key: "Morning", icon: Sunrise, color: "text-remme-amber", bg: "bg-remme-amber/10" },
  { key: "Afternoon", icon: Sun, color: "text-remme-sage", bg: "bg-remme-sage/10" },
  { key: "Evening", icon: Moon, color: "text-remme-ink/60", bg: "bg-remme-ink/5" },
] as const;

/* ------------------------------------------------------------------ *
 *  Routine Name Dialog (Add / Edit)
 * ------------------------------------------------------------------ */

function RoutineDialog({
  open,
  onOpenChange,
  initial,
  patientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: RoutineRow | null;
  patientId: string;
}) {
  const editing = initial !== null;
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setError(null);
  }, [open, initial]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Give the routine a name.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = editing
      ? await updateRoutine(patientId, initial.id, { name })
      : await createRoutine(patientId, { name });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? "Edit routine" : "Add a routine"}>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="cg-routine-name">Routine name</Label>
            <Input
              id="cg-routine-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Morning"
            />
            <p className="mt-1 text-xs text-remme-ink/50">
              Use &quot;Morning&quot;, &quot;Afternoon&quot; or &quot;Evening&quot; to group under a period.
            </p>
          </div>
          {error ? <p className="text-base text-remme-status-attention">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} isLoading={saving}>
              {editing ? "Save changes" : "Add routine"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ *
 *  Step Dialog (Add / Edit)
 * ------------------------------------------------------------------ */

function StepDialog({
  open,
  onOpenChange,
  routineId,
  initial,
  patientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineId: string;
  initial: StepRow | null;
  patientId: string;
}) {
  const editing = initial !== null;
  const [title, setTitle] = React.useState("");
  const [timeEst, setTimeEst] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setTimeEst(initial?.timeEst ?? "");
    setError(null);
  }, [open, initial]);

  const submit = async () => {
    if (!title.trim()) {
      setError("Give the step a name.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = editing
      ? await updateStep(patientId, initial.id, { title, timeEst: timeEst || null })
      : await addStep(patientId, routineId, { title, timeEst: timeEst || null });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? "Edit step" : "Add a step"}>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="cg-step-title">Step name</Label>
            <Input
              id="cg-step-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Take morning medication"
            />
          </div>
          <div>
            <Label htmlFor="cg-step-time">Time or duration (optional)</Label>
            <Input
              id="cg-step-time"
              value={timeEst}
              onChange={(e) => setTimeEst(e.target.value)}
              placeholder="08:00 AM"
            />
          </div>
          {error ? <p className="text-base text-remme-status-attention">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} isLoading={saving}>
              {editing ? "Save changes" : "Add step"}
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
  title,
  message,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title}>
        <p className="text-lg text-remme-ink/70">{message}</p>
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

export default function RoutinePanel({
  patientId,
  routines,
}: {
  patientId: string;
  routines: RoutineRow[];
}) {
  const [routineDialog, setRoutineDialog] = React.useState(false);
  const [editingRoutine, setEditingRoutine] = React.useState<RoutineRow | null>(null);

  const [stepDialog, setStepDialog] = React.useState(false);
  const [stepRoutineId, setStepRoutineId] = React.useState<string | null>(null);
  const [editingStep, setEditingStep] = React.useState<StepRow | null>(null);

  const [deleteTarget, setDeleteTarget] = React.useState<{
    kind: "routine" | "step";
    id: string;
    routineId?: string;
  } | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [moving, setMoving] = React.useState<string | null>(null);

  const active = routines.filter((r) => r.isActive);
  const inactive = routines.filter((r) => !r.isActive);

  const move = async (routine: RoutineRow, step: StepRow, dir: -1 | 1) => {
    const sorted = [...routine.steps].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === step.id);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[idx], next[target]] = [next[target], next[idx]];
    setMoving(step.id);
    const result = await reorderSteps(
      patientId,
      routine.id,
      next.map((s) => s.id),
    );
    setMoving(null);
    if (!result.ok) setError(result.error);
  };

  const StepRowView = ({ routine, step }: { routine: RoutineRow; step: StepRow }) => (
    <li className="flex items-center gap-2 rounded-xl border border-remme-sage/10 bg-white/55 px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-remme-sage/10 text-remme-sage-deep">
        <Clock aria-hidden className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-remme-ink">{step.title}</p>
        {step.timeEst ? (
          <p className="text-sm text-remme-ink/55">{step.timeEst}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <div className="flex flex-col">
          <button
            type="button"
            aria-label="Move step up"
            disabled={moving === step.id}
            className="min-touch rounded p-1 text-remme-ink/50 hover:bg-remme-sage/10 hover:text-remme-ink"
            onClick={() => move(routine, step, -1)}
          >
            <ChevronUp aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Move step down"
            disabled={moving === step.id}
            className="min-touch rounded p-1 text-remme-ink/50 hover:bg-remme-sage/10 hover:text-remme-ink"
            onClick={() => move(routine, step, 1)}
          >
            <ChevronDown aria-hidden className="h-4 w-4" />
          </button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Edit step"
          onClick={() => {
            setStepRoutineId(routine.id);
            setEditingStep(step);
            setStepDialog(true);
          }}
        >
          <Pencil aria-hidden className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Delete step"
          onClick={() => setDeleteTarget({ kind: "step", id: step.id, routineId: routine.id })}
        >
          <Trash2 aria-hidden className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );

  const RoutineCard = ({ routine }: { routine: RoutineRow }) => {
    const period = PERIODS.find((p) => p.key === routine.name);
    return (
      <Card className={cn(!routine.isActive && "opacity-70")}>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {period ? (
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", period.bg)}>
                  <period.icon aria-hidden className={cn("h-6 w-6", period.color)} />
                </span>
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-remme-sage/10 text-remme-sage-deep">
                  <Sunrise aria-hidden className="h-6 w-6" />
                </span>
              )}
              <div>
                <p className="text-lg font-semibold text-remme-ink dark:text-remme-inklight">
                  {routine.name}
                </p>
                <p className="text-sm text-remme-ink/55">
                  {routine.steps.length} step{routine.steps.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={routine.isActive ? "sage" : "outline"}>
                {routine.isActive ? "Active" : "Paused"}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Edit routine"
                onClick={() => {
                  setEditingRoutine(routine);
                  setRoutineDialog(true);
                }}
              >
                <Pencil aria-hidden className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={routine.isActive ? "Pause routine" : "Resume routine"}
                onClick={async () => {
                  const result = await updateRoutine(patientId, routine.id, {
                    isActive: !routine.isActive,
                  });
                  if (!result.ok) setError(result.error);
                }}
              >
                <Power aria-hidden className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Delete routine"
                onClick={() => setDeleteTarget({ kind: "routine", id: routine.id })}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {routine.steps.length > 0 ? (
            <ul className="flex flex-col gap-2" aria-label={`${routine.name} steps`}>
              {[...routine.steps]
                .sort((a, b) => a.order - b.order)
                .map((step) => (
                  <StepRowView key={step.id} routine={routine} step={step} />
                ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-remme-sage/20 px-4 py-5 text-center text-base text-remme-ink/45">
              No steps yet. Add one below.
            </p>
          )}

          <Button
            type="button"
            variant="glass"
            size="sm"
            className="self-start"
            onClick={() => {
              setStepRoutineId(routine.id);
              setEditingStep(null);
              setStepDialog(true);
            }}
          >
            <Plus aria-hidden className="h-4 w-4 mr-1" /> Add step
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          Daily routines appear on the person&apos;s &quot;Routine&quot; screen, where they can tap each step when done.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditingRoutine(null);
            setRoutineDialog(true);
          }}
        >
          <Plus aria-hidden className="h-4 w-4 mr-1" /> Add routine
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-remme-status-attention/10 px-4 py-3 text-base text-remme-status-attention">
          {error}
        </p>
      ) : null}

      {routines.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-lg text-remme-ink/55">
            No routines yet. Add a &quot;Morning&quot;, &quot;Afternoon&quot; or &quot;Evening&quot; routine to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {active.map((r) => (
            <RoutineCard key={r.id} routine={r} />
          ))}
          {inactive.length > 0 ? (
            <>
              <p className="mt-2 text-base font-medium text-remme-ink/55">Paused</p>
              {inactive.map((r) => (
                <RoutineCard key={r.id} routine={r} />
              ))}
            </>
          ) : null}
        </div>
      )}

      <RoutineDialog
        open={routineDialog}
        onOpenChange={setRoutineDialog}
        initial={editingRoutine}
        patientId={patientId}
      />

      <StepDialog
        open={stepDialog}
        onOpenChange={setStepDialog}
        routineId={stepRoutineId ?? ""}
        initial={editingStep}
        patientId={patientId}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        loading={deleting}
        title={deleteTarget?.kind === "routine" ? "Delete this routine?" : "Delete this step?"}
        message={
          deleteTarget?.kind === "routine"
            ? "This deletes the routine and all of its steps. That action cannot be undone."
            : "This removes the step from the routine. That action cannot be undone."
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          const result =
            deleteTarget.kind === "routine"
              ? await deleteRoutine(patientId, deleteTarget.id)
              : await deleteStep(patientId, deleteTarget.id);
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
