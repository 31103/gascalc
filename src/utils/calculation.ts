import type { Entry } from "../types/entry.ts";

/**
 * 日ごとのガス使用量を表す型
 */
export interface DailyUsage {
  oxygen: number;
  nitrogen: number;
}

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
    const entry = entries[i];
    const nextEntry = entries[i + 1];
    const entryDate = entry.dateTime.getDate();

    // 次のエントリがない場合、その日の終わり (翌日の0時) までを計算期間とする
    let endTime: Date;
    if (nextEntry) {
      endTime = nextEntry.dateTime;
    } else {
      // 同じ年の同じ月の翌日の0時を取得
      endTime = new Date(entry.dateTime.getFullYear(), entry.dateTime.getMonth(), entryDate + 1, 0, 0, 0, 0);
    }

    let remainingTimeMs = endTime.getTime() - entry.dateTime.getTime();
    let currentDateTime = new Date(entry.dateTime);

    while (remainingTimeMs > 0) {
      const currentDate = currentDateTime.getDate();
      // 現在の日付の終わり (翌日の0時) を計算
      const endOfDay = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDate + 1, 0, 0, 0, 0);
      const timeUntilEndOfDayMs = endOfDay.getTime() - currentDateTime.getTime();

      // 計算する時間 (ミリ秒) を決定 (残りの時間と、日の終わりまでの時間の短い方)
      const timeToCalculateMs = Math.min(remainingTimeMs, timeUntilEndOfDayMs);
      const timeToCalculateMin = timeToCalculateMs / (1000 * 60); // 分に変換

      let oxygenAmount = 0;
      let nitrogenAmount = 0;

      if (fio2Mode) {
        if (noRoomAirMode) {
          // 室内気不使用モード
          oxygenAmount = (entry.fio2 * 0.01 * entry.flow) * timeToCalculateMin;
          nitrogenAmount = ((100 - entry.fio2) * 0.01 * entry.flow) * timeToCalculateMin;
        } else {
          // FiO2モード (室内気使用)
          // FiO2が21%の場合は酸素追加なしと見なす
          if (entry.fio2 > 21) {
             oxygenAmount = ((entry.fio2 - 21) * 0.01 / 0.79 * entry.flow) * timeToCalculateMin;
          }
          // 室内気使用時は窒素は計算しない
        }
      } else {
        // 定量酸素モード
        oxygenAmount = entry.flow * timeToCalculateMin;
        // 定量酸素モード時は窒素は計算しない
      }

      if (!usage[currentDate]) {
        usage[currentDate] = { oxygen: 0, nitrogen: 0 };
      }
      usage[currentDate].oxygen += oxygenAmount;
      usage[currentDate].nitrogen += nitrogenAmount;

      // 時間を進める
      currentDateTime = new Date(currentDateTime.getTime() + timeToCalculateMs);
      remainingTimeMs -= timeToCalculateMs;
    }
  }

  // 結果を小数点以下1桁に丸める
  Object.keys(usage).forEach((dateKey) => {
    const dateNum = parseInt(dateKey, 10); // オブジェクトのキーは文字列になるため数値に戻す
    usage[dateNum].oxygen = Math.round(usage[dateNum].oxygen * 10) / 10;
    usage[dateNum].nitrogen = Math.round(usage[dateNum].nitrogen * 10) / 10;
  });

  return usage;
}