// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsDialog from "../src/components/SettingsDialog.svelte";

afterEach(cleanup);

function renderDialog(returnFocusTo?: HTMLElement) {
  const close = vi.fn();
  render(SettingsDialog, {
    isOpen: true,
    darkMode: false,
    fio2Mode: false,
    noRoomAirMode: false,
    close,
    returnFocusTo,
    onDarkModeChange: vi.fn(),
    onFio2ModeChange: vi.fn(),
    onNoRoomAirModeChange: vi.fn(),
  });
  return close;
}

describe("SettingsDialog", () => {
  it("focuses the close button and closes on Escape", async () => {
    const trigger = document.body.appendChild(document.createElement("button"));
    const close = renderDialog(trigger);
    const closeButton = await screen.findByLabelText("閉じる");
    expect(document.activeElement).toBe(closeButton);
    await fireEvent.keyDown(closeButton, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
  });

  it("wraps focus with Tab", async () => {
    renderDialog();
    const closeButtons = await screen.findAllByRole("button", {
      name: "閉じる",
    });
    const last = closeButtons[1];
    last.focus();
    await fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(closeButtons[0]);
  });
});
