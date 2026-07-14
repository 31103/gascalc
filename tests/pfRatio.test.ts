import { describe, expect, it } from "vitest";
import type { CalculationMode, Entry } from "../src/types/entry.ts";
import type { OxygenMeasurement } from "../src/types/pfRatio.ts";
import {
  calculatePfRatio,
  estimatePao2FromSpo2,
  findOxygenEntryAt,
  getFio2Candidates,
  upsertMeasurement,
} from "../src/utils/pfRatio.ts";

const entry = (
  day: number,
  hour: number,
  flow: number,
  fio2 = 21,
  mode: CalculationMode = "standard",
): Entry => ({
  dateTime: { day, hour, minute: 0 },
  flow,
  fio2,
  mode,
});

const measurement = (
  day: number,
  hour: number,
  kind: "pao2" | "spo2" = "pao2",
  value = 80,
): OxygenMeasurement => ({ dateTime: { day, hour, minute: 0 }, kind, value });

describe("P/F ratio calculation", () => {
  it("estimates PaO2 from SpO2 with the standard dissociation curve", () => {
    expect(estimatePao2FromSpo2(70)).toBeCloseTo(36.6, 1);
    expect(estimatePao2FromSpo2(97)).toBeCloseTo(90.6, 1);
    expect(estimatePao2FromSpo2(99)).toBeCloseTo(131.9, 1);
  });

  it("uses explicit FiO2 and calculates an integer P/F ratio", () => {
    const result = calculatePfRatio(measurement(1, 10, "pao2", 80), [
      entry(1, 9, 10, 40, "fio2-room-air"),
    ]);
    expect(result.candidates).toEqual([
      { device: "入力されたFiO2", fio2: 40, estimated: false, pfRatio: 200 },
    ]);
  });

  it("returns only devices valid for the entered flow", () => {
    expect(getFio2Candidates(entry(1, 9, 3))).toEqual([
      { device: "鼻カヌラ", fio2: 32, estimated: true },
    ]);
    expect(
      getFio2Candidates(entry(1, 9, 10)).map((item) => item.device),
    ).toEqual(["酸素マスク", "リザーバー付き酸素マスク"]);
    expect(getFio2Candidates(entry(1, 9, 0))[0]).toEqual({
      device: "室内気",
      fio2: 21,
      estimated: false,
    });
  });

  it("interpolates decimal flows", () => {
    expect(getFio2Candidates(entry(1, 9, 5.5))).toEqual([
      { device: "鼻カヌラ", fio2: 42, estimated: true },
      { device: "酸素マスク", fio2: 42, estimated: true },
    ]);
  });

  it("uses the preceding condition but ends the final condition at midnight", () => {
    const entries = [entry(1, 20, 2), entry(3, 8, 3)];
    expect(findOxygenEntryAt(entries, measurement(2, 12))).toBe(entries[0]);
    expect(findOxygenEntryAt(entries, measurement(3, 7))).toBe(entries[0]);
    expect(findOxygenEntryAt(entries, measurement(4, 8))).toBeNull();
    expect(findOxygenEntryAt(entries, measurement(1, 10))).toBeNull();
  });

  it("uses each preceding entry's own mode in a mixed-mode timeline", () => {
    const entries = [
      entry(1, 9, 3),
      entry(1, 12, 10, 40, "fio2-room-air"),
      entry(1, 15, 5),
    ];

    const beforeSwitch = calculatePfRatio(measurement(1, 10), entries);
    expect(beforeSwitch.oxygenEntry).toBe(entries[0]);
    expect(beforeSwitch.candidates).toEqual([
      { device: "鼻カヌラ", fio2: 32, estimated: true, pfRatio: 250 },
    ]);

    const duringConcentrationMode = calculatePfRatio(
      measurement(1, 13),
      entries,
    );
    expect(duringConcentrationMode.oxygenEntry).toBe(entries[1]);
    expect(duringConcentrationMode.candidates).toEqual([
      { device: "入力されたFiO2", fio2: 40, estimated: false, pfRatio: 200 },
    ]);

    const afterReturnToFlow = calculatePfRatio(measurement(1, 16), entries);
    expect(afterReturnToFlow.oxygenEntry).toBe(entries[2]);
    expect(afterReturnToFlow.candidates).toEqual([
      { device: "鼻カヌラ", fio2: 40, estimated: true, pfRatio: 200 },
      { device: "酸素マスク", fio2: 40, estimated: true, pfRatio: 200 },
    ]);
  });

  it("overwrites a measurement at the same logical time", () => {
    const original = measurement(1, 10, "pao2", 80);
    const replacement = measurement(1, 10, "spo2", 95);
    expect(upsertMeasurement([original], replacement)).toEqual([replacement]);
  });
});
