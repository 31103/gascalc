import { describe, expect, it } from "vitest";
import type { Entry } from "../src/types/entry.ts";
import { calculateUsage } from "../src/utils/calculation.ts";

const entry = (
  day: number,
  hour: number,
  minute: number,
  flow: number,
  fio2 = 21,
): Entry => ({
  dateTime: { day, hour, minute },
  flow,
  fio2,
});

describe("calculateUsage", () => {
  it("calculates one entry until the end of its logical day", () => {
    expect(calculateUsage([entry(1, 10, 0, 2)], false, false)[1]).toEqual({
      oxygen: 1680,
      nitrogen: 0,
    });
  });

  it("calculates entries on the same day", () => {
    const usage = calculateUsage(
      [entry(1, 10, 0, 2), entry(1, 12, 0, 3)],
      false,
      false,
    );
    expect(usage[1]).toEqual({ oxygen: 2400, nitrogen: 0 });
  });

  it("splits usage across logical day boundaries", () => {
    const usage = calculateUsage(
      [entry(30, 22, 0, 5), entry(31, 8, 0, 1)],
      false,
      false,
    );
    expect(usage[30]).toEqual({ oxygen: 600, nitrogen: 0 });
    expect(usage[31]).toEqual({ oxygen: 3360, nitrogen: 0 });
  });

  it("does not continue past the end of day 31", () => {
    expect(calculateUsage([entry(31, 23, 0, 2)], false, false)).toEqual({
      31: { oxygen: 120, nitrogen: 0 },
    });
  });

  it("calculates FiO2 with room air", () => {
    const usage = calculateUsage([entry(3, 9, 0, 10, 40)], true, false);
    expect(usage[3]).toEqual({ oxygen: 2164.6, nitrogen: 0 });
  });

  it("calculates FiO2 without room air", () => {
    const usage = calculateUsage([entry(4, 14, 0, 15, 60)], true, true);
    expect(usage[4]).toEqual({ oxygen: 5400, nitrogen: 3600 });
  });

  it("returns zero usage for zero flow and FiO2 21 with room air", () => {
    expect(calculateUsage([entry(7, 10, 0, 0)], false, false)[7]?.oxygen).toBe(
      0,
    );
    expect(calculateUsage([entry(7, 10, 0, 5, 21)], true, false)[7]).toEqual({
      oxygen: 0,
      nitrogen: 0,
    });
  });

  it("returns an empty record for no entries", () => {
    expect(calculateUsage([], false, false)).toEqual({});
  });
});
