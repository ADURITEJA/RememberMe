"use client";

import * as React from "react";

export type DeviceRole = "CARE_USER" | "CAREGIVER";

export interface DeviceContext {
  /** Last-selected role on this device (for "switch account" UX). */
  lastRole: DeviceRole | null;
  /** Default patient profileId the caregiver last used on this device. */
  lastProfileId: string | null;
  setLastRole: (role: DeviceRole | null) => void;
  setLastProfileId: (profileId: string | null) => void;
}

const STORAGE_KEY = "remme:device-role";

function readStored(): { role: DeviceRole | null; profileId: string | null } {
  if (typeof window === "undefined") return { role: null, profileId: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        role?: DeviceRole;
        profileId?: string;
      };
      return {
        role: parsed.role === "CARE_USER" || parsed.role === "CAREGIVER" ? parsed.role : null,
        profileId: parsed.profileId ?? null,
      };
    }
  } catch {
    /* ignore malformed storage */
  }
  return { role: null, profileId: null };
}

/**
 * Persists the last-used role/profile on this device so multi-role users
 * (a caregiver who is also a family member patient, for example) can switch
 * quickly. Used by the role selector and "switch account" links.
 */
export function useDeviceRole(): DeviceContext {
  const initial = React.useMemo(readStored, []);
  const [lastRole, setLastRoleRaw] = React.useState<DeviceRole | null>(initial.role);
  const [lastProfileId, setLastProfileIdRaw] = React.useState<string | null>(
    initial.profileId,
  );

  const persist = React.useCallback(
    (role: DeviceRole | null, profileId: string | null) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, profileId }));
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const setLastRole = React.useCallback(
    (role: DeviceRole | null) => {
      setLastRoleRaw(role);
      persist(role, lastProfileId);
    },
    [lastProfileId, persist],
  );

  const setLastProfileId = React.useCallback(
    (profileId: string | null) => {
      setLastProfileIdRaw(profileId);
      persist(lastRole, profileId);
    },
    [lastRole, persist],
  );

  return { lastRole, lastProfileId, setLastRole, setLastProfileId };
}