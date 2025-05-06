import type { Entry, Usage } from './types.ts';

/**
 * Calculate gas usage from entries
 * @param entries - List of gas flow entries
 * @param fio2Mode - Whether to use FiO2 mode
 * @param noRoomAirMode - Whether to use no room air mode
 * @returns Usage object with calculated gas usage by date
 */
export function calculateUsage(entries: Entry[], fio2Mode: boolean, noRoomAirMode: boolean): Usage {
  const usage: Usage = {};
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const nextEntry = entries[i + 1];
    const currentDate = entry.dateTime.getDate();
    
    // Determine end time for this entry (next entry or end of day)
    let endTime: Date;
    if (nextEntry) {
      endTime = nextEntry.dateTime;
    } else {
      endTime = new Date(
        entry.dateTime.getFullYear(),
        entry.dateTime.getMonth(),
        currentDate + 1
      );
    }
    
    let remainingTime = endTime.getTime() - entry.dateTime.getTime();
    let currentDateTime = new Date(entry.dateTime);
    
    // Process time in chunks, splitting at day boundaries
    while (remainingTime > 0) {
      const currentDate = currentDateTime.getDate();
      const endOfDay = new Date(
        currentDateTime.getFullYear(),
        currentDateTime.getMonth(),
        currentDate + 1
      );
      const timeUntilEndOfDay = endOfDay.getTime() - currentDateTime.getTime();
      const timeToCalculate = Math.min(remainingTime, timeUntilEndOfDay);

      let oxygenAmount: number, nitrogenAmount: number;
      
      if (fio2Mode) {
        if (noRoomAirMode) {
          // 室内気不使用モードでの計算
          nitrogenAmount = ((100 - entry.fio2) * 0.01 * entry.flow) * (timeToCalculate / (1000 * 60));
          oxygenAmount = (entry.fio2 * 0.01 * entry.flow) * (timeToCalculate / (1000 * 60));
        } else {
          // FiO2モードでの酸素使用量計算
          oxygenAmount = ((entry.fio2 - 21) * 0.01 / 0.79 * entry.flow) * (timeToCalculate / (1000 * 60));
          nitrogenAmount = 0; // 室内気使用時は窒素は計算しない
        }
      } else {
        // 定量酸素モードでの計算
        oxygenAmount = (timeToCalculate / (1000 * 60)) * entry.flow;
        nitrogenAmount = 0; // 室内気使用時は窒素は計算しない
      }

      // Add to usage totals
      if (!usage[currentDate]) {
        usage[currentDate] = { oxygen: 0, nitrogen: 0 };
      }
      usage[currentDate].oxygen += oxygenAmount;
      usage[currentDate].nitrogen += nitrogenAmount;

      // Move to next time chunk
      currentDateTime = new Date(currentDateTime.getTime() + timeToCalculate);
      remainingTime -= timeToCalculate;
    }
  }

  // Round to one decimal place
  Object.keys(usage).forEach(date => {
    const dateKey = date as unknown as keyof Usage;
    usage[dateKey].oxygen = Math.round(usage[dateKey].oxygen * 10) / 10;
    usage[dateKey].nitrogen = Math.round(usage[dateKey].nitrogen * 10) / 10;
  });

  return usage;
}

/**
 * Generate text for clipboard in the required format
 * @param oxygenUsage - Oxygen usage amount
 * @param nitrogenUsage - Nitrogen usage amount
 * @param noRoomAirMode - Whether no room air mode is enabled
 * @returns Text for clipboard
 */
export function generateUsageText(oxygenUsage: number, nitrogenUsage: number, noRoomAirMode: boolean): string {
  let text = `402400+552010/${oxygenUsage}*1`;
  if (noRoomAirMode) {
    text += `\n402400+552010/${nitrogenUsage}*1`;
  }
  return text;
}