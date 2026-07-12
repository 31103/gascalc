import type { BillingDateTime } from "./entry.ts";

export type OxygenMeasurementKind = "pao2" | "spo2";

export interface OxygenMeasurement {
  dateTime: BillingDateTime;
  kind: OxygenMeasurementKind;
  value: number;
}

export interface Fio2Candidate {
  device: string;
  fio2: number;
  estimated: boolean;
}
