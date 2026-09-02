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
  dashboardHref: string;
}

/**
 * Lists the patients a caregiver is linked to.
 */
export function PatientPicker({ patients, dashboardHref }: PatientPickerProps) {
  const router = useRouter();
  const { setLastRole, setLastProfileId } = useDeviceRole();

  if (patients.length === 0) {
    return (
      <p className="text-lg text-[#86868b]">
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
      <p className="text-lg font-medium text-[#1d1d1f]">
        Who are you caring for?
      </p>
      <div role="list" aria-label="Linked patients" className="space-y-4">
        {patients.map((patient) => {
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
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
                    <User aria-hidden="true" className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onPick(patient)}
                  aria-label={`Care for ${patient.name ?? "this patient"}`}
                  className="flex min-h-16 flex-1 items-center justify-between gap-4 rounded-[12px] px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40"
                >
                  <span>
                    <span className="block text-xl font-semibold text-[#1d1d1f]">
                      {patient.name ?? "Unnamed patient"}
                    </span>
                    {patient.email ? (
                      <span className="block text-base text-[#86868b]">
                        {patient.email}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight aria-hidden="true" className="h-6 w-6 shrink-0 text-[#86868b]" strokeWidth={1.5} />
                </button>
              </div>
              <Badge variant="sage" className="mt-3">
                <HeartHandshake aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                Linked patient
              </Badge>
            </Card>
          );
        })}
      </div>
    </div>
  );
}