import type { CalculationMode, Entry } from "../types/entry.ts";
import { endOfBillingDayMinutes, toBillingMinutes } from "./billingDateTime.ts";

/**
 * 日ごとのガス使用量を表す型
 */
export interface DailyUsage {
  oxygen: number;
  nitrogen: number;
}

export type UsageByMode = Partial<Record<CalculationMode, DailyUsage>>;
export type UsageByDayAndMode = Record<number, UsageByMode>;

// --- 定数 ---
const PERCENT_TO_DECIMAL = 0.01;
const NON_OXYGEN_GAS_RATIO_IN_AIR = 0.79; // 空気中の窒素+アルゴンの割合 (FiO2計算用)
const DEFAULT_FIO2_IN_AIR = 21; // 空気中の酸素濃度(%)

/**
 * 特定の期間と設定に基づいてガス使用量を計算する
 * @param entry 計算対象のエントリ
 * @param durationMin 計算期間 (分)
 * @returns 酸素と窒素の使用量
 */
function calculateGasAmountsForPeriod(
  entry: Entry,
  durationMin: number,
): { oxygen: number; nitrogen: number } {
  let oxygenAmount = 0;
  let nitrogenAmount = 0;

  if (entry.mode !== "standard") {
    if (entry.mode === "fio2-no-room-air") {
      // 室内気不使用モード
      oxygenAmount = entry.fio2 * PERCENT_TO_DECIMAL * entry.flow * durationMin;
      nitrogenAmount =
        (100 - entry.fio2) * PERCENT_TO_DECIMAL * entry.flow * durationMin;
    } else {
      // FiO2モード (室内気使用)
      // FiO2が空気中の酸素濃度(21%)を超える場合のみ追加酸素を計算
      if (entry.fio2 > DEFAULT_FIO2_IN_AIR) {
        oxygenAmount =
          (((entry.fio2 - DEFAULT_FIO2_IN_AIR) * PERCENT_TO_DECIMAL) /
            NON_OXYGEN_GAS_RATIO_IN_AIR) *
          entry.flow *
          durationMin;
      }
      // 室内気使用時は窒素は計算しない (消費されるのは追加酸素のみ)
    }
  } else {
    // 定量酸素モード
    oxygenAmount = entry.flow * durationMin;
    // 定量酸素モード時は窒素は計算しない
  }
  return { oxygen: oxygenAmount, nitrogen: nitrogenAmount };
}

/**
 * 計算されたガス使用量を指定された日付の記録に追加する
 * @param dailyRecord 日ごとの使用量記録
 * @param date 日付 (日)
 * @param oxygen 酸素使用量
 * @param nitrogen 窒素使用量
 */
function addUsageToDailyRecord(
  dailyRecord: UsageByDayAndMode,
  date: number,
  mode: CalculationMode,
  oxygen: number,
  nitrogen: number,
): void {
  dailyRecord[date] ??= {};
  dailyRecord[date][mode] ??= { oxygen: 0, nitrogen: 0 };
  dailyRecord[date][mode].oxygen += oxygen;
  dailyRecord[date][mode].nitrogen += nitrogen;
}

/**
 * 入力されたエントリに基づいて日ごとのガス使用量を計算する
 * @param entries 入力エントリの配列 (日付時刻順にソート済み)
 * @returns 日付と計算モードごとの使用量
 */
export function calculateUsage(entries: Entry[]): UsageByDayAndMode {
  const usage: UsageByDayAndMode = {};

  if (entries.length === 0) {
    return usage;
  }

  for (let i = 0; i < entries.length; i++) {
    const currentEntry = entries[i];
    const nextEntry = entries[i + 1];

    // 計算期間の終了時刻を決定
    // 次のエントリがない場合は、その日の終わり (翌日の0時) まで
    let periodEndMinute: number;
    if (nextEntry) {
      periodEndMinute = toBillingMinutes(nextEntry.dateTime);
    } else {
      periodEndMinute = endOfBillingDayMinutes(currentEntry.dateTime.day);
    }

    let currentMinute = toBillingMinutes(currentEntry.dateTime);

    // 現在のエントリ区間を日ごとに区切って計算
    while (currentMinute < periodEndMinute) {
      const loopCurrentDate = Math.floor(currentMinute / (24 * 60)) + 1;
      const timeToCalculateMin =
        Math.min(periodEndMinute, endOfBillingDayMinutes(loopCurrentDate)) -
        currentMinute;

      if (timeToCalculateMin <= 0) {
        // 計算時間が0以下の場合はスキップ
        break;
      }

      const gasAmounts = calculateGasAmountsForPeriod(
        currentEntry,
        timeToCalculateMin,
      );

      addUsageToDailyRecord(
        usage,
        loopCurrentDate,
        currentEntry.mode,
        gasAmounts.oxygen,
        gasAmounts.nitrogen,
      );

      // 次の計算のために時間を進める
      currentMinute += timeToCalculateMin;
    }
  }

  // 結果を小数点以下1桁に丸める
  Object.keys(usage).forEach((dateKey) => {
    const dateNum = parseInt(dateKey, 10);
    for (const amounts of Object.values(usage[dateNum])) {
      if (!amounts) continue;
      amounts.oxygen = Math.round(amounts.oxygen * 10) / 10;
      amounts.nitrogen = Math.round(amounts.nitrogen * 10) / 10;
    }
  });

  return usage;
}
