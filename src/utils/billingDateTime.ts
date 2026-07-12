import type { BillingDateTime } from "../types/entry.ts";

const MINUTES_PER_DAY = 24 * 60;

export function parseBillingDateTime(
  input: string,
  fallbackDay = 1,
): BillingDateTime | null {
  if (!/^\d{1,6}$/.test(input)) return null;

  let day: number;
  let time: string;
  if (input.length <= 4) {
    day = fallbackDay;
    time = input.padStart(4, "0");
  } else {
    const padded = input.padStart(6, "0");
    day = Number(padded.slice(0, 2));
    time = padded.slice(2);
  }

  const hour = Number(time.slice(0, 2));
  const minute = Number(time.slice(2, 4));
  if (day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  return { day, hour, minute };
}

export function toBillingMinutes(value: BillingDateTime): number {
  return (value.day - 1) * MINUTES_PER_DAY + value.hour * 60 + value.minute;
}

export function compareBillingDateTime(
  left: BillingDateTime,
  right: BillingDateTime,
): number {
  return toBillingMinutes(left) - toBillingMinutes(right);
}

export function isSameBillingDateTime(
  left: BillingDateTime,
  right: BillingDateTime,
): boolean {
  return compareBillingDateTime(left, right) === 0;
}

export function formatBillingDateTime(value: BillingDateTime): string {
  return `${value.day}日${String(value.hour).padStart(2, "0")}時${String(value.minute).padStart(2, "0")}分`;
}

export function formatBillingDateTimeForInput(value: BillingDateTime): string {
  return `${value.day}${String(value.hour).padStart(2, "0")}${String(value.minute).padStart(2, "0")}`;
}

export type BillingDateTimePreview =
  | { kind: "empty"; day: number; message: string }
  | { kind: "valid"; value: BillingDateTime; message: string }
  | { kind: "invalid"; message: string };

export function previewBillingDateTime(
  input: string,
  fallbackDay = 1,
): BillingDateTimePreview {
  const normalized = input.trim();
  if (!normalized) {
    return {
      kind: "empty",
      day: fallbackDay,
      message: `時刻のみの場合は${fallbackDay}日として追加します`,
    };
  }

  const value = parseBillingDateTime(normalized, fallbackDay);
  if (!value) {
    return {
      kind: "invalid",
      message: "DDHHMMまたはHHMMで入力してください（例：2日9時7分は20907）",
    };
  }

  return {
    kind: "valid",
    value,
    message: `${value.day}日 ${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}として追加します`,
  };
}

export function endOfBillingDayMinutes(day: number): number {
  return day * MINUTES_PER_DAY;
}
