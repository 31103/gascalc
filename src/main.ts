import type { Entry } from "./types/entry.ts";
import {
  addEntryBtn,
  clearAllBtn,
  clearInputFields,
  copyUsageToClipboard,
  dateTimeInput,
  displayError,
  fio2Input,
  fio2InputGroup,
  fio2ModeCheckbox,
  flowInput,
  handleDarkModeToggle,
  handleFio2ModeToggle,
  handleNoRoomAirModeToggle,
  initializeDarkMode,
  noRoomAirModeCheckbox,
  settingsBtn,
  settingsCloseBtn2,
  settingsOverlay,
  snackbarAction,
  toggleSettings,
  updateUI,
} from "./utils/dom.ts";

// --- Application State ---

let entries: Entry[] = [];
let lastDate: Date | null = null;
let fio2Mode = false;
let noRoomAirMode = false;

// --- Core Functions ---

/**
 * DDHHMM 形式または HHMM 形式の文字列を Date オブジェクトにパースする。
 */
function parseDateTime(input: string): Date | null {
  let day: number, hour: number, minute: number;
  const now = new Date();

  if (input.length <= 4) {
    input = input.padStart(4, "0");
    if (!lastDate) {
      day = 1;
    } else {
      day = lastDate.getDate();
    }
    hour = parseInt(input.slice(0, 2), 10);
    minute = parseInt(input.slice(2, 4), 10);
  } else {
    input = input.padStart(6, "0");
    day = parseInt(input.slice(0, 2), 10);
    hour = parseInt(input.slice(2, 4), 10);
    minute = parseInt(input.slice(4, 6), 10);
  }

  if (
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    day < 1 ||
    day > 31 ||
    hour >= 24 ||
    minute >= 60
  ) {
    return null;
  }

  return new Date(now.getFullYear(), now.getMonth(), day, hour, minute);
}

/**
 * 入力値を検証し、Entry オブジェクトをパースして返す。
 */
function validateAndParseEntry(
  dateTimeStr: string,
  flowStr: string,
  fio2Str: string,
  currentFio2Mode: boolean,
): Entry | null {
  if (!dateTimeStr || !flowStr) {
    displayError("日付時刻と流量を入力してください。");
    return null;
  }

  const parsedDateTime = parseDateTime(dateTimeStr);
  if (!parsedDateTime) {
    displayError(
      "無効な日付時刻形式です。DDHHMM または HHMM で入力してください。",
    );
    return null;
  }

  const parsedFlow = parseFloat(flowStr);
  if (Number.isNaN(parsedFlow) || parsedFlow < 0) {
    displayError("無効な流量です。0 以上の数値を入力してください。");
    return null;
  }

  let parsedFio2 = 21;
  if (currentFio2Mode) {
    if (!fio2Str) {
      displayError("FiO2 モードが有効です。FiO2 値を入力してください。");
      return null;
    }
    parsedFio2 = parseInt(fio2Str, 10);
    if (Number.isNaN(parsedFio2) || parsedFio2 < 21 || parsedFio2 > 100) {
      displayError(
        "無効な FiO2 です。21 以上 100 以下の整数を入力してください。",
      );
      return null;
    }
  }
  displayError("");
  return {
    dateTime: parsedDateTime,
    flow: parsedFlow,
    fio2: parsedFio2,
    editing: false,
  };
}

/**
 * UI を更新するヘルパー
 */
function refreshUI(): void {
  updateUI(
    entries,
    fio2Mode,
    noRoomAirMode,
    handleEditEntry,
    handleDeleteEntry,
    handleCopyUsage,
    saveEditEntry,
    cancelEditEntry,
  );
}

/**
 * 新しいエントリを追加する
 */
function addEntry(): void {
  const dateTimeValue = dateTimeInput().value.trim();
  const flowValue = flowInput().value.trim();
  const fio2Value = fio2Input().value.trim();

  const newEntry = validateAndParseEntry(
    dateTimeValue,
    flowValue,
    fio2Value,
    fio2Mode,
  );

  if (newEntry) {
    entries.push(newEntry);
    entries.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    if (entries.length > 0) {
      lastDate = entries[entries.length - 1].dateTime;
    }

    refreshUI();
    clearInputFields();
  }
}

/**
 * 指定されたインデックスのエントリを削除する
 */
function handleDeleteEntry(index: number): void {
  if (index >= 0 && index < entries.length) {
    entries.splice(index, 1);
    lastDate = entries.length > 0 ? entries[entries.length - 1].dateTime : null;
    refreshUI();
  }
}

/**
 * 指定されたインデックスのエントリを編集モードにする (in-place 編集)
 */
function handleEditEntry(index: number): void {
  if (index >= 0 && index < entries.length) {
    // 編集中のフラグを立てる
    entries[index].editing = true;
    refreshUI();
  }
}

/**
 * 編集を保存する
 */
function saveEditEntry(
  index: number,
  dateTimeStr: string,
  flowStr: string,
  fio2Str?: string,
): void {
  if (index >= 0 && index < entries.length) {
    const newEntry = validateAndParseEntry(
      dateTimeStr,
      flowStr,
      fio2Str || "",
      fio2Mode,
    );

    if (newEntry) {
      entries[index] = newEntry;
      entries.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

      if (entries.length > 0) {
        lastDate = entries[entries.length - 1].dateTime;
      }

      refreshUI();
      displayError("✅ 編集を保存しました");
    }
  }
}

/**
 * 編集をキャンセルする
 */
function cancelEditEntry(): void {
  // 編集中のエントリをすべてキャンセル
  entries.forEach((entry) => {
    entry.editing = false;
  });
  refreshUI();
}

/**
 * 全ての入力と計算結果をクリアする
 */
function clearAll(): void {
  entries = [];
  lastDate = null;
  refreshUI();
  clearInputFields();
}

/**
 * コピーボタンのコールバック
 */
function handleCopyUsage(oxygen: string, nitrogen: string): void {
  copyUsageToClipboard(oxygen, nitrogen, noRoomAirMode);
}

// --- Event Listeners Setup ---

function initialize(): void {
  // ダークモードの初期化
  initializeDarkMode();

  refreshUI();

  addEntryBtn().addEventListener("click", addEntry);
  clearAllBtn().addEventListener("click", clearAll);
  settingsBtn().addEventListener("click", () => toggleSettings());
  settingsCloseBtn2().addEventListener("click", () => toggleSettings());
  settingsOverlay().addEventListener("click", (event) => toggleSettings(event));
  snackbarAction().addEventListener("click", () => displayError(""));

  // ダークモードのトグル
  const darkModeSwitch = document
    .getElementById("darkMode")
    ?.parentElement?.closest(".md-switch");
  if (darkModeSwitch) {
    darkModeSwitch.addEventListener("click", () => {
      document.getElementById("darkMode")?.click();
    });
  }
  document.getElementById("darkMode")?.addEventListener("change", () => {
    handleDarkModeToggle();
  });

  // FiO2 モードのトグル
  const fio2Switch = fio2ModeCheckbox().parentElement?.closest(".md-switch");
  if (fio2Switch) {
    fio2Switch.addEventListener("click", () => {
      fio2ModeCheckbox().click();
    });
  }

  const noRoomAirSwitch =
    noRoomAirModeCheckbox().parentElement?.closest(".md-switch");
  if (noRoomAirSwitch) {
    noRoomAirSwitch.addEventListener("click", () => {
      if (!noRoomAirModeCheckbox().disabled) {
        noRoomAirModeCheckbox().click();
      }
    });
  }

  fio2ModeCheckbox().addEventListener("change", () => {
    fio2Mode = handleFio2ModeToggle(clearAll);
    refreshUI();
  });
  noRoomAirModeCheckbox().addEventListener("change", () => {
    noRoomAirMode = handleNoRoomAirModeToggle(clearAll);
    refreshUI();
  });

  dateTimeInput().addEventListener("keypress", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      flowInput().focus();
    }
  });

  flowInput().addEventListener("keypress", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (fio2Mode) {
        fio2Input().focus();
      } else {
        addEntry();
      }
    }
  });

  fio2Input().addEventListener("keypress", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEntry();
    }
  });

  fio2InputGroup().classList.toggle("hidden", !fio2Mode);
  noRoomAirModeCheckbox().disabled = !fio2Mode;
}

// --- Initialize Application ---
document.addEventListener("DOMContentLoaded", initialize);
