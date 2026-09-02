import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignupForm } from "@/components/auth/SignupForm";
import { SIGNUP_ROLES } from "@/lib/roles";

/**
 * /signup — create a profile as a patient (CARE_USER) or caregiver.
 */
export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) redirect("/role");

  return (
    <>
      <h2 className="text-2xl font-semibold text-[#1d1d1f]">
        Create your account
      </h2>
      <p className="mb-6 mt-1 text-lg text-[#86868b]">
        It only takes a minute.
      </p>
      <SignupForm roles={SIGNUP_ROLES} />
    </>
  );
}