import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/profile/delete — Delete the current user's account and all linked data.
 * Requires password confirmation for email/password accounts.
 * Body (optional): { password?: string }
 */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // If user has a password (email login), require password confirmation
  if (user.password) {
    let body: { password?: string } = {};
    try {
      body = await request.json();
    } catch {}
    if (!body.password) {
      return NextResponse.json(
        { error: "Password is required to delete your account." },
        { status: 400 },
      );
    }
    const bcrypt = (await import("bcryptjs")).default;
    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 403 },
      );
    }
  }

  // Delete user — cascade deletes handle CareProfile and all linked data
  await prisma.user.delete({
    where: { id: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
