"use client";

import * as React from "react";
import { Pencil, Phone, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPerson,
  updatePerson,
  deletePerson,
} from "@/components/caregiver/people-actions";

type PersonRow = {
  id: string;
  name: string;
  relationship: string;
  nickname: string | null;
  phoneNumber: string | null;
  description: string | null;
  photoUrl: string | null;
};

function PersonDialog({
  open,
  onOpenChange,
  initial,
  patientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: PersonRow | null;
  patientId: string;
}) {
  const editing = initial !== null;
  const [name, setName] = React.useState("");
  const [relationship, setRelationship] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setRelationship(initial.relationship);
      setNickname(initial.nickname ?? "");
      setPhoneNumber(initial.phoneNumber ?? "");
      setDescription(initial.description ?? "");
    } else {
      setName("");
      setRelationship("");
      setNickname("");
      setPhoneNumber("");
      setDescription("");
    }
    setError(null);
  }, [open, initial]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Give the person a name.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = editing
      ? await updatePerson(patientId, initial.id, { name, relationship, nickname, phoneNumber, description })
      : await createPerson(patientId, { name, relationship, nickname, phoneNumber, description });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? "Edit person" : "Add a person"}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cg-person-name">Name</Label>
              <Input id="cg-person-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Meera" />
            </div>
            <div>
              <Label htmlFor="cg-person-rel">Relationship</Label>
              <Input id="cg-person-rel" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Granddaughter" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cg-person-nickname">Nickname (optional)</Label>
              <Input id="cg-person-nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cg-person-phone">Phone (optional)</Label>
              <Input id="cg-person-phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 …" />
            </div>
          </div>
          <div>
            <Label htmlFor="cg-person-desc">About them (optional)</Label>
            <Textarea id="cg-person-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          {error ? <p className="text-base text-remme-status-attention">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} isLoading={saving}>
              {editing ? "Save changes" : "Add person"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PeoplePanel({
  patientId,
  people,
}: {
  patientId: string;
  people: PersonRow[];
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PersonRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PersonRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-remme-ink dark:text-remme-inklight">
          People in their life
        </h3>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add person
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-remme-status-attention/10 px-4 py-3 text-base text-remme-status-attention">
          {error}
        </p>
      ) : null}

      {people.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-lg text-remme-ink/55">
            No people listed yet. Add their loved ones so the memories can connect.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="People">
          {people.map((p) => (
            <li key={p.id}>
              <Card variant="glass-hover" className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-remme-sage/15 text-remme-sage-deep">
                        <UserRound aria-hidden className="h-7 w-7" />
                      </span>
                    )}
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${p.name}`}
                        onClick={() => {
                          setEditing(p);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-remme-ink">
                    {p.name}
                    {p.nickname ? <span className="text-remme-ink/50"> ({p.nickname})</span> : null}
                  </p>
                  <Badge variant="outline" className="mt-1.5">
                    {p.relationship}
                  </Badge>
                  {p.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-remme-ink/60">{p.description}</p>
                  ) : null}
                  {p.phoneNumber ? (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-remme-ink/60">
                      <Phone aria-hidden className="h-4 w-4" /> {p.phoneNumber}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <PersonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        patientId={patientId}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent title={`Remove ${deleteTarget?.name ?? "this person"}?`}>
          <p className="text-lg text-remme-ink/70">
            They&apos;ll be removed from this patient&apos;s people and memory quizzes.
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleting}
              onClick={async () => {
                if (!deleteTarget) return;
                setDeleting(true);
                const result = await deletePerson(patientId, deleteTarget.id);
                setDeleting(false);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setDeleteTarget(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
