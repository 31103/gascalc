import type { CalculationMode } from "../types/entry.ts";

export function formatUsageForClipboard(
  oxygen: number,
  nitrogen: number,
  mode: CalculationMode,
): string {
  const format = (value: number) =>
    value % 1 === 0 ? String(value) : value.toFixed(1);
  if (mode === "standard") {
    return `402400+552010/${format(oxygen)}*1`;
  }
  const nitrogenPart =
    mode === "fio2-no-room-air" && nitrogen > 0
      ? `+233203/${format(nitrogen)}`
      : "";
  return `404520${nitrogenPart}+552010/${format(oxygen)}*1`;
}

function fallbackCopy(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    return Boolean(document.execCommand?.("copy"));
  } catch {
    return false;
  } finally {
    textArea.remove();
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Clipboard APIが拒否された場合は従来APIへフォールバックする。
  }
  try {
    return fallbackCopy(text);
  } catch {
    return false;
  }
}
