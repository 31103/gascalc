// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App.svelte";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: undefined,
  });
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

async function selectCalculationMethod(name: string) {
  if (!screen.queryByLabelText(name)) {
    await fireEvent.click(screen.getByLabelText("計算方法を変更"));
  }
  await fireEvent.click(screen.getByLabelText(name));
}

describe("App", () => {
  it("keeps calculation choices collapsed until requested and collapses after adding", async () => {
    render(App);
    expect(screen.queryByLabelText("酸素流量から計算")).toBeNull();
    const toggle = screen.getByLabelText("計算方法を変更");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await fireEvent.click(toggle);
    expect(screen.getByLabelText("酸素流量から計算")).toBeTruthy();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    await addEntry("010900", "1");
    expect(screen.queryByLabelText("酸素流量から計算")).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("accepts zero as an oxygen flow", async () => {
    render(App);
    await addEntry("010900", "0");

    expect(screen.getByText("1件の入力")).toBeTruthy();
    expect(screen.getByText("0 L/min")).toBeTruthy();
    expect(screen.queryByText("日付時刻と流量を入力してください。")).toBeNull();
  });

  it("accepts zero as a total flow", async () => {
    render(App);
    await selectCalculationMethod("総流量・酸素濃度から計算");
    await fireEvent.input(screen.getByLabelText("日付時刻 (DDHHMM)"), {
      target: { value: "010900" },
    });
    await fireEvent.input(screen.getByLabelText("流量 (L/min)"), {
      target: { value: "0" },
    });
    await fireEvent.input(screen.getByLabelText("設定酸素濃度 (%)"), {
      target: { value: "40" },
    });
    await fireEvent.click(screen.getByTitle("追加"));

    expect(screen.getByText("1件の入力")).toBeTruthy();
    expect(screen.getByText("0 L/min")).toBeTruthy();
    expect(screen.queryByText("日付時刻と流量を入力してください。")).toBeNull();
  });

  it("shows the fallback day and a live date-time interpretation", async () => {
    render(App);
    expect(
      screen.getByText("時刻のみの場合は1日として追加します"),
    ).toBeTruthy();
    await addEntry("030900", "1");
    expect(
      screen.getByText("時刻のみの場合は3日として追加します"),
    ).toBeTruthy();
    await fireEvent.input(screen.getByLabelText("日付時刻 (DDHHMM)"), {
      target: { value: "1015" },
    });
    expect(screen.getByText("3日 10:15として追加します")).toBeTruthy();
  });

  it("opens the beginner help and returns focus when closed", async () => {
    render(App);
    const trigger = screen.getByRole("button", { name: "使い方を開く" });
    await fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "使い方" })).toBeTruthy();
    expect(screen.getByText("時刻だけでも入力できます")).toBeTruthy();
    await fireEvent.keyDown(screen.getByRole("dialog", { name: "使い方" }), {
      key: "Escape",
    });
    expect(screen.queryByRole("dialog", { name: "使い方" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("asks for confirmation before clearing entered data", async () => {
    render(App);
    await addEntry("010900", "1");
    await fireEvent.click(screen.getByRole("button", { name: "全クリア" }));
    expect(
      screen.getByRole("alertdialog", { name: "すべてクリアしますか？" }),
    ).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.getByText("1日09時00分")).toBeTruthy();
    expect(screen.getByText("1 L/min")).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "全クリア" }));
    await fireEvent.click(screen.getByRole("button", { name: "すべてクリア" }));
    expect(screen.getByText("まだ入力がありません")).toBeTruthy();
  });

  it("keeps P/F input hidden until the secondary button opens its dialog", async () => {
    render(App);
    const trigger = screen.getByRole("button", { name: "P/F比を入力" });
    expect(screen.queryByLabelText("1. 日付時刻")).toBeNull();
    await fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "P/F比を計算" })).toBeTruthy();
    const dateTimeInput = screen.getByLabelText("1. 日付時刻");
    expect(document.activeElement).toBe(dateTimeInput);
    await fireEvent.keyDown(dateTimeInput, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("calculates and keeps a P/F ratio history from PaO2", async () => {
    render(App);
    await addEntry("010900", "3");
    await fireEvent.click(screen.getByRole("button", { name: "P/F比を入力" }));
    await fireEvent.input(screen.getByLabelText("1. 日付時刻"), {
      target: { value: "011000" },
    });
    await fireEvent.input(screen.getByLabelText("3. PaO2の値"), {
      target: { value: "80" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "計算する" }));
    expect(
      screen.getByText(
        (_, element) =>
          element?.classList.contains("pf-number") === true &&
          element.textContent?.includes("250") === true,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/FiO2 32%（流量から推定）/)).toBeTruthy();
    expect(screen.getByText("概算")).toBeTruthy();
  });

  it("recalculates saved P/F ratios after the oxygen condition is edited", async () => {
    render(App);
    await addEntry("010900", "3");
    await fireEvent.click(screen.getByRole("button", { name: "P/F比を入力" }));
    await fireEvent.input(screen.getByLabelText("1. 日付時刻"), {
      target: { value: "011000" },
    });
    await fireEvent.input(screen.getByLabelText("3. PaO2の値"), {
      target: { value: "80" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "計算する" }));
    expect(
      screen.getByText(
        (_, element) =>
          element?.classList.contains("pf-number") === true &&
          element.textContent?.includes("250") === true,
      ),
    ).toBeTruthy();

    await fireEvent.click(screen.getByLabelText("1日09時00分の入力を修正"));
    await fireEvent.input(screen.getByLabelText("編集する流量"), {
      target: { value: "5" },
    });
    await fireEvent.click(screen.getByLabelText("保存"));

    const recalculatedResults = screen.getAllByText(
      (_, element) =>
        element?.classList.contains("pf-number") === true &&
        element.textContent?.includes("200") === true,
    );
    expect(recalculatedResults).toHaveLength(2);
    expect(screen.queryByText(/FiO2 32%（流量から推定）/)).toBeNull();
    expect(screen.getAllByText(/FiO2 40%（流量から推定）/)).toHaveLength(2);
    expect(screen.getByText("動脈血 PaO2：80 mmHg")).toBeTruthy();
  });

  it("shows a structured in-place editor and reveals oxygen concentration by mode", async () => {
    render(App);
    await addEntry("010900", "3");
    await fireEvent.click(screen.getByLabelText("1日09時00分の入力を修正"));
    expect(screen.getByText("使用条件を修正")).toBeTruthy();
    expect(screen.getByLabelText("編集する日付時刻")).toBeTruthy();
    expect(screen.queryByLabelText("編集する設定酸素濃度")).toBeNull();
    await fireEvent.change(screen.getByLabelText("編集する計算モード"), {
      target: { value: "fio2-room-air" },
    });
    expect(screen.getByLabelText("編集する設定酸素濃度")).toBeTruthy();
    await fireEvent.click(screen.getByLabelText("キャンセル"));
    expect(screen.queryByText("使用条件を修正")).toBeNull();
  });

  it("saves a change from oxygen flow to synthetic-air concentration mode", async () => {
    render(App);
    await addEntry("010000", "10");
    await fireEvent.click(screen.getByLabelText("1日00時00分の入力を修正"));
    await fireEvent.change(screen.getByLabelText("編集する計算モード"), {
      target: { value: "fio2-no-room-air" },
    });
    await fireEvent.input(screen.getByLabelText("編集する設定酸素濃度"), {
      target: { value: "40" },
    });
    await fireEvent.click(screen.getByLabelText("保存"));

    expect(
      screen.getByText("酸素濃度方式・合成空気", {
        selector: ".mode-badge",
      }),
    ).toBeTruthy();
    expect(screen.getByText(/酸素 5760L \/ 窒素 8640L/)).toBeTruthy();
  });

  it("ignores the old oxygen concentration after changing an entry to oxygen flow mode", async () => {
    render(App);
    await selectCalculationMethod("総流量・酸素濃度から計算");
    await fireEvent.input(screen.getByLabelText("日付時刻 (DDHHMM)"), {
      target: { value: "010000" },
    });
    await fireEvent.input(screen.getByLabelText("流量 (L/min)"), {
      target: { value: "10" },
    });
    await fireEvent.input(screen.getByLabelText("設定酸素濃度 (%)"), {
      target: { value: "40" },
    });
    await fireEvent.click(screen.getByTitle("追加"));

    await fireEvent.click(screen.getByLabelText("1日00時00分の入力を修正"));
    await fireEvent.change(screen.getByLabelText("編集する計算モード"), {
      target: { value: "standard" },
    });
    expect(screen.queryByLabelText("編集する設定酸素濃度")).toBeNull();
    await fireEvent.click(screen.getByLabelText("保存"));

    expect(
      screen.getByText("酸素流量方式", { selector: ".mode-badge" }),
    ).toBeTruthy();
    expect(screen.getByText("酸素 14400L")).toBeTruthy();
    expect(screen.queryByText(/窒素/)).toBeNull();
  });

  it("replaces the existing timestamp with all edited condition fields", async () => {
    render(App);
    await addEntry("010800", "1");
    await addEntry("011000", "2");
    await fireEvent.click(screen.getByLabelText("1日08時00分の入力を修正"));
    await fireEvent.input(screen.getByLabelText("編集する日付時刻"), {
      target: { value: "011000" },
    });
    await fireEvent.input(screen.getByLabelText("編集する流量"), {
      target: { value: "3" },
    });
    await fireEvent.change(screen.getByLabelText("編集する計算モード"), {
      target: { value: "fio2-room-air" },
    });
    await fireEvent.input(screen.getByLabelText("編集する設定酸素濃度"), {
      target: { value: "40" },
    });
    await fireEvent.click(screen.getByLabelText("保存"));

    expect(screen.getByText("1件の入力")).toBeTruthy();
    expect(screen.getByText("1日10時00分")).toBeTruthy();
    expect(screen.getByText("3 L/min")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    expect(
      screen.getByText("酸素濃度方式・室内空気", {
        selector: ".mode-badge",
      }),
    ).toBeTruthy();
  });

  it("explains invalid SpO2 next to the field", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: "P/F比を入力" }));
    await fireEvent.click(screen.getByLabelText(/SpO2/));
    await fireEvent.input(screen.getByLabelText("1. 日付時刻"), {
      target: { value: "011000" },
    });
    await fireEvent.input(screen.getByLabelText("3. SpO2の値"), {
      target: { value: "100" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "計算する" }));
    expect(screen.getByText(/SpO2は70〜99%の範囲/)).toBeTruthy();
  });

  it("estimates from SpO2 and allows the history to be edited and deleted", async () => {
    render(App);
    await addEntry("010900", "3");
    await fireEvent.click(screen.getByRole("button", { name: "P/F比を入力" }));
    await fireEvent.click(screen.getByLabelText(/SpO2/));
    await fireEvent.input(screen.getByLabelText("1. 日付時刻"), {
      target: { value: "011000" },
    });
    await fireEvent.input(screen.getByLabelText("3. SpO2の値"), {
      target: { value: "95" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "計算する" }));
    expect(screen.getByText(/SpO2から推定/)).toBeTruthy();

    await fireEvent.click(screen.getByLabelText("1日10時00分の測定を修正"));
    await fireEvent.input(screen.getByLabelText("3. SpO2の値"), {
      target: { value: "96" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "編集を保存" }));
    expect(screen.getByText("SpO2：96%")).toBeTruthy();

    await fireEvent.click(screen.getByLabelText("1日10時00分の測定を削除"));
    expect(screen.queryByText(/1日10時00分のP\/F比/)).toBeNull();
    expect(screen.getByText(/酸素 2700L/)).toBeTruthy();
  });

  it("shows a clear message when no oxygen condition applies", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: "P/F比を入力" }));
    await fireEvent.input(screen.getByLabelText("1. 日付時刻"), {
      target: { value: "011000" },
    });
    await fireEvent.input(screen.getByLabelText("3. PaO2の値"), {
      target: { value: "80" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "計算する" }));
    expect(screen.getByText(/適用できる酸素量の入力がありません/)).toBeTruthy();
  });

  it("accepts logical day 31 and calculates until its end", async () => {
    render(App);
    await addEntry("310900", "2");
    expect(screen.getByText("31日09時00分")).toBeTruthy();
    expect(screen.getByText("2 L/min")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "31日" })).toBeTruthy();
    expect(screen.getByText(/酸素 1800L/)).toBeTruthy();
  });

  it("silently overwrites an entry at the same logical time", async () => {
    render(App);
    await addEntry("010900", "1");
    await addEntry("010900", "3");
    expect(screen.getByText("1日09時00分")).toBeTruthy();
    expect(screen.queryByText("1 L/min")).toBeNull();
    expect(screen.getByText("3 L/min")).toBeTruthy();
  });

  it("keeps existing entries when the mode for subsequent entries changes", async () => {
    render(App);
    await addEntry("010900", "1");
    await selectCalculationMethod("総流量・酸素濃度から計算");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByText("1日09時00分")).toBeTruthy();
    expect(screen.getByText("1 L/min")).toBeTruthy();
    expect(screen.getByLabelText("設定酸素濃度 (%)")).toBeTruthy();
  });

  it("shows usage by day and by the mode saved on each entry", async () => {
    render(App);
    await addEntry("010800", "2");

    await selectCalculationMethod("総流量・酸素濃度から計算");
    await fireEvent.input(screen.getByLabelText("日付時刻 (DDHHMM)"), {
      target: { value: "011400" },
    });
    await fireEvent.input(screen.getByLabelText("流量 (L/min)"), {
      target: { value: "10" },
    });
    await fireEvent.input(screen.getByLabelText("設定酸素濃度 (%)"), {
      target: { value: "40" },
    });
    await fireEvent.click(screen.getByTitle("追加"));

    await selectCalculationMethod("酸素流量から計算");
    await addEntry("021000", "5");

    expect(
      screen.getAllByText("酸素流量方式", { selector: ".helper-text" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByText("酸素濃度方式・室内空気", {
        selector: ".helper-text",
      }),
    ).toHaveLength(2);
    expect(screen.getByText("酸素 720L")).toBeTruthy();
    expect(screen.getAllByText("酸素 1443L")).toHaveLength(2);
    expect(screen.getByText("酸素 4200L")).toBeTruthy();
    expect(screen.queryByText(/合計/)).toBeNull();
  });

  it("calculates oxygen and nitrogen separately for supplied synthetic air", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(App);
    await selectCalculationMethod("総流量・酸素濃度から計算");
    await fireEvent.click(screen.getByLabelText("合成空気（配管）"));
    expect(
      screen.getByText(/合成空気中の酸素21%分は酸素ガスへ合算/),
    ).toBeTruthy();
    await fireEvent.input(screen.getByLabelText("日付時刻 (DDHHMM)"), {
      target: { value: "010000" },
    });
    await fireEvent.input(screen.getByLabelText("流量 (L/min)"), {
      target: { value: "10" },
    });
    await fireEvent.input(screen.getByLabelText("設定酸素濃度 (%)"), {
      target: { value: "40" },
    });
    await fireEvent.click(screen.getByTitle("追加"));
    expect(
      screen.getByText("酸素濃度方式・合成空気", {
        selector: ".helper-text",
      }),
    ).toBeTruthy();
    expect(screen.getByText(/酸素 5760L \/ 窒素 8640L/)).toBeTruthy();
    await fireEvent.click(
      screen.getByLabelText("1日の酸素濃度方式・合成空気のガス使用量をコピー"),
    );
    expect(writeText).toHaveBeenCalledWith("404520+233203/8640+552010/5760*1");
  });

  it("copies the concentration template without nitrogen for room air", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(App);
    await selectCalculationMethod("総流量・酸素濃度から計算");
    await fireEvent.input(screen.getByLabelText("日付時刻 (DDHHMM)"), {
      target: { value: "010000" },
    });
    await fireEvent.input(screen.getByLabelText("流量 (L/min)"), {
      target: { value: "10" },
    });
    await fireEvent.input(screen.getByLabelText("設定酸素濃度 (%)"), {
      target: { value: "40" },
    });
    await fireEvent.click(screen.getByTitle("追加"));
    await fireEvent.click(
      screen.getByLabelText("1日の酸素濃度方式・室内空気のガス使用量をコピー"),
    );
    expect(writeText).toHaveBeenCalledWith("404520+552010/3463.3*1");
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
