/**
 * 入力データの型定義
 */
export interface Entry {
  dateTime: BillingDateTime; // レセプト月内の論理日時
  flow: number; // 流量 (L/min)
  fio2: number; // FiO2 (%) - FiO2 モード有効時のみ意味を持つ (デフォルトは 21)
  mode: CalculationMode; // この入力から次の入力まで適用する計算条件
  editing?: boolean; // 編集中フラグ (in-place 編集用、デフォルトは false)
}

export type CalculationMode = "standard" | "fio2-room-air" | "fio2-no-room-air";

export const CALCULATION_MODES: CalculationMode[] = [
  "standard",
  "fio2-room-air",
  "fio2-no-room-air",
];

export function calculationModeLabel(mode: CalculationMode): string {
  if (mode === "standard") return "酸素流量方式";
  if (mode === "fio2-room-air") return "酸素濃度方式・室内空気";
  return "酸素濃度方式・合成空気";
}

export function isFio2CalculationMode(mode: CalculationMode): boolean {
  return mode !== "standard";
}

export interface BillingDateTime {
  day: number;
  hour: number;
  minute: number;
}
