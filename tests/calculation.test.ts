import { describe, it, expect } from "vitest";
import { calculateUsage, formatDate, formatDateForInput } from "../src/utils/calculation.ts";
import type { Entry } from "../src/types/entry.ts";

// Helper to create Date objects easily for tests (assumes same year/month for simplicity)
const createDate = (day: number, hour: number, minute: number): Date => {
  return new Date(2024, 0, day, hour, minute);
};

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date(2024, 4, 5, 9, 7, 0);
    expect(formatDate(date)).toBe("5日09時07分");
  });

  it("pads hours and minutes", () => {
    const date = new Date(2024, 11, 12, 3, 5, 0);
    expect(formatDate(date)).toBe("12日03時05分");
  });
});

describe("formatDateForInput", () => {
  it("formats date correctly", () => {
    const date = new Date(2024, 4, 5, 9, 7, 0);
    expect(formatDateForInput(date)).toBe("50907");
  });

  it("pads hours and minutes", () => {
    const date = new Date(2024, 11, 12, 3, 5, 0);
    expect(formatDateForInput(date)).toBe("120305");
  });
});

describe("calculateUsage", () => {
  it("single entry, standard mode", () => {
    const entries: Entry[] = [
      { dateTime: createDate(1, 10, 0), flow: 2, fio2: 21 },
    ];
    const usage = calculateUsage(entries, false, false);
    // 1日10:00から翌日0:00までの14時間 = 840分 → 2L/min * 840 = 1680L
    expect(usage[1]).toEqual({ oxygen: 1680, nitrogen: 0 });
  });

  it("two entries on same day, standard mode", () => {
    const entries: Entry[] = [
      { dateTime: createDate(1, 10, 0), flow: 2, fio2: 21 },
      { dateTime: createDate(1, 12, 0), flow: 3, fio2: 21 },
    ];
    const usage = calculateUsage(entries, false, false);
    // 10:00-12:00 (120 min) * 2L = 240L
    // 12:00-24:00 (720 min) * 3L = 2160L
    // Total = 2400L
    expect(usage[1]).toEqual({ oxygen: 2400, nitrogen: 0 });
  });

  it("entries across midnight, standard mode", () => {
    const entries: Entry[] = [
      { dateTime: createDate(1, 22, 0), flow: 5, fio2: 21 },
      { dateTime: createDate(2, 8, 0), flow: 1, fio2: 21 },
    ];
    const usage = calculateUsage(entries, false, false);
    // 1日: 22:00-24:00 (120 min) * 5L = 600L
    expect(usage[1]).toEqual({ oxygen: 600, nitrogen: 0 });
    // 2日: 00:00-08:00 (480 min) * 5L = 2400L + 08:00-24:00 (960 min) * 1L = 960L
    expect(usage[2]).toEqual({ oxygen: 3360, nitrogen: 0 });
  });

  it("FiO2 mode, room air", () => {
    const entries: Entry[] = [
      { dateTime: createDate(3, 9, 0), flow: 10, fio2: 40 },
    ];
    const usage = calculateUsage(entries, true, false);
    // 9:00-24:00 (900 min)
    // O2 = ((40-21) * 0.01 / 0.79 * 10) * 900 ≈ 2164.6
    expect(usage[3]?.oxygen).toBe(2164.6);
    expect(usage[3]?.nitrogen).toBe(0);
  });

  it("FiO2 mode, no room air", () => {
    const entries: Entry[] = [
      { dateTime: createDate(4, 14, 0), flow: 15, fio2: 60 },
    ];
    const usage = calculateUsage(entries, true, true);
    // 14:00-24:00 (600 min)
    // O2 = (60 * 0.01 * 15) * 600 = 5400
    // N2 = (40 * 0.01 * 15) * 600 = 3600
    expect(usage[4]).toEqual({ oxygen: 5400, nitrogen: 3600 });
  });

  it("FiO2 mode, FiO2 changes", () => {
    const entries: Entry[] = [
      { dateTime: createDate(5, 8, 0), flow: 10, fio2: 40 },
      { dateTime: createDate(5, 12, 0), flow: 10, fio2: 50 },
    ];
    const usage = calculateUsage(entries, true, false);
    // O2_1 ≈ 2.405 * 240 ≈ 577.2
    // O2_2 ≈ 3.671 * 720 ≈ 2643.1
    // Total ≈ 3220.3
    expect(usage[5]?.oxygen).toBe(3220.3);
    expect(usage[5]?.nitrogen).toBe(0);
  });

  it("FiO2 mode, no room air, FiO2 changes", () => {
    const entries: Entry[] = [
      { dateTime: createDate(6, 9, 0), flow: 20, fio2: 50 },
      { dateTime: createDate(6, 15, 0), flow: 20, fio2: 70 },
    ];
    const usage = calculateUsage(entries, true, true);
    // O2 = 3600 + 7560 = 11160
    // N2 = 3600 + 3240 = 6840
    expect(usage[6]).toEqual({ oxygen: 11160, nitrogen: 6840 });
  });

  it("empty entries", () => {
    const entries: Entry[] = [];
    const usage = calculateUsage(entries, false, false);
    expect(usage).toEqual({});
  });

  it("FiO2 mode, FiO2 21%", () => {
    const entries: Entry[] = [
      { dateTime: createDate(7, 10, 0), flow: 5, fio2: 21 },
    ];
    const usage = calculateUsage(entries, true, false);
    expect(usage[7]).toEqual({ oxygen: 0, nitrogen: 0 });
  });
});
