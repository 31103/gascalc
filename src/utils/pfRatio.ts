import type { Entry } from "../types/entry.ts";
import type { Fio2Candidate, OxygenMeasurement } from "../types/pfRatio.ts";
import {
  compareBillingDateTime,
  isSameBillingDateTime,
  toBillingMinutes,
} from "./billingDateTime.ts";

export interface PfRatioResult {
  measurement: OxygenMeasurement;
  pao2: number;
  pao2Estimated: boolean;
  oxygenEntry: Entry | null;
  candidates: Array<Fio2Candidate & { pfRatio: number }>;
}

/** Severinghaus型の標準酸素解離曲線を逆算してPaO2を求める。 */
export function estimatePao2FromSpo2(spo2: number): number {
  const target = spo2 / 100;
  let low = 0;
  let high = 1_000;
  for (let i = 0; i < 80; i++) {
    const middle = (low + high) / 2;
    const numerator = middle ** 3 + 150 * middle;
    const saturation = numerator / (numerator + 23_400);
    if (saturation < target) low = middle;
    else high = middle;
  }
  return Math.round(((low + high) / 2) * 10) / 10;
}

function interpolate(
  flow: number,
  minFlow: number,
  maxFlow: number,
  minFio2: number,
  maxFio2: number,
): number {
  const fio2 =
    minFio2 + ((flow - minFlow) / (maxFlow - minFlow)) * (maxFio2 - minFio2);
  return Math.round(fio2 * 10) / 10;
}

export function getFio2Candidates(
  entry: Entry,
  fio2Mode: boolean,
): Fio2Candidate[] {
  if (fio2Mode) {
    return [{ device: "入力されたFiO2", fio2: entry.fio2, estimated: false }];
  }
  if (entry.flow === 0) {
    return [{ device: "室内気", fio2: 21, estimated: false }];
  }

  const candidates: Fio2Candidate[] = [];
  if (entry.flow >= 1 && entry.flow <= 6) {
    candidates.push({
      device: "鼻カヌラ",
      fio2: interpolate(entry.flow, 1, 6, 24, 44),
      estimated: true,
    });
  }
  if (entry.flow >= 5 && entry.flow <= 10) {
    candidates.push({
      device: "酸素マスク",
      fio2: interpolate(entry.flow, 5, 10, 40, 60),
      estimated: true,
    });
  }
  if (entry.flow >= 6 && entry.flow <= 10) {
    candidates.push({
      device: "リザーバー付き酸素マスク",
      fio2: interpolate(entry.flow, 6, 10, 60, 95),
      estimated: true,
    });
  }
  return candidates;
}

export function findOxygenEntryAt(
  entries: Entry[],
  measurement: OxygenMeasurement,
): Entry | null {
  const targetMinute = toBillingMinutes(measurement.dateTime);
  let foundIndex = -1;
  for (let i = 0; i < entries.length; i++) {
    if (toBillingMinutes(entries[i].dateTime) <= targetMinute) foundIndex = i;
    else break;
  }
  if (foundIndex < 0) return null;

  const found = entries[foundIndex];
  const isLast = foundIndex === entries.length - 1;
  if (isLast && found.dateTime.day !== measurement.dateTime.day) return null;
  return found;
}

export function calculatePfRatio(
  measurement: OxygenMeasurement,
  entries: Entry[],
  fio2Mode: boolean,
): PfRatioResult {
  const oxygenEntry = findOxygenEntryAt(entries, measurement);
  const pao2 =
    measurement.kind === "pao2"
      ? measurement.value
      : estimatePao2FromSpo2(measurement.value);
  const candidates = oxygenEntry
    ? getFio2Candidates(oxygenEntry, fio2Mode).map((candidate) => ({
        ...candidate,
        pfRatio: Math.round(pao2 / (candidate.fio2 / 100)),
      }))
    : [];
  return {
    measurement,
    pao2,
    pao2Estimated: measurement.kind === "spo2",
    oxygenEntry,
    candidates,
  };
}

export function upsertMeasurement(
  measurements: OxygenMeasurement[],
  measurement: OxygenMeasurement,
): OxygenMeasurement[] {
  return measurements
    .filter(
      (current) =>
        !isSameBillingDateTime(current.dateTime, measurement.dateTime),
    )
    .concat(measurement)
    .sort((left, right) =>
      compareBillingDateTime(left.dateTime, right.dateTime),
    );
}
