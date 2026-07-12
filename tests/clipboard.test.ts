import { describe, expect, it } from "vitest";
import { formatUsageForClipboard } from "../src/utils/clipboard.ts";

describe("formatUsageForClipboard", () => {
  it("formats oxygen usage", () => {
    expect(formatUsageForClipboard(120, 0, false)).toBe("402400+552010/120*1");
  });

  it("preserves one decimal place", () => {
    expect(formatUsageForClipboard(12.34, 0, false)).toBe(
      "402400+552010/12.3*1",
    );
  });

  it("includes nitrogen only in no-room-air mode", () => {
    expect(formatUsageForClipboard(120, 80, true)).toBe(
      "402400+552010/120*1\n402400+552010/80*1",
    );
    expect(formatUsageForClipboard(120, 80, false)).toBe("402400+552010/120*1");
  });
});
