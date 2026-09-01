"use client";

import { Select } from "@/components/ui/select";

export function AlertFilterBar({
  status,
  patient,
}: {
  status: string | null;
  patient: string | string[] | undefined;
}) {
  return (
    <Select
      value={status ?? "ALL"}
      onChange={(e) => {
        const params = new URLSearchParams();
        if (e.target.value !== "ALL") params.set("status", e.target.value);
        if (patient) params.set("patient", Array.isArray(patient) ? patient[0] : patient);
        window.location.search = params.toString();
      }}
    >
      <option value="ALL">All statuses</option>
      <option value="UNREAD">Unread</option>
      <option value="READ">Read</option>
    </Select>
  );
}
