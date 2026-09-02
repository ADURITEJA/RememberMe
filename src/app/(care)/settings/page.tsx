"use client";

import * as React from "react";
import {
  UserRound,
  Calendar,
  MapPin,
  FileText,
  Stethoscope,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ProfilePanel } from "@/components/caregiver/ProfilePanel";
import { SignOutButton } from "@/components/SignOutButton";

interface ProfileData {
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface CareProfileData {
  dateOfBirth: string | null;
  address: string | null;
  diagnosis: string | null;
  medicalNotes: string | null;
}

export default function PatientSettingsPage() {
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [careProfile, setCareProfile] = React.useState<CareProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Care profile editing
  const [dob, setDob] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [diagnosis, setDiagnosis] = React.useState("");
  const [medicalNotes, setMedicalNotes] = React.useState("");
  const [savingCare, setSavingCare] = React.useState(false);
  const [careSaved, setCareSaved] = React.useState(false);
  const [careError, setCareError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setProfile(data);

        // Load care profile if patient
        if (data.role === "CARE_USER") {
          const careRes = await fetch("/api/profile/care-profile");
          if (careRes.ok) {
            const careData = await careRes.json();
            setCareProfile(careData);
            setDob(careData.dateOfBirth ? careData.dateOfBirth.slice(0, 10) : "");
            setAddress(careData.address ?? "");
            setDiagnosis(careData.diagnosis ?? "");
            setMedicalNotes(careData.medicalNotes ?? "");
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveCareProfile() {
    setSavingCare(true);
    setCareError(null);
    setCareSaved(false);
    try {
      const res = await fetch("/api/profile/care-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth: dob || null,
          address: address.trim() || null,
          diagnosis: diagnosis.trim() || null,
          medicalNotes: medicalNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCareError(data.error ?? "Failed to update care profile.");
        return;
      }
      setCareSaved(true);
      setTimeout(() => setCareSaved(false), 2000);
    } catch {
      setCareError("Network error. Please try again.");
    } finally {
      setSavingCare(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-remme-sage" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-2xl bg-remme-status-emergency/10 p-6 text-center text-remme-status-emergency">
        {error ?? "Could not load profile."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-remme-ink">Settings</h1>
        <p className="mt-1 text-remme-ink/60">Manage your account and personal details.</p>
      </div>

      {/* Account profile (name, email, password, data export, delete) */}
      <ProfilePanel profile={profile} />

      {/* Patient-specific care profile */}
      {profile.role === "CARE_USER" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Stethoscope aria-hidden className="h-5 w-5 text-remme-sage" />
              Care profile
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-remme-ink/60">
              Your caregiver can see this information to help take better care of you.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="dob">Date of birth</Label>
                <div className="relative">
                  <Calendar aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-remme-ink/40" />
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-remme-ink/40" />
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Your home address"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <div className="relative">
                  <FileText aria-hidden className="absolute left-3 top-3 h-4 w-4 text-remme-ink/40" />
                  <Input
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Early-stage Alzheimer's"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="medical-notes">Medical notes</Label>
                <textarea
                  id="medical-notes"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="Any additional medical information your caregiver should know"
                  rows={3}
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pl-10"
                />
              </div>
            </div>

            {careError && (
              <div className="flex items-center gap-2 rounded-xl bg-remme-status-emergency/10 p-3 text-sm text-remme-status-emergency">
                <AlertCircle aria-hidden className="h-4 w-4 shrink-0" />
                {careError}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="sage"
                onClick={handleSaveCareProfile}
                disabled={savingCare}
                className="min-touch gap-2"
              >
                {savingCare ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
                {savingCare ? "Saving…" : careSaved ? "Saved!" : "Save care profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign out */}
      <div className="flex justify-center pt-4 pb-8">
        <SignOutButton />
      </div>
    </div>
  );
}
