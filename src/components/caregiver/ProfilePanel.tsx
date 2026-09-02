"use client";

import * as React from "react";
import {
  UserRound,
  Mail,
  Phone,
  Save,
  Loader2,
  Trash2,
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ProfileData {
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function ProfilePanel({ profile }: { profile: ProfileData }) {
  const [name, setName] = React.useState(profile.name);
  const [email, setEmail] = React.useState(profile.email);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [profileSaved, setProfileSaved] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  // Password change
  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [showNewPw, setShowNewPw] = React.useState(false);
  const [savingPw, setSavingPw] = React.useState(false);
  const [pwSaved, setPwSaved] = React.useState(false);
  const [pwError, setPwError] = React.useState<string | null>(null);

  // Delete account
  const [deletePw, setDeletePw] = React.useState("");
  const [showDeletePw, setShowDeletePw] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Export
  const [exporting, setExporting] = React.useState(false);

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error ?? "Failed to update profile.");
        return;
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setSavingPw(true);
    setPwError(null);
    setPwSaved(false);
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      setSavingPw(false);
      return;
    }
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error ?? "Failed to change password.");
        return;
      }
      setPwSaved(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPwSaved(false), 2000);
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setSavingPw(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/profile/export");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `remme-data-${profile.email ?? "export"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePw || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "Failed to delete account.");
        return;
      }
      // Account deleted — redirect to login
      window.location.href = "/login";
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
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
              <h3 className="text-xl font-semibold text-remme-ink">{profile.name || "Unnamed"}</h3>
              <p className="mt-1 text-remme-ink/60">{profile.email}</p>
              <Badge variant="sage" className="mt-2 gap-1">
                {profile.role === "CAREGIVER" ? "Caregiver" : profile.role === "ADMIN" ? "Administrator" : "Patient"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Edit name & email */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-remme-ink/50">Account details</h3>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="profile-name">Full name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {profileError && (
              <div className="flex items-center gap-2 rounded-xl bg-remme-status-emergency/10 p-3 text-sm text-remme-status-emergency">
                <AlertCircle aria-hidden className="h-4 w-4 shrink-0" />
                {profileError}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="sage" onClick={handleSaveProfile} disabled={savingProfile} className="min-touch gap-2">
                {savingProfile ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
                {savingProfile ? "Saving…" : profileSaved ? "Saved!" : "Save changes"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Change password */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-remme-ink/50">Change password</h3>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="current-pw">Current password</Label>
                <div className="relative">
                  <Input
                    id="current-pw"
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-remme-ink/40 hover:text-remme-ink"
                    aria-label={showCurrentPw ? "Hide password" : "Show password"}
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="new-pw">New password</Label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={showNewPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-remme-ink/40 hover:text-remme-ink"
                    aria-label={showNewPw ? "Hide password" : "Show password"}
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-pw">Confirm new password</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            {pwError && (
              <div className="flex items-center gap-2 rounded-xl bg-remme-status-emergency/10 p-3 text-sm text-remme-status-emergency">
                <AlertCircle aria-hidden className="h-4 w-4 shrink-0" />
                {pwError}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="sage"
                onClick={handleChangePassword}
                disabled={savingPw || !currentPw || !newPw || !confirmPw}
                className="min-touch gap-2"
              >
                {savingPw ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
                {savingPw ? "Saving…" : pwSaved ? "Updated!" : "Change password"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & privacy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Download aria-hidden className="h-5 w-5 text-remme-sage" />
            Data &amp; privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="min-touch justify-start gap-3"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? <Loader2 aria-hidden className="h-5 w-5 animate-spin" /> : <Download aria-hidden className="h-5 w-5" />}
            <span>{exporting ? "Exporting…" : "Export my data (GDPR)"}</span>
          </Button>
          <p className="text-sm text-remme-ink/60">
            Download a JSON file containing all your account data, linked patients, and care records.
          </p>

          <Separator />

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="min-touch justify-start gap-3 text-remme-status-attention hover:text-remme-status-emergency"
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            >
              <Trash2 aria-hidden className="h-5 w-5" />
              <span>Delete my account</span>
            </Button>

            {showDeleteConfirm && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-500/30 dark:bg-rose-950/20">
                <p className="mb-3 text-sm font-medium text-rose-700 dark:text-rose-400">
                  This will permanently delete your account and all linked data. This cannot be undone.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="password"
                    value={deletePw}
                    onChange={(e) => setDeletePw(e.target.value)}
                    placeholder="Confirm your password"
                    className="flex-1"
                  />
                  <Button
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="min-touch gap-2"
                  >
                    {deleting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden className="h-4 w-4" />}
                    {deleting ? "Deleting…" : "Permanently delete"}
                  </Button>
                </div>
                {deleteError && (
                  <p className="mt-2 text-sm text-rose-600">{deleteError}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
