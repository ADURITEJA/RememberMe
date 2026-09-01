"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn } from "lucide-react";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...props}
      className={(props.className as string) + " " + "h-5 w-5"}
    >
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.02 5.02 0 0 1-2.18 3.38v2.81h3.53c2.06-1.9 3.29-4.7 3.29-8.2Z"
      />
      <path
        fill="currentColor"
        d="M12 24c2.97 0 5.46-.98 7.28-2.66l-3.53-2.81A6.76 6.76 0 0 1 12 19.54c-2.97 0-5.5-2-6.41-4.7H1.97v2.95A11 11 0 0 0 12 24Z"
      />
      <path
        fill="currentColor"
        d="M5.59 14.84A6.52 6.52 0 0 1 5.22 12c0-.98.14-1.92.37-2.84L1.97 6.21A11 11 0 0 0 1 12c0 1.78.42 3.47 1.17 4.97l3.42-2.13Z"
      />
      <path
        fill="currentColor"
        d="M12 5.38a6.2 6.2 0 0 1 4.35 1.7l3.25-3.25A10.76 10.76 0 0 0 12 0C7.7 0 4 2.45 1.97 6.21l3.62 2.81C6.5 6.32 9.02 5.38 12 5.38Z"
      />
    </svg>
  );
}

interface LoginFormProps {
  hasGoogle: boolean;
}

function errorMessage(err: string): string {
  switch (err) {
    case "CredentialsSignin":
      return "Email and password did not match. Please try again.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthAccountNotLinked":
      return "There was a problem signing in. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function LoginForm({ hasGoogle }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (result?.error) {
        setError(errorMessage(result.error));
        return;
      }

      // Remember-me flag is advisory; NextAuth JWT lifetime is configured server-side.
      if (rememberMe) {
        try {
          window.localStorage.setItem("remme:rememberMe", "1");
        } catch {
          /* ignore */
        }
      }

      router.push("/role");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("google", {
        callbackUrl: "/role",
        redirect: false,
      });
      if (result?.error) {
        setError(errorMessage(result.error));
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={error ? "login-error" : undefined}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            minLength={1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={error ? "login-error" : undefined}
            disabled={loading}
          />
        </div>

        <label className="flex min-touch items-center gap-3 text-lg text-remme-ink/70 dark:text-remme-inklight/70">
          <input
            type="checkbox"
            name="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-6 w-6 rounded-lg border-remme-sage/40 text-remme-sage focus:ring-remme-sage/40 focus:ring-offset-0"
            disabled={loading}
            aria-label="Remember me on this device"
          />
          Remember me
        </label>
      </div>

      {error ? (
        <p
          id="login-error"
          role="alert"
          aria-live="polite"
          className="rounded-2xl border border-remme-status-attention/40 bg-remme-status-attention/10 px-4 py-3 text-base font-medium text-remme-status-attention"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="sage" className="min-touch w-full" isLoading={loading}>
        {loading ? (
          "Signing in…"
        ) : (
          <>
            <LogIn aria-hidden="true" className="mr-2 h-5 w-5" />
            Sign in
          </>
        )}
      </Button>

      {hasGoogle ? (
        <>
          <div
            role="separator"
            aria-label="or"
            className="flex items-center gap-4 text-sm font-medium text-remme-ink/40 dark:text-remme-inklight/40"
          >
            <span className="h-px flex-1 bg-remme-ink/10 dark:bg-remme-inklight/10" aria-hidden="true" />
            or
            <span className="h-px flex-1 bg-remme-ink/10 dark:bg-remme-inklight/10" aria-hidden="true" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </>
      ) : null}

      <p className="text-center text-lg text-remme-ink/60 dark:text-remme-inklight/60">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-remme-sage hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}