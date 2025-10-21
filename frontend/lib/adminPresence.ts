"use client";

import type { AdminRole } from "@/lib/adminUsers";

export const ADMIN_PRESENCE_STORAGE_KEY = "spm-admin-presence";
export const ADMIN_PRESENCE_EVENT = "spm:admin-presence";
export const ADMIN_ACTIVITY_THRESHOLD_MS = 2 * 60 * 1000;

export type AdminPresenceRecord = {
  email: string;
  role: AdminRole | null;
  lastSeen: number;
  lastLogin: number;
  active: boolean;
};

type PresenceMap = Record<string, AdminPresenceRecord>;

const isBrowser = typeof window !== "undefined";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readPresence(): PresenceMap {
  if (!isBrowser) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(ADMIN_PRESENCE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    const map: PresenceMap = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
      if (!value || typeof value !== "object") {
        return;
      }
      const record = value as Partial<AdminPresenceRecord>;
      if (typeof record.lastSeen !== "number" || typeof record.lastLogin !== "number") {
        return;
      }
      const normalizedKey = normalizeEmail(key);
      map[normalizedKey] = {
        email: normalizedKey,
        role: (record.role ?? null) as AdminRole | null,
        lastSeen: record.lastSeen,
        lastLogin: record.lastLogin,
        active: Boolean(record.active),
      };
    });
    return map;
  } catch (error) {
    console.error("Failed to read admin presence", error);
    return {};
  }
}

function writePresence(map: PresenceMap) {
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.setItem(ADMIN_PRESENCE_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(ADMIN_PRESENCE_EVENT));
  } catch (error) {
    console.error("Failed to write admin presence", error);
  }
}

function upsertPresence(
  email: string,
  updates: Partial<AdminPresenceRecord> & { lastSeen?: number; lastLogin?: number }
) {
  if (!email) {
    return;
  }
  const map = readPresence();
  const key = normalizeEmail(email);
  const existing = map[key] ?? {
    email: key,
    role: null,
    lastSeen: 0,
    lastLogin: 0,
    active: false,
  };
  map[key] = {
    ...existing,
    ...updates,
    email: key,
    role: (updates.role ?? existing.role) ?? null,
    lastSeen: updates.lastSeen ?? existing.lastSeen,
    lastLogin: updates.lastLogin ?? existing.lastLogin,
    active: updates.active ?? existing.active,
  };
  writePresence(map);
}

export function loadAdminPresence(): PresenceMap {
  return readPresence();
}

export function markAdminActive(email: string, role: AdminRole | null) {
  const now = Date.now();
  upsertPresence(email, {
    role,
    lastSeen: now,
    lastLogin: now,
    active: true,
  });
}

export function heartbeatAdminPresence(email: string, role: AdminRole | null) {
  upsertPresence(email, {
    role,
    lastSeen: Date.now(),
    active: true,
  });
}

export function markAdminInactive(email: string) {
  upsertPresence(email, {
    lastSeen: Date.now(),
    active: false,
  });
}

export function clearStalePresence(maxIdleMs = 24 * 60 * 60 * 1000) {
  if (!isBrowser) {
    return;
  }
  const map = readPresence();
  const cutoff = Date.now() - maxIdleMs;
  let changed = false;
  Object.entries(map).forEach(([key, record]) => {
    if (record.lastSeen < cutoff) {
      delete map[key];
      changed = true;
    }
  });
  if (changed) {
    writePresence(map);
  }
}
