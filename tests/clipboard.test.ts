import { describe, expect, it } from "vitest";
import { formatUsageForClipboard } from "../src/utils/clipboard.ts";

describe("formatUsageForClipboard", () => {
  it("formats oxygen usage", () => {
    expect(formatUsageForClipboard(120, 0, "standard")).toBe(
      "402400+552010/120*1",
    );
  });

  it("preserves one decimal place", () => {
    expect(formatUsageForClipboard(12.34, 0, "standard")).toBe(
      "402400+552010/12.3*1",
    );
  });

  it("uses the concentration template without nitrogen for room air", () => {
    expect(formatUsageForClipboard(120, 0, "fio2-room-air")).toBe(
      "404520+552010/120*1",
    );
  });

  it("uses the concentration template with nitrogen for synthetic air", () => {
    expect(formatUsageForClipboard(120, 80, "fio2-no-room-air")).toBe(
      "404520+233203/80+552010/120*1",
    );
    expect(formatUsageForClipboard(120, 0, "fio2-no-room-air")).toBe(
      "404520+552010/120*1",
    );
  });
});
