"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDeviceRole } from "@/hooks/useDeviceRole";
import { ChevronRight, HeartHandshake, User } from "lucide-react";

export interface PatientSummary {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
}

interface PatientPickerProps {
  patients: PatientSummary[];
  /** Where the caregiver lands after picking a patient (dashboard variant). */
  dashboardHref: string;
}

/**
 * Lists the patients a caregiver is linked to. Picking one persists the
 * "last profile" on this device and heads to the caregiver dashboard.
 */
export function PatientPicker({ patients, dashboardHref }: PatientPickerProps) {
  const router = useRouter();
  const { setLastRole, setLastProfileId } = useDeviceRole();

  if (patients.length === 0) {
    return (
      <p className="text-lg text-remme-ink/60 dark:text-remme-inklight/60">
        No patients are linked to you yet.
      </p>
    );
  }

  const onPick = (patient: PatientSummary) => {
    setLastRole("CAREGIVER");
    setLastProfileId(patient.id);
    router.push(dashboardHref);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-remme-ink dark:text-remme-inklight">
        Who are you caring for?
      </p>
      <div role="list" aria-label="Linked patients" className="space-y-4">
        {patients.map((patient) => {
          const avatar = patient.avatar || (patient.name ? patient.name[0] : "?");
          return (
            <Card
              key={patient.id}
              variant="glass-hover"
              role="listitem"
              className="w-full p-5"
            >
              <div className="flex items-center gap-5">
                {patient.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={patient.avatar}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-remme-sage/20 text-remme-sage">
                    <User aria-hidden="true" className="h-8 w-8" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onPick(patient)}
                  aria-label={`Care for ${patient.name ?? "this patient"}`}
                  className="flex min-h-16 flex-1 items-center justify-between gap-4 rounded-2xl px-2 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40"
                >
                  <span>
                    <span className="block text-xl font-semibold text-remme-ink dark:text-remme-inklight">
                      {patient.name ?? "Unnamed patient"}
                    </span>
                    {patient.email ? (
                      <span className="block text-base text-remme-ink/60 dark:text-remme-inklight/60">
                        {patient.email}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight aria-hidden="true" className="h-6 w-6 shrink-0 text-remme-sage" />
                </button>
              </div>
              <Badge variant="sage" className="mt-3">
                <HeartHandshake aria-hidden="true" className="h-4 w-4" />
                Linked patient
              </Badge>
            </Card>
          );
        })}
      </div>
    </div>
  );
}