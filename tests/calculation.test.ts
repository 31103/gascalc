import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculateUsage, formatDate, formatDateForInput } from "../src/utils/calculation.ts";
import type { Entry } from "../src/types/entry.ts";

// --- Test formatDate ---
Deno.test("formatDate formats date correctly", () => {
  const date = new Date(2024, 4, 5, 9, 7, 0); // 2024年5月5日 09:07:00 (月は0-indexed)
  assertEquals(formatDate(date), "5日09時07分");
});

Deno.test("formatDate pads hours and minutes", () => {
  const date = new Date(2024, 11, 12, 3, 5, 0); // 2024年12月12日 03:05:00
  assertEquals(formatDate(date), "12日03時05分");
});

// --- Test formatDateForInput ---
Deno.test("formatDateForInput formats date correctly", () => {
    const date = new Date(2024, 4, 5, 9, 7, 0);
    assertEquals(formatDateForInput(date), "50907");
});

Deno.test("formatDateForInput pads hours and minutes", () => {
    const date = new Date(2024, 11, 12, 3, 5, 0);
    assertEquals(formatDateForInput(date), "120305");
});


// --- Test calculateUsage ---

// Helper to create Date objects easily for tests (assumes same year/month for simplicity)
const createDate = (day: number, hour: number, minute: number): Date => {
    // Use a fixed year and month for consistency in tests
    return new Date(2024, 0, day, hour, minute);
};

Deno.test("calculateUsage - single entry, standard mode", () => {
  const entries: Entry[] = [
    { dateTime: createDate(1, 10, 0), flow: 2, fio2: 21 }, // 1日10:00から2L
  ];
  const usage = calculateUsage(entries, false, false);
  // 1日10:00から翌日0:00までの14時間 = 840分
  // 2L/min * 840 min = 1680L
  assertEquals(usage[1], { oxygen: 1680, nitrogen: 0 });
});

Deno.test("calculateUsage - two entries on same day, standard mode", () => {
  const entries: Entry[] = [
    { dateTime: createDate(1, 10, 0), flow: 2, fio2: 21 }, // 1日10:00から2L
    { dateTime: createDate(1, 12, 0), flow: 3, fio2: 21 }, // 1日12:00から3L
  ];
  const usage = calculateUsage(entries, false, false);
  // 10:00-12:00 (120 min) * 2L/min = 240L
  // 12:00-24:00 (720 min) * 3L/min = 2160L
  // Total = 240 + 2160 = 2400L
  assertEquals(usage[1], { oxygen: 2400, nitrogen: 0 });
});

Deno.test("calculateUsage - entries across midnight, standard mode", () => {
  const entries: Entry[] = [
    { dateTime: createDate(1, 22, 0), flow: 5, fio2: 21 }, // 1日22:00から5L
    { dateTime: createDate(2, 8, 0), flow: 1, fio2: 21 },  // 2日08:00から1L
  ];
  const usage = calculateUsage(entries, false, false);
  // 1日: 22:00-24:00 (120 min) * 5L/min = 600L
  assertEquals(usage[1], { oxygen: 600, nitrogen: 0 });
  // 2日: 00:00-08:00 (480 min) * 5L/min = 2400L
  // 2日: 08:00-24:00 (960 min) * 1L/min = 960L
  // Total 2日 = 2400 + 960 = 3360L
  assertEquals(usage[2], { oxygen: 3360, nitrogen: 0 });
});

Deno.test("calculateUsage - FiO2 mode, room air", () => {
  const entries: Entry[] = [
    { dateTime: createDate(3, 9, 0), flow: 10, fio2: 40 }, // 3日9:00から Flow:10L, FiO2:40%
  ];
  const usage = calculateUsage(entries, true, false);
  // 9:00-24:00 (900 min)
  // Oxygen = ((40 - 21) * 0.01 / 0.79 * 10) * 900
  // Oxygen = (19 * 0.01 / 0.79 * 10) * 900
  // Oxygen = (0.19 / 0.79 * 10) * 900
  // Oxygen ≈ 2.405 * 900 ≈ 2164.55... -> rounded to 2164.6
  assertEquals(usage[3]?.oxygen, 2164.6);
  assertEquals(usage[3]?.nitrogen, 0); // Room air mode, nitrogen is 0
});

Deno.test("calculateUsage - FiO2 mode, no room air", () => {
  const entries: Entry[] = [
    { dateTime: createDate(4, 14, 0), flow: 15, fio2: 60 }, // 4日14:00から Flow:15L, FiO2:60%
  ];
  const usage = calculateUsage(entries, true, true);
  // 14:00-24:00 (600 min)
  // Oxygen = (60 * 0.01 * 15) * 600 = (0.6 * 15) * 600 = 9 * 600 = 5400L
  // Nitrogen = ((100 - 60) * 0.01 * 15) * 600 = (40 * 0.01 * 15) * 600 = (0.4 * 15) * 600 = 6 * 600 = 3600L
  assertEquals(usage[4], { oxygen: 5400, nitrogen: 3600 });
});


Deno.test("calculateUsage - FiO2 mode, FiO2 changes", () => {
  const entries: Entry[] = [
    { dateTime: createDate(5, 8, 0), flow: 10, fio2: 40 }, // 8:00-12:00
    { dateTime: createDate(5, 12, 0), flow: 10, fio2: 50 }, // 12:00-24:00
  ];
  const usage = calculateUsage(entries, true, false); // Room air
  // 8:00-12:00 (240 min), FiO2 40%
  // O2_1 = ((40 - 21) * 0.01 / 0.79 * 10) * 240 ≈ 2.405 * 240 ≈ 577.2
  // 12:00-24:00 (720 min), FiO2 50%
  // O2_2 = ((50 - 21) * 0.01 / 0.79 * 10) * 720 ≈ 3.671 * 720 ≈ 2643.1
  // Total O2 = 577.2 + 2643.1 = 3220.3
  assertEquals(usage[5]?.oxygen, 3220.3);
  assertEquals(usage[5]?.nitrogen, 0);
});

Deno.test("calculateUsage - FiO2 mode, no room air, FiO2 changes", () => {
  const entries: Entry[] = [
    { dateTime: createDate(6, 9, 0), flow: 20, fio2: 50 }, // 9:00-15:00
    { dateTime: createDate(6, 15, 0), flow: 20, fio2: 70 }, // 15:00-24:00
  ];
  const usage = calculateUsage(entries, true, true); // No room air
  // 9:00-15:00 (360 min), FiO2 50%
  // O2_1 = (50 * 0.01 * 20) * 360 = 10 * 360 = 3600
  // N2_1 = ((100 - 50) * 0.01 * 20) * 360 = 10 * 360 = 3600
  // 15:00-24:00 (540 min), FiO2 70%
  // O2_2 = (70 * 0.01 * 20) * 540 = 14 * 540 = 7560
  // N2_2 = ((100 - 70) * 0.01 * 20) * 540 = 6 * 540 = 3240
  // Total O2 = 3600 + 7560 = 11160
  // Total N2 = 3600 + 3240 = 6840
  assertEquals(usage[6], { oxygen: 11160, nitrogen: 6840 });
});

Deno.test("calculateUsage - empty entries", () => {
  const entries: Entry[] = [];
  const usage = calculateUsage(entries, false, false);
  assertEquals(usage, {});
});

Deno.test("calculateUsage - FiO2 mode, FiO2 21%", () => {
  const entries: Entry[] = [
    { dateTime: createDate(7, 10, 0), flow: 5, fio2: 21 }, // FiO2 21% should result in 0 oxygen usage in FiO2 mode (room air)
  ];
  const usage = calculateUsage(entries, true, false);
  // 10:00-24:00 (840 min)
  // Oxygen = ((21 - 21) * 0.01 / 0.79 * 5) * 840 = 0
  assertEquals(usage[7], { oxygen: 0, nitrogen: 0 });
});