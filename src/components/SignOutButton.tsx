"use client";

import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as React from "react";

export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = React.useState(false);

  return (
    <Button
      variant="outline"
      className={className ?? "min-touch gap-2"}
      disabled={loading}
      onClick={() => {
        setLoading(true);
        signOut({ callbackUrl: "/login" });
      }}
    >
      {loading ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut aria-hidden className="h-4 w-4" />
      )}
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
