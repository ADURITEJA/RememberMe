"use client";

/**
 * SOS Page — Big red safety net.
 *
 * Flow:
 * 1. Big SOS button -> ConfirmDialog "Are you sure you need help?"
 * 2. On confirm -> POST /api/sos -> Alert created, mock push sent
 * 3. Calm "Help is on the way" screen with real emergency contact call buttons (tel:)
 * 4. Never fakes a live call — just opens tel: links to real contacts.
 */

import { useState } from "react";
import { Phone, AlertCircle, ShieldCheck, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/care/ConfirmDialog";

export default function SOSPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [helpSent, setHelpSent] = useState(false);
  const [contacts, setContacts] = useState<Array<{
    id: string;
    name: string;
    phoneNumber: string;
    relationship: string;
    order: number;
  }>>([]);
  const [busy, setBusy] = useState(false);

  const triggerSOS = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not send SOS");
      setContacts(data.contacts ?? []);
      setHelpSent(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Sorry, we couldn't send the alert. Please try again or call 911 directly.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-4 py-8">
      {!helpSent ? (
        /* --- Big SOS button --- */
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-remme-status-emergency/10 ring-4 ring-remme-status-emergency/20">
              <AlertCircle aria-hidden className="h-20 w-20 text-remme-status-emergency" />
            </div>
            <h1 className="text-caretitle font-bold text-remme-status-emergency">Emergency SOS</h1>
            <p className="max-w-md text-caresubtitle leading-snug text-center text-remme-ink/70">
              Tap the button below if you need help right now. We&apos;ll alert your emergency contacts and show you who to call.
            </p>
          </div>

          <Button
            onClick={() => setShowConfirm(true)}
            disabled={busy}
            variant="danger"
            size="xl"
            className={cn(
              "min-h-20 min-w-20 md:min-h-24 md:min-w-24 rounded-full text-2xl font-bold gap-3 min-touch",
              busy && "opacity-50",
            )}
            aria-label="Trigger emergency SOS"
          >
            <span className="flex items-center gap-2">
              <AlertCircle aria-hidden className="h-8 w-8" />
              <span>Need help now</span>
            </span>
          </Button>

          <p className="text-sm text-remme-ink/50 max-w-xs text-center">
            This will send an alert to your emergency contacts and show you their numbers to call.
          </p>
        </div>
      ) : (
        /* --- Calm "help is on the way" screen --- */
        <div className="flex flex-col items-center gap-6 w-full max-w-xl text-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-remme-sage/12 text-remme-sage">
            <ShieldCheck aria-hidden className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-remme-ink">
            Help is on the way
          </h1>
          <p className="max-w-lg text-xl leading-relaxed text-remme-ink/75">
            We&apos;ve sent an alert to your emergency contacts. You&apos;re not alone —
            someone will be with you soon. 💛
          </p>

          {contacts.length > 0 && (
            <section className="w-full space-y-3" aria-label="Emergency contacts">
              <h2 className="text-lg font-semibold text-remme-ink/80">
                Tap a name to call
              </h2>
              {contacts.map((c) => (
                <a
                  key={c.id}
                  href={`tel:${c.phoneNumber}`}
                  className="glass-card flex items-center gap-4 p-4 text-left min-touch"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-remme-sage/10 text-remme-sage">
                    <Phone aria-hidden className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-remme-ink truncate">{c.name}</p>
                    <p className="text-base text-remme-ink/60">
                      {c.relationship} · {c.phoneNumber}
                    </p>
                  </div>
                </a>
              ))}
            </section>
          )}

          {contacts.length === 0 && (
            <p className="glass-card p-4 text-base text-remme-ink/70 max-w-md">
              No emergency contacts are set up yet. Please call 911 (or your local
              emergency number) directly if you&apos;re in immediate danger.
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              className="min-touch flex-1"
              onClick={() => {
                setHelpSent(false);
                setShowConfirm(false);
                setContacts([]);
              }}
            >
              <X aria-hidden className="h-5 w-5 mr-2" /> Back to safety screen
            </Button>
            <Button
              variant="sage"
              size="lg"
              className="min-touch flex-1"
              onClick={() => window.location.href = "/home"}
            >
              <Heart aria-hidden className="h-5 w-5 mr-2" /> Go home
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        onConfirm={triggerSOS}
        onCancel={() => setShowConfirm(false)}
        title="Are you sure you need help?"
        message="This will send an alert to your emergency contacts right away. They&apos;ll know you need help and can call or come to you."
        confirmLabel="Yes, send help now"
        cancelLabel="No, I&apos;m okay"
        tone="danger"
        busy={busy}
      />
    </div>
  );
}