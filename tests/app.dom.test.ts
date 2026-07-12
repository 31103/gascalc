// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App.svelte";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function addEntry(dateTime: string, flow: string) {
  await fireEvent.input(screen.getByLabelText("日付時刻 (DDHHMM)"), {
    target: { value: dateTime },
  });
  await fireEvent.input(screen.getByLabelText("流量 (L/min)"), {
    target: { value: flow },
  });
  await fireEvent.click(screen.getByTitle("追加"));
}

describe("App", () => {
  it("accepts logical day 31 and calculates until its end", async () => {
    render(App);
    await addEntry("310900", "2");
    expect(screen.getByText(/31日09時00分 2L\/min/)).toBeTruthy();
    expect(screen.getByText(/31日: 酸素 1800L/)).toBeTruthy();
  });

  it("silently overwrites an entry at the same logical time", async () => {
    render(App);
    await addEntry("010900", "1");
    await addEntry("010900", "3");
    expect(screen.queryByText(/1日09時00分 1L\/min/)).toBeNull();
    expect(screen.getAllByText(/1日09時00分 3L\/min/)).toHaveLength(1);
  });

  it("clears entries when a calculation mode changes", async () => {
    render(App);
    await addEntry("010900", "1");
    await fireEvent.click(screen.getByTitle("設定"));
    await fireEvent.click(screen.getByLabelText("FiO2モード"));
    expect(screen.getByText("まだ入力がありません")).toBeTruthy();
    expect(
      screen.getByText("計算条件を変更したため、入力をクリアしました"),
    ).toBeTruthy();
  });

  it("does not let an older notification timer clear a newer message", async () => {
    vi.useFakeTimers();
    render(App);
    await fireEvent.click(screen.getByTitle("追加"));
    expect(screen.getByText("日付時刻と流量を入力してください。")).toBeTruthy();
    await vi.advanceTimersByTimeAsync(1_000);
    await fireEvent.input(screen.getByLabelText("日付時刻 (DDHHMM)"), {
      target: { value: "invalid" },
    });
    await fireEvent.input(screen.getByLabelText("流量 (L/min)"), {
      target: { value: "1" },
    });
    await fireEvent.click(screen.getByTitle("追加"));
    expect(screen.getByText(/無効な日付時刻形式です/)).toBeTruthy();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(screen.getByText(/無効な日付時刻形式です/)).toBeTruthy();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(screen.queryByText(/無効な日付時刻形式です/)).toBeNull();
  });
});
