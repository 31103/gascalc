import { describe, expect, it } from "vitest";
import {
  compareBillingDateTime,
  formatBillingDateTime,
  formatBillingDateTimeForInput,
  parseBillingDateTime,
  previewBillingDateTime,
  toBillingMinutes,
} from "../src/utils/billingDateTime.ts";

describe("billing date-time", () => {
  it("parses explicit days independently of the calendar", () => {
    expect(parseBillingDateTime("310907")).toEqual({
      day: 31,
      hour: 9,
      minute: 7,
    });
  });

  it("uses the fallback day when the day is omitted", () => {
    expect(parseBillingDateTime("907", 18)).toEqual({
      day: 18,
      hour: 9,
      minute: 7,
    });
    expect(parseBillingDateTime("907")).toEqual({ day: 1, hour: 9, minute: 7 });
  });

  it("describes how an input will be interpreted", () => {
    expect(previewBillingDateTime("", 18).message).toBe(
      "時刻のみの場合は18日として追加します",
    );
    expect(previewBillingDateTime("907", 18).message).toBe(
      "18日 09:07として追加します",
    );
    expect(previewBillingDateTime("20907", 18).message).toBe(
      "2日 09:07として追加します",
    );
    expect(previewBillingDateTime("2460", 18).kind).toBe("invalid");
  });

  it.each([
    "000000",
    "320000",
    "012400",
    "010060",
    "abc",
    "1234567",
  ])("rejects invalid input %s", (input) => {
    expect(parseBillingDateTime(input)).toBeNull();
  });

  it("compares and formats logical values", () => {
    const value = { day: 31, hour: 9, minute: 7 };
    expect(toBillingMinutes(value)).toBe(43747);
    expect(
      compareBillingDateTime({ day: 30, hour: 23, minute: 59 }, value),
    ).toBeLessThan(0);
    expect(formatBillingDateTime(value)).toBe("31日09時07分");
    expect(formatBillingDateTimeForInput(value)).toBe("310907");
  });
});
