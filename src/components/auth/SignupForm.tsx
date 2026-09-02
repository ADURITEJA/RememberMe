"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { RoleOption } from "@/lib/roles";

type ApiError = { field?: string; message: string };

export interface SignupFormProps {
  roles: RoleOption[];
  enabled?: boolean;
}

const FRIENDLY_NAMES: Record<string, string> = {
  name: "Full name",
  email: "Email",
  password: "Password",
  role: "Role",
};

function fieldError(
  fieldErrors: Record<string, string> | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field];
}

export function SignupForm({ roles, enabled = true }: SignupFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<string>(roles[0]?.value ?? "CARE_USER");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string> | null>(null);
  const [formError, setFormError] = React.useState<ApiError | null>(null);
  const [loading, setLoading] = React.useState(false);

  if (!enabled) return null;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors(null);
    setFormError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: ApiError | string;
        fieldErrors?: Record<string, string>;
      };

      if (!res.ok) {
        if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
          setFieldErrors(data.fieldErrors);
        } else if (typeof data.error === "string") {
          setFormError({ message: data.error });
        } else if (data.error && typeof data.error === "object") {
          setFormError(data.error);
        }
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (result?.error) {
        router.push("/login?created=1");
        router.refresh();
        return;
      }
      router.push("/role");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="space-y-5">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fieldError(fieldErrors ?? {}, "name"))}
            aria-describedby={
              fieldError(fieldErrors ?? {}, "name") ? "signup-name-error" : undefined
            }
          />
          {fieldError(fieldErrors ?? {}, "name") ? (
            <p id="signup-name-error" className="mt-2 text-base font-medium text-[#ff9f0a]">
              {fieldError(fieldErrors ?? {}, "name")}
            </p>
          ) : null}
        </div>

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
            aria-invalid={Boolean(fieldError(fieldErrors ?? {}, "email"))}
            aria-describedby={
              fieldError(fieldErrors ?? {}, "email") ? "signup-email-error" : undefined
            }
          />
          {fieldError(fieldErrors ?? {}, "email") ? (
            <p id="signup-email-error" className="mt-2 text-base font-medium text-[#ff9f0a]">
              {fieldError(fieldErrors ?? {}, "email")}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldError(fieldErrors ?? {}, "password"))}
            aria-describedby={
              fieldError(fieldErrors ?? {}, "password")
                ? "signup-password-error"
                : "password-hint"
            }
          />
          {fieldError(fieldErrors ?? {}, "password") ? (
            <p id="signup-password-error" className="mt-2 text-base font-medium text-[#ff9f0a]">
              {fieldError(fieldErrors ?? {}, "password")}
            </p>
          ) : (
            <p id="password-hint" className="mt-2 text-sm text-[#86868b]/70">
              Use at least 8 characters.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="role">I am signing up as…</Label>
          <Select
            id="role"
            name="role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-invalid={Boolean(fieldError(fieldErrors ?? {}, "role"))}
            aria-label="Role when signing up"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          {fieldError(fieldErrors ?? {}, "role") ? (
            <p id="signup-role-error" className="mt-2 text-base font-medium text-[#ff9f0a]">
              {fieldError(fieldErrors ?? {}, "role")}
            </p>
          ) : null}
        </div>
      </div>

      {formError ? (
        <p
          id="signup-error"
          role="alert"
          aria-live="polite"
          className="rounded-[12px] border border-[#ff9f0a]/30 bg-[#ff9f0a]/8 px-4 py-3 text-[15px] font-medium text-[#ff9f0a]"
        >
          {formError.field
            ? `${FRIENDLY_NAMES[formError.field] ?? formError.field}: ${formError.message}`
            : formError.message}
        </p>
      ) : null}

      <Button type="submit" className="min-touch w-full" isLoading={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-[15px] text-[#86868b]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#0071e3] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}