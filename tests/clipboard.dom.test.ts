// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "../src/utils/clipboard.ts";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("copyText", () => {
  it("uses the Clipboard API first", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    expect(await copyText("value")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("value");
  });

  it("falls back and removes its temporary element", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    expect(await copyText("value")).toBe(true);
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("returns false when both copy methods fail", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn().mockImplementation(() => {
        throw new Error("failed");
      }),
    });
    expect(await copyText("value")).toBe(false);
    expect(document.querySelector("textarea")).toBeNull();
  });
});
