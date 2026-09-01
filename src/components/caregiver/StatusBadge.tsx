import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Tone = "default" | "sage" | "amber" | "attention" | "emergency" | "muted";

const TONES: Record<Tone, string> = {
  default: "bg-remme-sage/15 text-remme-sage-deep",
  sage: "bg-remme-sage text-white",
  amber: "bg-remme-amber/20 text-remme-ink",
  attention: "bg-remme-status-attention/15 text-remme-status-attention",
  emergency: "bg-remme-status-emergency/15 text-remme-status-emergency",
  muted: "bg-remme-ink/10 text-remme-ink/60",
};

/**
 * Small status pill with a semantic color (same shape as the shared <Badge>
 * but with a lighter, tinted look that suits dense caregiver tables).
 */
export function StatusBadge({
  tone = "default",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(TONES[tone], "border-transparent", className)}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn(
            "h-2 w-2 rounded-full",
            tone === "sage" && "bg-remme-sage",
            tone === "amber" && "bg-remme-amber",
            tone === "attention" && "bg-remme-status-attention",
            tone === "emergency" && "bg-remme-status-emergency",
            tone === "muted" && "bg-remme-ink/40",
          )}
        />
      ) : null}
      {children}
    </Badge>
  );
}

export function reminderTone(status: string | undefined): Tone {
  if (status === "COMPLETED") return "sage";
  if (status === "MISSED") return "emergency";
  return "amber";
}

export function reminderLabel(status: string | undefined): string {
  if (status === "COMPLETED") return "Done";
  if (status === "MISSED") return "Missed";
  return "Upcoming";
}

export function alertTone(type: string | undefined): Tone {
  const t = (type ?? "").toUpperCase();
  if (t.includes("SOS")) return "emergency";
  if (t.includes("ZONE") || t.includes("EXIT")) return "attention";
  if (t.includes("MISSED")) return "attention";
  return "default";
}

export { TONES };
