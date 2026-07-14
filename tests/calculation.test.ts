import { describe, expect, it } from "vitest";
import type { CalculationMode, Entry } from "../src/types/entry.ts";
import { calculateUsage } from "../src/utils/calculation.ts";

const entry = (
  day: number,
  hour: number,
  minute: number,
  flow: number,
  fio2 = 21,
  mode: CalculationMode = "standard",
): Entry => ({
  dateTime: { day, hour, minute },
  flow,
  fio2,
  mode,
});

describe("calculateUsage", () => {
  it("calculates one entry until the end of its logical day", () => {
    expect(calculateUsage([entry(1, 10, 0, 2)])[1].standard).toEqual({
      oxygen: 1680,
      nitrogen: 0,
    });
  });

  it("calculates entries on the same day", () => {
    const usage = calculateUsage([entry(1, 10, 0, 2), entry(1, 12, 0, 3)]);
    expect(usage[1].standard).toEqual({ oxygen: 2400, nitrogen: 0 });
  });

  it("splits usage across logical day boundaries", () => {
    const usage = calculateUsage([entry(30, 22, 0, 5), entry(31, 8, 0, 1)]);
    expect(usage[30].standard).toEqual({ oxygen: 600, nitrogen: 0 });
    expect(usage[31].standard).toEqual({ oxygen: 3360, nitrogen: 0 });
  });

  it("does not continue past the end of day 31", () => {
    expect(calculateUsage([entry(31, 23, 0, 2)])).toEqual({
      31: { standard: { oxygen: 120, nitrogen: 0 } },
    });
  });

  it("calculates FiO2 with room air", () => {
    const usage = calculateUsage([entry(3, 9, 0, 10, 40, "fio2-room-air")]);
    expect(usage[3]["fio2-room-air"]).toEqual({ oxygen: 2164.6, nitrogen: 0 });
  });

  it("calculates FiO2 without room air", () => {
    const usage = calculateUsage([entry(4, 14, 0, 15, 60, "fio2-no-room-air")]);
    expect(usage[4]["fio2-no-room-air"]).toEqual({
      oxygen: 5400,
      nitrogen: 3600,
    });
  });

  it("returns zero usage for zero flow and FiO2 21 with room air", () => {
    expect(calculateUsage([entry(7, 10, 0, 0)])[7].standard?.oxygen).toBe(0);
    expect(
      calculateUsage([entry(7, 10, 0, 5, 21, "fio2-room-air")])[7][
        "fio2-room-air"
      ],
    ).toEqual({
      oxygen: 0,
      nitrogen: 0,
    });
  });

  it("returns an empty record for no entries", () => {
    expect(calculateUsage([])).toEqual({});
  });

  it("groups a mode change across two logical days", () => {
    const usage = calculateUsage([
      entry(1, 8, 0, 2),
      entry(1, 14, 0, 10, 40, "fio2-room-air"),
      entry(2, 10, 0, 5),
    ]);
    expect(usage).toEqual({
      1: {
        standard: { oxygen: 720, nitrogen: 0 },
        "fio2-room-air": { oxygen: 1443, nitrogen: 0 },
      },
      2: {
        standard: { oxygen: 4200, nitrogen: 0 },
        "fio2-room-air": { oxygen: 1443, nitrogen: 0 },
      },
    });
  });
});
