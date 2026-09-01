import type { Metadata } from "next";
import CaregiverChrome from "@/components/caregiver/CaregiverChrome";
import { PatientProvider } from "@/components/caregiver/PatientSwitcher";
import { A11yProvider } from "@/components/ui/a11y-provider";
import { requireCaregiverSession } from "@/components/caregiver/caregiver-db";

export const metadata: Metadata = {
  title: "Remme Caregiver — Look after someone you love",
  description:
    "Keep an eye on reminders, memories, safety and wellbeing for the person you care for.",
};

/**
 * Caregiver Mode chrome: a persistent sidebar (desktop) or collapsible drawer
 * (mobile) plus a top bar with an active-patient switcher. Wraps the whole
 * mode in the PatientProvider so every page can re-scope to one patient.
 */
export default async function CaregiverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCaregiverSession();

  return (
    <A11yProvider>
      <PatientProvider patients={session.patients}>
        <CaregiverChrome>{children}</CaregiverChrome>
      </PatientProvider>
    </A11yProvider>
  );
}
