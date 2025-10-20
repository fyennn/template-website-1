"use client";

export const TAKEAWAY_PREFIX = "TAKEAWAY";
const TAKEAWAY_PATTERN = /^TAKEAWAY-(\d{2,})$/;

const padIndex = (index: number) => index.toString().padStart(2, "0");

export function formatTakeawaySlug(index: number): string {
  const safeIndex = Math.max(1, Number.isFinite(index) ? Math.floor(index) : 1);
  return `${TAKEAWAY_PREFIX}-${padIndex(safeIndex)}`;
}

export function parseTakeawayIndex(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  if (upper === TAKEAWAY_PREFIX) {
    return 1;
  }
  const match = upper.match(TAKEAWAY_PATTERN);
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function normalizeTableSlug(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  const index = parseTakeawayIndex(upper);
  if (index !== null) {
    return formatTakeawaySlug(index);
  }
  return upper;
}

export function isTakeawaySlug(value: string | null | undefined): boolean {
  return parseTakeawayIndex(value) !== null;
}

export function formatTakeawayLabel(value: string | null | undefined): string {
  const index = parseTakeawayIndex(value);
  if (index !== null) {
    return `Take Away ${padIndex(index)}`;
  }
  return "Take Away";
}

export function formatTableLabel(value: string | null | undefined): string {
  const normalized = normalizeTableSlug(value);
  if (!normalized) {
    return "Take Away";
  }
  const index = parseTakeawayIndex(normalized);
  if (index !== null) {
    return `Take Away ${padIndex(index)}`;
  }
  if (normalized.startsWith("A-")) {
    return normalized;
  }
  return normalized;
}

export function isCashierCardSlug(value: string | null | undefined): boolean {
  const normalized = normalizeTableSlug(value);
  return normalized?.startsWith("A-") ?? false;
}
