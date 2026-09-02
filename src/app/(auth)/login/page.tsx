import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

/**
 * /login — unified branded Remme sign-in.
 */
export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) redirect("/role");

  const hasGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <>
      <h2 className="text-2xl font-semibold text-[#1d1d1f]">
        Welcome back
      </h2>
      <p className="mb-6 mt-1 text-lg text-[#86868b]">
        Sign in to continue to Remme.
      </p>
      <LoginForm hasGoogle={hasGoogle} />
    </>
  );
}