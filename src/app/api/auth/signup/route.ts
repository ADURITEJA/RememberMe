import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidNewUserRole } from "@/lib/roles";

/**
 * POST /api/auth/signup
 * Creates a User (+ CareProfile when role === CARE_USER).
 * Body: { name, email, password, role }
 */

const MIN_PASSWORD_LENGTH = 8;

function looksLikeEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

type ValidationInput = {
  name: string;
  email: string;
  password: string;
  role: "CARE_USER" | "CAREGIVER";
};

function validateInput(body: unknown):
  | { ok: true; data: ValidationInput }
  | {
      ok: false;
      status: number;
      body: { error: string | { field: string; message: string }; fieldErrors: Record<string, string> };
    } {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      status: 400,
      body: { error: "Missing request body.", fieldErrors: {} },
    };
  }

  const raw = body as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const password = typeof raw.password === "string" ? raw.password : "";
  const role = typeof raw.role === "string" ? raw.role : "";

  if (!name) fieldErrors.name = "Name is required.";
  else if (name.length < 1) fieldErrors.name = "Name is required.";
  else if (name.length > 120) fieldErrors.name = "Name is too long.";

  if (!email) fieldErrors.email = "Email is required.";
  else if (!looksLikeEmail(email)) fieldErrors.email = "Enter a valid email address.";
  else if (email.length > 320) fieldErrors.email = "Email is too long.";

  if (!password) fieldErrors.password = "Password is required.";
  else if (password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (password.length > 200) {
    fieldErrors.password = "Password is too long.";
  }

  if (!role) fieldErrors.role = "Role is required.";
  else if (!isValidNewUserRole(role)) {
    fieldErrors.role = "Invalid role; choose CARE_USER or CAREGIVER.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, status: 400, body: { error: "Validation failed.", fieldErrors } };
  }

  return { ok: true, data: { name, email, password, role: role as "CARE_USER" | "CAREGIVER" } };
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const validation = validateInput(raw);

  if (!validation.ok) {
    return NextResponse.json(validation.body, { status: validation.status });
  }

  const { name, email, password, role } = validation.data;

  // Duplicate check (lowercased email from validation)
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      {
        error: { field: "email", message: "An account with this email already exists." },
        fieldErrors: { email: "An account with this email already exists." },
      },
      { status: 409 },
    );
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, password: hash, role },
    });
    if (role === "CARE_USER") {
      await tx.careProfile.create({ data: { userId: created.id } });
    }
    return created;
  });

  return NextResponse.json(
    { ok: true, id: user.id, role: user.role },
    { status: 201 },
  );
}