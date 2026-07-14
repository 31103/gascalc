import { describe, expect, it } from "vitest";
import type { Entry } from "../src/types/entry.ts";
import { upsertEntry } from "../src/utils/entries.ts";

const makeEntry = (day: number, hour: number, flow: number): Entry => ({
  dateTime: { day, hour, minute: 0 },
  flow,
  fio2: 21,
  mode: "standard",
});

describe("upsertEntry", () => {
  it("sorts entries by logical time", () => {
    expect(
      upsertEntry([makeEntry(2, 12, 2)], makeEntry(1, 8, 1)).map(
        (item) => item.flow,
      ),
    ).toEqual([1, 2]);
  });

  it("silently replaces an entry at the same logical time", () => {
    const result = upsertEntry(
      [makeEntry(1, 8, 1), makeEntry(1, 9, 2)],
      makeEntry(1, 8, 3),
    );
    expect(result).toHaveLength(2);
    expect(result[0]?.flow).toBe(3);
  });
});
