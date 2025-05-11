import type { Entry } from "../types/entry.ts";

/**
 * 日ごとのガス使用量を表す型
 */
export interface DailyUsage {
  oxygen: number;
  nitrogen: number;
}

// --- 定数 ---
const MS_PER_MINUTE = 1000 * 60;
const PERCENT_TO_DECIMAL = 0.01;
const NON_OXYGEN_GAS_RATIO_IN_AIR = 0.79; // 空気中の窒素+アルゴンの割合 (FiO2計算用)
const DEFAULT_FIO2_IN_AIR = 21; // 空気中の酸素濃度(%)

/**
 * 日付をフォーマットする (例: "5日09時07分")
 * @param date フォーマットする Date オブジェクト
 * @returns フォーマットされた文字列
 */
export function formatDate(date: Date): string {
  return `${date.getDate()}日${date.getHours().toString().padStart(2, '0')}時${date.getMinutes().toString().padStart(2, '0')}分`;
}

/**
 * 入力フィールド用に日付をフォーマットする (例: "50907")
 * @param date フォーマットする Date オブジェクト
 * @returns フォーマットされた文字列
 */
export function formatDateForInput(date: Date): string {
  return `${date.getDate()}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 特定の期間と設定に基づいてガス使用量を計算する
 * @param entry 計算対象のエントリ
 * @param durationMin 計算期間 (分)
 * @param fio2Mode FiO2モードが有効か
 * @param noRoomAirMode 室内気不使用モードが有効か
 * @returns 酸素と窒素の使用量
 */
function calculateGasAmountsForPeriod(
  entry: Entry,
  durationMin: number,
  fio2Mode: boolean,
  noRoomAirMode: boolean,
): { oxygen: number; nitrogen: number } {
  let oxygenAmount = 0;
  let nitrogenAmount = 0;

  if (!fio2Mode) {
    // 定量酸素モード
    oxygenAmount = entry.flow * durationMin;
    // 定量酸素モード時は窒素は計算しない
    return { oxygen: oxygenAmount, nitrogen: nitrogenAmount };
  }

  // FiO2モードの場合
  if (noRoomAirMode) {
    // 室内気不使用モード
    oxygenAmount = (entry.fio2 * PERCENT_TO_DECIMAL * entry.flow) * durationMin;
    nitrogenAmount = ((100 - entry.fio2) * PERCENT_TO_DECIMAL * entry.flow) * durationMin;
  } else {
    // FiO2モード (室内気使用)
    // FiO2が空気中の酸素濃度(21%)を超える場合のみ追加酸素を計算
    if (entry.fio2 > DEFAULT_FIO2_IN_AIR) {
      oxygenAmount = ((entry.fio2 - DEFAULT_FIO2_IN_AIR) * PERCENT_TO_DECIMAL / NON_OXYGEN_GAS_RATIO_IN_AIR * entry.flow) * durationMin;
    }
    // 室内気使用時は窒素は計算しない (消費されるのは追加酸素のみ)
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
  dailyRecord: Record<number, DailyUsage>,
  date: number,
  oxygen: number,
  nitrogen: number,
): void {
  if (!dailyRecord[date]) {
    dailyRecord[date] = { oxygen: 0, nitrogen: 0 };
  }
  dailyRecord[date].oxygen += oxygen;
  dailyRecord[date].nitrogen += nitrogen;
}

/**
 * 入力されたエントリに基づいて日ごとのガス使用量を計算する
 * @param entries 入力エントリの配列 (日付時刻順にソート済み)
 * @param fio2Mode FiO2モードが有効か
 * @param noRoomAirMode 室内気不使用モードが有効か
 * @returns 日付をキー、使用量 (酸素・窒素) を値とするオブジェクト
 */
export function calculateUsage(
  entries: Entry[],
  fio2Mode: boolean,
  noRoomAirMode: boolean,
): Record<number, DailyUsage> {
  const usage: Record<number, DailyUsage> = {};

  if (entries.length === 0) {
    return usage;
  }

  for (let i = 0; i < entries.length; i++) {
    const currentEntry = entries[i];
    const nextEntry = entries[i + 1];

    // 計算期間の終了時刻を決定
    // 次のエントリがない場合は、その日の終わり (翌日の0時) まで
    let periodEndTime: Date;
    if (nextEntry) {
      periodEndTime = nextEntry.dateTime;
    } else {
      periodEndTime = new Date(
        currentEntry.dateTime.getFullYear(),
        currentEntry.dateTime.getMonth(),
        currentEntry.dateTime.getDate() + 1, // 翌日
        0, 0, 0, 0, // 0時0分0秒
      );
    }

    let remainingTimeInPeriodMs = periodEndTime.getTime() - currentEntry.dateTime.getTime();
    let loopCurrentDateTime = new Date(currentEntry.dateTime);

    // 現在のエントリ区間を日ごとに区切って計算
    while (remainingTimeInPeriodMs > 0) {
      const loopCurrentDate = loopCurrentDateTime.getDate();

      // 現在の日付の終わり (翌日の0時) を計算
      const endOfDay = new Date(
        loopCurrentDateTime.getFullYear(),
        loopCurrentDateTime.getMonth(),
        loopCurrentDate + 1, // 翌日
        0, 0, 0, 0, // 0時0分0秒
      );

      // このループで計算するべき時間 (ミリ秒)
      // (区間の残り時間 と 日の終わりまでの時間 の短い方)
      const timeToCalculateMs = Math.min(remainingTimeInPeriodMs, endOfDay.getTime() - loopCurrentDateTime.getTime());
      const timeToCalculateMin = timeToCalculateMs / MS_PER_MINUTE;

      if (timeToCalculateMin <= 0) { // 計算時間が0以下の場合はスキップ
        break;
      }

      const gasAmounts = calculateGasAmountsForPeriod(
        currentEntry,
        timeToCalculateMin,
        fio2Mode,
        noRoomAirMode,
      );

      addUsageToDailyRecord(
        usage,
        loopCurrentDate,
        gasAmounts.oxygen,
        gasAmounts.nitrogen,
      );

      // 次の計算のために時間を進める
      loopCurrentDateTime = new Date(loopCurrentDateTime.getTime() + timeToCalculateMs);
      remainingTimeInPeriodMs -= timeToCalculateMs;
    }
  }

  // 結果を小数点以下1桁に丸める
  Object.keys(usage).forEach((dateKey) => {
    const dateNum = parseInt(dateKey, 10);
    if (!isNaN(dateNum) && Object.prototype.hasOwnProperty.call(usage, dateNum)) {
      usage[dateNum].oxygen = Math.round(usage[dateNum].oxygen * 10) / 10;
      usage[dateNum].nitrogen = Math.round(usage[dateNum].nitrogen * 10) / 10;
    }
  });

  return usage;
}
