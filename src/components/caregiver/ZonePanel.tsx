"use client";

import * as React from "react";
import { createZone, updateZone, deleteZone, toggleZone } from "./zones-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Plus, Pencil, Trash2 } from "lucide-react";

interface Zone {
  id: string;
  patientId: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  activeHours: string | null;
  isActive: boolean;
}

export function ZonePanel({
  patientId,
  zones,
}: {
  patientId: string;
  zones: Zone[];
}) {
  const [dialog, setDialog] = React.useState<"add" | Zone | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Zone | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [radius, setRadius] = React.useState("200");

  React.useEffect(() => {
    if (dialog === "add") {
      setName(""); setLat(""); setLng(""); setRadius("200"); setError(null);
    } else if (dialog && typeof dialog === "object") {
      setName(dialog.name); setLat(String(dialog.lat)); setLng(String(dialog.lng)); setRadius(String(dialog.radius)); setError(null);
    }
  }, [dialog]);

  async function handleSave() {
    if (!dialog) return;
    setLoading(true); setError(null);
    try {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusNum = parseInt(radius, 10);
      if (isNaN(latNum) || isNaN(lngNum)) { setError("Enter valid latitude and longitude."); return; }
      if (isNaN(radiusNum) || radiusNum < 50 || radiusNum > 10000) { setError("Radius must be 50–10,000 meters."); return; }

      const result = typeof dialog === "object"
        ? await updateZone(patientId, dialog.id, { name, lat: latNum, lng: lngNum, radius: radiusNum })
        : await createZone(patientId, { name, lat: latNum, lng: lngNum, radius: radiusNum });
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
      await deleteZone(patientId, deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(zone: Zone) {
    await toggleZone(patientId, zone.id, !zone.isActive);
  }

  const activeZones = zones.filter((z) => z.isActive);
  const inactiveZones = zones.filter((z) => !z.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-remme-ink dark:text-remme-inklight">
          Safety Zones
        </h2>
        <Button onClick={() => setDialog("add")}>
          <Plus aria-hidden className="mr-2 h-4 w-4" /> Add Zone
        </Button>
      </div>

      {zones.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-emerald-400/40 bg-emerald-50/30 p-8 text-center dark:border-emerald-500/30 dark:bg-emerald-950/20">
          <p className="text-remme-ink/60 dark:text-remme-inklight/60">
            No safety zones defined. Create zones to monitor when your patient leaves familiar areas.
          </p>
        </div>
      ) : (
        <>
          {/* Active zones */}
          {activeZones.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Active Zones</h3>
              {activeZones.map((z) => (
                <ZoneCard key={z.id} zone={z} onEdit={() => setDialog(z)} onDelete={() => setDeleteTarget(z)} onToggle={() => handleToggle(z)} />
              ))}
            </div>
          )}
          {/* Inactive zones */}
          {inactiveZones.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-remme-ink/40 dark:text-remme-inklight/40">Inactive</h3>
              {inactiveZones.map((z) => (
                <ZoneCard key={z.id} zone={z} onEdit={() => setDialog(z)} onDelete={() => setDeleteTarget(z)} onToggle={() => handleToggle(z)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      {dialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDialog(null)}>
          <div className="glass-card mx-4 w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-remme-ink dark:text-remme-inklight">
              {typeof dialog === "object" ? "Edit Zone" : "Add Safety Zone"}
            </h3>
            {error && (
              <p className="mb-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{error}</p>
            )}
            <div className="space-y-3">
              <Input
                placeholder="Zone name (e.g. Home, Grocery Store)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  type="number"
                  step="any"
                />
                <Input
                  placeholder="Longitude"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  type="number"
                  step="any"
                />
              </div>
              <Input
                placeholder="Radius in meters (50–10,000)"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                type="number"
              />
              <p className="text-xs text-remme-ink/45 dark:text-remme-inklight/45">
                Enter coordinates of the zone center. Radius defines how far from center triggers an alert.
              </p>
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
              Delete safety zone <strong>{deleteTarget.name}</strong>? All zone events for this zone will also be removed.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} disabled={loading}>
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ZoneCard({
  zone,
  onEdit,
  onDelete,
  onToggle,
}: {
  zone: Zone;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className={`glass-card flex items-center gap-4 rounded-3xl p-5 ${!zone.isActive ? "opacity-60" : ""}`}>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${zone.isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-remme-ink/10 text-remme-ink/40"}`}>
        <Shield aria-hidden className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-remme-ink dark:text-remme-inklight">{zone.name}</p>
        <p className="text-xs text-remme-ink/50 dark:text-remme-inklight/50">
          Radius: {zone.radius}m
        </p>
      </div>
      <div className="flex gap-1">
        <button
          onClick={onToggle}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${zone.isActive ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400" : "bg-remme-ink/10 text-remme-ink/60 hover:bg-remme-ink/15 dark:text-remme-inklight/60"}`}
          aria-label={zone.isActive ? "Deactivate zone" : "Activate zone"}
        >
          {zone.isActive ? "Active" : "Inactive"}
        </button>
        <button
          onClick={onEdit}
          className="rounded-full p-2 text-remme-ink/40 hover:bg-remme-sage/15 hover:text-remme-ink dark:text-remme-inklight/40 dark:hover:text-remme-inklight"
          aria-label={`Edit ${zone.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-full p-2 text-remme-ink/40 hover:bg-rose-500/15 hover:text-rose-600"
          aria-label={`Delete ${zone.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
