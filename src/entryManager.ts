import type { Entry } from './types.ts';
import { parseDateTime, formatDate, formatDateForInput } from './utils.ts';
import { calculateUsage } from './calculator.ts';

/**
 * Manages entries for the gas calculator
 */
export class EntryManager {
  private entries: Entry[] = [];
  private lastDate: Date = new Date();

  /**
   * Get all entries
   * @returns Array of entries
   */
  getEntries(): Entry[] {
    return this.entries;
  }

  /**
   * Add a new entry
   * @param dateTimeStr - Date time string in DDHHMM format
   * @param flowStr - Flow rate string
   * @param fio2Str - FiO2 string (optional)
   * @param fio2Mode - Whether FiO2 mode is enabled
   * @returns Object with success status and error message if any
   */
  addEntry(dateTimeStr: string, flowStr: string, fio2Str: string, fio2Mode: boolean): { success: boolean; error?: string } {
    if (!dateTimeStr || !flowStr) {
      return { success: false, error: '日付時刻と流量を入力してください。' };
    }

    const parsedDateTime = parseDateTime(dateTimeStr, this.lastDate);
    if (!parsedDateTime) {
      return { success: false, error: '無効な日付時刻です。' };
    }

    // Update lastDate reference
    this.lastDate = parsedDateTime;

    const flow = parseFloat(flowStr);
    if (isNaN(flow) || flow < 0) {
      return { success: false, error: '無効な流量です。' };
    }

    let fio2 = 21; // Default FiO2 (room air)
    if (fio2Mode) {
      fio2 = parseInt(fio2Str);
      if (isNaN(fio2) || fio2 < 21 || fio2 > 100) {
        return { success: false, error: '無効なFiO2です。21以上100以下の整数を入力してください。' };
      }
    }

    this.entries.push({
      dateTime: parsedDateTime,
      flow,
      fio2
    });

    // Sort entries by datetime
    this.entries.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    return { success: true };
  }

  /**
   * Delete an entry
   * @param index - Index of entry to delete
   */
  deleteEntry(index: number): void {
    if (index >= 0 && index < this.entries.length) {
      this.entries.splice(index, 1);
    }
  }

  /**
   * Get entry at specified index
   * @param index - Index of entry to retrieve
   * @returns Entry object or null if not found
   */
  getEntry(index: number): Entry | null {
    if (index >= 0 && index < this.entries.length) {
      return this.entries[index];
    }
    return null;
  }

  /**
   * Clear all entries
   */
  clearEntries(): void {
    this.entries = [];
    this.lastDate = new Date();
  }

  /**
   * Calculate gas usage from current entries
   * @param fio2Mode - Whether FiO2 mode is enabled
   * @param noRoomAirMode - Whether no room air mode is enabled
   * @returns Usage object with calculated gas usage
   */
  calculateUsage(fio2Mode: boolean, noRoomAirMode: boolean) {
    return calculateUsage(this.entries, fio2Mode, noRoomAirMode);
  }

  /**
   * Get the last date used (for reference when parsing new dates)
   * @returns Last date used
   */
  getLastDate(): Date {
    return this.lastDate;
  }
}