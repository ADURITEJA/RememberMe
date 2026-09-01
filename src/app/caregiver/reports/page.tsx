import { requireActivePatient } from "@/components/caregiver/caregiver-db";
import { ReportGenerator } from "@/components/caregiver/ReportGenerator";

export const metadata = { title: "Reports — Remme Caregiver" };

export default async function CaregiverReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string | string[] }>;
}) {
  const { patient } = await searchParams;
  const { patient: active } = await requireActivePatient(patient);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-remme-ink dark:text-remme-inklight">
          Reports for {active.name}
        </h2>
        <p className="text-lg text-remme-ink/65 dark:text-remme-inklight/65">
          Generate a snapshot of quiz trends, mood patterns and activity. Export as a PDF to share
          with the care team.
        </p>
      </section>

      <ReportGenerator patientId={active.id} patientName={active.name} />
    </div>
  );
}
