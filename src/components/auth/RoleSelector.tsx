"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeviceRole } from "@/hooks/useDeviceRole";
import { PatientPicker, type PatientSummary } from "@/components/auth/PatientPicker";
import { HeartHandshake, LogOut, ShieldCheck, User } from "lucide-react";

export interface RoleOptionData {
  type: "patient" | "caregiver" | "admin";
  primary: string;
  description: string;
  href?: string;
  /** Only present for caregiver: the linked patients to pick from. */
  patients?: PatientSummary[];
}

interface RoleSelectorProps {
  userName?: string | null;
  email?: string | null;
  options: RoleOptionData[];
}

/**
 * Post-login "Who are you signing in as?" screen. Shows a card per role the
 * account can act as (patient and/or caregiver). Caregiver cards expose a
 * PatientPicker when there are linked patients.
 */
export function RoleSelector({ userName, email, options }: RoleSelectorProps) {
  const router = useRouter();
  const { setLastRole, setLastProfileId } = useDeviceRole();

  const choose = (option: RoleOptionData) => {
    if (option.href) {
      setLastRole(option.type === "patient" ? "CARE_USER" : option.type === "caregiver" ? "CAREGIVER" : null);
      if (option.type === "patient") setLastProfileId(null);
      router.push(option.href);
    }
  };

  const onLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="space-y-6">
      <PatientCard
        userName={userName}
        email={email}
        options={options}
        onChoose={choose}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          if (option.type === "caregiver") {
            return (
              <Card
                key={option.type}
                variant={option.patients && option.patients.length > 0 ? "glass-hover" : "glass"}
                className="flex flex-col p-6"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-remme-amber/20 text-remme-amber">
                    <HeartHandshake aria-hidden="true" className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl font-semibold text-remme-ink dark:text-remme-inklight">
                    {option.primary}
                  </h2>
                  <p className="text-base text-remme-ink/60 dark:text-remme-inklight/60">
                    {option.description}
                  </p>
                </div>

                {option.patients && option.patients.length > 0 ? (
                  <div className="mt-4">
                    <PatientPicker patients={option.patients} dashboardHref="/caregiver/dashboard" />
                  </div>
                ) : option.href ? (
                  <Button
                    variant="amber"
                    className="mt-4 w-full"
                    onClick={() => choose(option)}
                  >
                    Enter caregiver view
                  </Button>
                ) : null}
              </Card>
            );
          }

          return (
            <Card
              key={option.type}
              variant="glass-hover"
              className="flex flex-col p-6"
            >
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-remme-sage/20 text-remme-sage">
                  {option.type === "admin" ? (
                    <ShieldCheck aria-hidden="true" className="h-7 w-7" />
                  ) : (
                    <User aria-hidden="true" className="h-7 w-7" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-remme-ink dark:text-remme-inklight">
                  {option.primary}
                </h2>
                <p className="text-base text-remme-ink/60 dark:text-remme-inklight/60">
                  {option.description}
                </p>
              </div>
              <Button
                variant={option.type === "patient" ? "sage" : "outline"}
                className="mt-4 w-full"
                onClick={() => choose(option)}
              >
                {option.type === "patient" ? "Enter as patient" : "Enter as " + option.primary.toLowerCase()}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-remme-ink/50 dark:text-remme-inklight/50">
          This is a shared device.
        </p>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut aria-hidden="true" className="mr-2 h-4 w-4" />
          Switch account
        </Button>
      </div>
    </div>
  );
}

function PatientCard({
  userName,
  email,
  options,
  onChoose,
}: {
  userName?: string | null;
  email?: string | null;
  options: RoleOptionData[];
  onChoose: (option: RoleOptionData) => void;
}) {
  const patient = options.find((o) => o.type === "patient");
  return (
    <Card variant="default" className="p-6">
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-remme-sage/20 text-2xl font-bold text-remme-sage">
          {userName ? userName[0]?.toUpperCase() : "R"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold text-remme-ink dark:text-remme-inklight">
            Hi, {userName ?? "there"}
          </p>
          {email ? (
            <p className="truncate text-base text-remme-ink/60 dark:text-remme-inklight/60">
              {email}
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-5 text-xl text-remme-ink dark:text-remme-inklight">
        Who are you signing in as?
      </p>
      {patient ? (
        <Button
          variant="ghost"
          className="mt-2 px-0 text-remme-sage"
          onClick={() => onChoose(patient)}
        >
          I am the person using care
        </Button>
      ) : (
        <p className="mt-2 text-lg text-remme-ink/60 dark:text-remme-inklight/60">
          I am a caregiver or family member
        </p>
      )}
    </Card>
  );
}