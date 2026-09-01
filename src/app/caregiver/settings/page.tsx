"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Users,
  UserRound,
  Shield,
  Mail,
  Phone,
  Save,
  Loader2,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Contrast,
  Type,
} from "lucide-react";
import { usePatient } from "@/components/caregiver/PatientSwitcher";
import { A11ySettings, useA11y } from "@/components/ui/a11y-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface PatientOption {
  id: string;
  name: string;
  email?: string | null;
}

interface NotificationPrefs {
  emailReminders: boolean;
  pushReminders: boolean;
  emailAlerts: boolean;
  pushAlerts: boolean;
  emailReports: boolean;
  emailZoneEvents: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  emailReminders: true,
  pushReminders: true,
  emailAlerts: true,
  pushAlerts: true,
  emailReports: false,
  emailZoneEvents: true,
};

const STORAGE_KEY = "remme:caregiver:notifications";

function readPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PREFS;
}

function writePrefs(prefs: NotificationPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export default function CaregiverSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { patients, activeId, setActiveId } = usePatient();
  const { theme: a11yTheme, setReduceTransparency, setLargeText, setHighContrast } = useA11y();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"notifications" | "patients" | "accessibility" | "profile">("notifications");

  // Load prefs on mount
  React.useEffect(() => {
    setPrefs(readPrefs());
  }, []);

  // Persist prefs on change
  React.useEffect(() => {
    writePrefs(prefs);
  }, [prefs]);

  const handleSaveNotifications = async () => {
    setSaving(true);
    setSaved(false);
    // In a real app, this would POST to an API endpoint
    await new Promise((r) => setTimeout(r, 500));
    writePrefs(prefs);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLinkPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError("");
    setLinkSuccess("");
    setLinking(true);

    try {
      const res = await fetch("/api/caregiver/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientEmail: linkEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLinkError(data.error ?? "Failed to link patient.");
        return;
      }

      setLinkSuccess("Patient linked successfully!");
      setLinkEmail("");
      // Refresh the patient list by reloading
      setTimeout(() => router.refresh(), 1000);
    } catch {
      setLinkError("Network error. Please try again.");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkPatient = async (patientId: string) => {
    if (!confirm("Remove this patient from your care circle? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/caregiver/relationships/${patientId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to unlink patient.");
        return;
      }

      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const handleTabClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Restore tab from URL on mount
  React.useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["notifications", "patients", "accessibility", "profile"].includes(tab)) {
      setActiveTab(tab as typeof activeTab);
    }
  }, [searchParams]);

  const activePatient = patients.find((p) => p.id === activeId);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
          Settings
        </h2>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          Manage notifications, linked patients, accessibility, and your profile.
        </p>
      </section>

      {/* Tab navigation */}
      <nav
        className="flex gap-2 rounded-2xl border border-remme-sage/20 bg-white/50 p-1 dark:bg-remme-charcoal/50"
        role="tablist"
        aria-label="Settings sections"
      >
        {([
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "patients", label: "Patients", icon: Users },
          { id: "accessibility", label: "Accessibility", icon: UserRound },
          { id: "profile", label: "Profile", icon: Shield },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => handleTabClick(id)}
            className={`flex min-touch items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-white text-remme-sage-deep shadow-sm dark:bg-remme-charcoal"
                : "text-remme-ink/70 hover:text-remme-ink dark:text-remme-inklight/70 dark:hover:text-remme-inklight"
            }`}
          >
            <Icon aria-hidden className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <section className="flex flex-col gap-4" aria-labelledby="notifications-heading">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl" id="notifications-heading">
                <Bell aria-hidden className="h-5 w-5 text-remme-sage" />
                Notification preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-remme-ink/50">Reminders</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-remme-sage/15 bg-white/60 px-5 py-4 min-touch">
                    <div>
                      <span className="block text-base font-medium text-remme-ink dark:text-remme-inklight">
                        Email reminders
                      </span>
                      <span className="block text-sm text-remme-ink/60 dark:text-remme-inklight/60">
                        Get an email when a reminder is due
                      </span>
                    </div>
                    <Switch
                      checked={prefs.emailReminders}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailReminders: v }))}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-remme-sage/15 bg-white/60 px-5 py-4 min-touch">
                    <div>
                      <span className="block text-base font-medium text-remme-ink dark:text-remme-inklight">
                        Push reminders
                      </span>
                      <span className="block text-sm text-remme-ink/60 dark:text-remme-inklight/60">
                        Receive push notifications for due reminders
                      </span>
                    </div>
                    <Switch
                      checked={prefs.pushReminders}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, pushReminders: v }))}
                    />
                  </label>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-remme-ink/50">Alerts & safety</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-remme-sage/15 bg-white/60 px-5 py-4 min-touch">
                    <div>
                      <span className="block text-base font-medium text-remme-ink dark:text-remme-inklight">
                        Email alerts
                      </span>
                      <span className="block text-sm text-remme-ink/60 dark:text-remme-inklight/60">
                        Get an email when an alert is raised
                      </span>
                    </div>
                    <Switch
                      checked={prefs.emailAlerts}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailAlerts: v }))}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-remme-sage/15 bg-white/60 px-5 py-4 min-touch">
                    <div>
                      <span className="block text-base font-medium text-remme-ink dark:text-remme-inklight">
                        Push alerts
                      </span>
                      <span className="block text-sm text-remme-ink/60 dark:text-remme-inklight/60">
                        Receive push notifications for alerts
                      </span>
                    </div>
                    <Switch
                      checked={prefs.pushAlerts}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, pushAlerts: v }))}
                    />
                  </label>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-remme-ink/50">Reports & zone events</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-remme-sage/15 bg-white/60 px-5 py-4 min-touch">
                    <div>
                      <span className="block text-base font-medium text-remme-ink dark:text-remme-inklight">
                        Email weekly reports
                      </span>
                      <span className="block text-sm text-remme-ink/60 dark:text-remme-inklight/60">
                        Receive a weekly PDF summary
                      </span>
                    </div>
                    <Switch
                      checked={prefs.emailReports}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailReports: v }))}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-remme-sage/15 bg-white/60 px-5 py-4 min-touch">
                    <div>
                      <span className="block text-base font-medium text-remme-ink dark:text-remme-inklight">
                        Email zone events
                      </span>
                      <span className="block text-sm text-remme-ink/60 dark:text-remme-inklight/60">
                        Get an email when the patient enters/exits a safety zone
                      </span>
                    </div>
                    <Switch
                      checked={prefs.emailZoneEvents}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailZoneEvents: v }))}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="sage" size="lg" onClick={handleSaveNotifications} disabled={saving} className="min-touch gap-2">
                  <Loader2 aria-hidden className={`h-5 w-5 ${saving ? "animate-spin" : "hidden"}`} />
                  <Save aria-hidden className="h-5 w-5" />
                  {saving ? "Saving…" : saved ? "Saved!" : "Save preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-remme-amber" />
                <div className="text-base text-remme-ink/70">
                  <p className="font-semibold">Push notifications require permission.</p>
                  <p className="mt-1">
                    When enabled, Remme will ask for browser notification permission. You can manage this
                    in your browser settings at any time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Patients tab */}
      {activeTab === "patients" && (
        <section className="flex flex-col gap-4" aria-labelledby="patients-heading">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl" id="patients-heading">
                <Users aria-hidden className="h-5 w-5 text-remme-sage" />
                Linked patients
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {patients.length === 0 ? (
                <div className="glass-card flex min-h-48 flex-col items-center justify-center gap-4 p-8 text-center">
                  <Users aria-hidden className="h-12 w-12 text-remme-sage/60" />
                  <p className="text-xl font-medium text-remme-ink">No patients linked yet</p>
                  <p className="max-w-md text-remme-ink/60">
                    Add a patient by entering their Remme account email below. They'll receive a request
                    to confirm the link.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${
                        patient.id === activeId
                          ? "border-remme-sage/40 bg-remme-sage/5"
                          : "border-remme-sage/10 bg-white/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-remme-sage/15 flex items-center justify-center">
                          <UserRound aria-hidden className="h-5 w-5 text-remme-sage-deep" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-remme-ink">{patient.name}</p>
                          {patient.email && (
                            <p className="text-sm text-remme-ink/50">{patient.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {patient.id === activeId ? (
                          <Badge variant="sage" className="gap-1">
                            <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
                            Active
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveId(patient.id)}
                            className="min-touch"
                          >
                            Switch
                          </Button>
                        )}
                        {patients.length > 1 && patient.id !== activeId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnlinkPatient(patient.id)}
                            className="text-remme-status-attention hover:text-remme-status-emergency"
                            aria-label={`Remove ${patient.name} from care circle`}
                          >
                            <Trash2 aria-hidden className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator className="my-2" />

              <h3 className="text-sm font-semibold uppercase tracking-wide text-remme-ink/50">Add a patient</h3>
              <form onSubmit={handleLinkPatient} className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Label htmlFor="patient-email" className="sr-only">
                    Patient email
                  </Label>
                  <Input
                    id="patient-email"
                    type="email"
                    placeholder="patient@remme.demo"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    disabled={linking}
                    className="min-h-12 text-lg"
                    aria-describedby="link-hint"
                  />
                  <p id="link-hint" className="mt-1 text-sm text-remme-ink/50">
                    The patient must have a Remme account. They'll confirm the link.
                  </p>
                </div>
                <Button type="submit" disabled={linking || !linkEmail.trim()} className="min-touch min-w-[140px]">
                  <Plus aria-hidden className="h-5 w-5" />
                  {linking ? "Linking…" : "Link patient"}
                </Button>
              </form>

              {linkError && (
                <div className="flex items-center gap-2 rounded-xl bg-remme-status-emergency/10 p-4 text-remme-status-emergency">
                  <AlertCircle aria-hidden className="h-5 w-5 shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}
              {linkSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-remme-sage/10 p-4 text-remme-sage-deep">
                  <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0" />
                  <span>{linkSuccess}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Accessibility tab */}
      {activeTab === "accessibility" && (
        <section className="flex flex-col gap-4" aria-labelledby="accessibility-heading">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl" id="accessibility-heading">
                <UserRound aria-hidden className="h-5 w-5 text-remme-sage" />
                Accessibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <A11ySettings />
              <div className="mt-6 pt-6 border-t border-remme-sage/10">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-remme-ink/50 mb-4">
                  Current state
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={a11yTheme.reduceTransparency ? "sage" : "outline"}>
                    {a11yTheme.reduceTransparency ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                    Reduce transparency
                  </Badge>
                  <Badge variant={a11yTheme.largeText ? "sage" : "outline"}>
                    {a11yTheme.largeText ? <Type className="h-3.5 w-3.5 mr-1" /> : <Type className="h-3.5 w-3.5 mr-1" />}
                    Larger text
                  </Badge>
                  <Badge variant={a11yTheme.highContrast ? "sage" : "outline"}>
                    {a11yTheme.highContrast ? <Contrast className="h-3.5 w-3.5 mr-1" /> : <Contrast className="h-3.5 w-3.5 mr-1" />}
                    High contrast
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-remme-ink/60">
                  These settings apply globally and persist in your browser. They also sync to the Care
                  Mode so the patient benefits from your preferences when you're helping them.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-remme-amber" />
                <div className="text-base text-remme-ink/70">
                  <p className="font-semibold">Accessibility first</p>
                  <p className="mt-1">
                    Remme follows WCAG 2.1 AA. All interactive targets are at least 48×48px. Glass
                    surfaces swap to solid in "Reduce transparency" mode. "High contrast" removes
                    frosted effects and strengthens text/background ratios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Profile tab */}
      {activeTab === "profile" && (
        <section className="flex flex-col gap-4" aria-labelledby="profile-heading">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl" id="profile-heading">
                <Shield aria-hidden className="h-5 w-5 text-remme-sage" />
                Your caregiver profile
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-2xl bg-remme-sage/5 border border-remme-sage/15">
                <div className="h-20 w-20 rounded-2xl bg-remme-sage flex items-center justify-center shrink-0">
                  <UserRound aria-hidden className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-remme-ink">Caregiver account</h3>
                  <p className="mt-1 text-remme-ink/60">
                    Your profile is managed through your Remme account. Changes to name, email, or
                    password apply everywhere.
                  </p>
                </div>
                <Button variant="ghost" size="lg" className="min-touch">
                  Manage account
                </Button>
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-remme-ink/50">Contact preferences</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-2xl border border-remme-sage/15 bg-white/60 p-4">
                    <Mail aria-hidden className="h-6 w-6 text-remme-sage shrink-0" />
                    <div>
                      <p className="text-sm text-remme-ink/50">Primary email</p>
                      <p className="font-medium text-remme-ink">{activePatient?.email ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-remme-sage/15 bg-white/60 p-4">
                    <Phone aria-hidden className="h-6 w-6 text-remme-sage shrink-0" />
                    <div>
                      <p className="text-sm text-remme-ink/50">Phone (SMS alerts)</p>
                      <p className="font-medium text-remme-ink">Not configured</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-remme-ink/50">Data & privacy</h3>
                <div className="flex flex-col gap-3">
                  <Button variant="outline" className="min-touch justify-start gap-3">
                    <Mail aria-hidden className="h-5 w-5" />
                    <span>Export my data (GDPR)</span>
                  </Button>
                  <Button variant="outline" className="min-touch justify-start gap-3 text-remme-status-attention hover:text-remme-status-emergency">
                    <Trash2 aria-hidden className="h-5 w-5" />
                    <span>Delete my account</span>
                  </Button>
                </div>
                <p className="text-sm text-remme-ink/60">
                  Deleting your account removes all your data and unlinks you from patients. This
                  cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}