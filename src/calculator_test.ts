import { assertEquals } from "https://deno.land/std@0.110.0/testing/asserts.ts";
import { calculateUsage, generateUsageText } from "./calculator.ts";
import type { Entry } from "./types.ts";

// Test data for entries
function createTestEntries(): Entry[] {
  return [
    {
      dateTime: new Date(2024, 0, 1, 8, 0), // Jan 1, 8:00
      flow: 2,
      fio2: 40,
    },
    {
      dateTime: new Date(2024, 0, 1, 12, 0), // Jan 1, 12:00 (4 hours later)
      flow: 3,
      fio2: 50,
    },
    {
      dateTime: new Date(2024, 0, 2, 8, 0), // Jan 2, 8:00 (next day)
      flow: 1,
      fio2: 30,
    },
  ];
}

Deno.test("calculateUsage in regular mode calculates oxygen usage correctly", () => {
  const entries = createTestEntries();
  const fio2Mode = false;
  const noRoomAirMode = false;

  const usage = calculateUsage(entries, fio2Mode, noRoomAirMode);
  
  // In regular mode, oxygen usage is simply flow * time
  // First entry: 2L/min * 240min (4 hours) = 480L
  // Second entry: 3L/min * 1200min (20 hours) = 3600L
  // Third entry: No next entry, so calculated till end of day: 1L/min * 960min (16 hours) = 960L
  assertEquals(usage[1].oxygen, 480 + 3600 - 3600); // Jan 1: 480L (first entry only in Jan 1)
  assertEquals(usage[2].oxygen, 960 + 3600); // Jan 2: 960L + remaining from Jan 1 (2nd entry)
});

Deno.test("calculateUsage in FiO2 mode calculates oxygen usage correctly", () => {
  const entries = createTestEntries();
  const fio2Mode = true;
  const noRoomAirMode = false;

  const usage = calculateUsage(entries, fio2Mode, noRoomAirMode);
  
  // In FiO2 mode with room air, oxygen usage is calculated based on FiO2 adjustment
  // First entry: ((40-21)/0.79) * 2L/min * 240min = ~114.94L
  // Second entry: ((50-21)/0.79) * 3L/min * 1200min = ~1316.46L
  // Third entry: ((30-21)/0.79) * 1L/min * 960min = ~108.86L
  
  // We round to 1 decimal place in the final step
  assertEquals(usage[1].oxygen, 114.9); // Jan 1
  assertEquals(usage[2].oxygen, 1425.3); // Jan 2 (includes remainder from entry 2)
});

Deno.test("calculateUsage in FiO2 no-room-air mode calculates oxygen and nitrogen correctly", () => {
  const entries = createTestEntries();
  const fio2Mode = true;
  const noRoomAirMode = true;

  const usage = calculateUsage(entries, fio2Mode, noRoomAirMode);
  
  // In FiO2 mode with no room air
  // First entry: 
  //   Oxygen: 40% * 2L/min * 240min = 192L
  //   Nitrogen: 60% * 2L/min * 240min = 288L
  // Second entry: 
  //   Oxygen: 50% * 3L/min * 1200min = 1800L
  //   Nitrogen: 50% * 3L/min * 1200min = 1800L
  // Third entry:
  //   Oxygen: 30% * 1L/min * 960min = 288L
  //   Nitrogen: 70% * 1L/min * 960min = 672L
  
  assertEquals(usage[1].oxygen, 192);
  assertEquals(usage[1].nitrogen, 288);
  assertEquals(usage[2].oxygen, 1800 + 288);
  assertEquals(usage[2].nitrogen, 1800 + 672);
});

Deno.test("generateUsageText formats text correctly for normal mode", () => {
  const text = generateUsageText(120.5, 50, false);
  assertEquals(text, "402400+552010/120.5*1");
});

Deno.test("generateUsageText formats text correctly for no-room-air mode", () => {
  const text = generateUsageText(120.5, 50, true);
  assertEquals(text, "402400+552010/120.5*1\n402400+552010/50*1");
});