import type { Entry } from "../types/entry.ts";
import {
  calculateUsage,
  formatDate,
  formatDateForInput,
} from "./calculation.ts";

// --- DOM Element Getters Helper ---

function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with ID "${id}" not found.`);
  }
  return element as T;
}

// --- Cached DOM Element References ---
const dateTimeInputElement = getElementById<HTMLInputElement>("dateTime");
const flowInputElement = getElementById<HTMLInputElement>("flow");
const fio2InputElement = getElementById<HTMLInputElement>("fio2Input");
const fio2InputGroupElement = getElementById<HTMLDivElement>("fio2InputGroup");
const errorDivElement = getElementById<HTMLDivElement>("error");
const snackbarElement = getElementById<HTMLDivElement>("snackbar");
const snackbarTextElement = getElementById<HTMLSpanElement>("snackbarText");
const snackbarActionElement =
  getElementById<HTMLButtonElement>("snackbarAction");
const entriesListElement = getElementById<HTMLUListElement>("entries");
const usageListElement = getElementById<HTMLUListElement>("usage");
const settingsOverlayElement =
  getElementById<HTMLDivElement>("settingsOverlay");
const fio2ModeCheckboxElement = getElementById<HTMLInputElement>("fio2Mode");
const noRoomAirModeCheckboxElement =
  getElementById<HTMLInputElement>("noRoomAirMode");
const darkModeCheckboxElement =
  getElementById<HTMLInputElement>("darkMode");
const addEntryBtnElement = getElementById<HTMLButtonElement>("addEntryBtn");
const clearAllBtnElement = getElementById<HTMLButtonElement>("clearAllBtn");
const settingsBtnElement = getElementById<HTMLButtonElement>("settingsBtn");
const settingsCloseBtn2Element =
  getElementById<HTMLButtonElement>("settingsCloseBtn2");

// --- Exported DOM Element Accessors ---
export const dateTimeInput = () => dateTimeInputElement;
export const flowInput = () => flowInputElement;
export const fio2Input = () => fio2InputElement;
export const fio2InputGroup = () => fio2InputGroupElement;
export const errorDiv = () => errorDivElement;
export const snackbar = () => snackbarElement;
export const snackbarText = () => snackbarTextElement;
export const snackbarAction = () => snackbarActionElement;
export const entriesList = () => entriesListElement;
export const usageList = () => usageListElement;
export const settingsOverlay = () => settingsOverlayElement;
export const fio2ModeCheckbox = () => fio2ModeCheckboxElement;
export const noRoomAirModeCheckbox = () => noRoomAirModeCheckboxElement;
export const darkModeCheckbox = () => darkModeCheckboxElement;
export const addEntryBtn = () => addEntryBtnElement;
export const clearAllBtn = () => clearAllBtnElement;
export const settingsBtn = () => settingsBtnElement;
export const settingsCloseBtn2 = () => settingsCloseBtn2Element;

// --- UI Update Functions ---

/**
 * 入力リストと計算結果リストを更新する
 */
export function updateUI(
  entriesData: Entry[],
  fio2Mode: boolean,
  noRoomAirMode: boolean,
  editEntryCallback: (index: number) => void,
  deleteEntryCallback: (index: number) => void,
  copyUsageCallback: (oxygen: string, nitrogen: string) => void,
  saveEditCallback?: (index: number, dateTime: string, flow: string, fio2?: string) => void,
  cancelEditCallback?: () => void,
): void {
  const entriesUl = entriesList();
  entriesUl.innerHTML = "";
  if (entriesData.length === 0) {
    entriesUl.innerHTML =
      '<li class="text-center text-[var(--md-on-surface-variant)] py-8 md-body-medium opacity-60">📝 まだ入力がありません</li>';
  } else {
    entriesData.forEach((entry, index) => {
      const li = document.createElement("li");
      li.className = "md-list-item list-item-enter";
      const dateStr = entry.dateTime.getTime();
      
      // 編集中の場合は入力フォームを表示、そうでなければ通常表示
      if (entry.editing) {
        // 編集中のフォーム
        const dateTimeStr = formatDateForInput(entry.dateTime);
        li.innerHTML = `
          <div class="w-full space-y-3">
            <div class="flex gap-3">
              <div class="input-field-container mb-0 flex-grow">
                <input type="text" id="edit-date-${dateStr}" placeholder=" " class="input-field w-full" value="${dateTimeStr}">
                <label class="input-field-label">日付時刻</label>
              </div>
              <div class="input-field-container mb-0 flex-grow">
                <input type="text" id="edit-flow-${dateStr}" placeholder=" " class="input-field w-full" value="${entry.flow}">
                <label class="input-field-label">流量 (L/min)</label>
              </div>
              ${fio2Mode ? `
              <div class="input-field-container mb-0 flex-grow">
                <input type="text" id="edit-fio2-${dateStr}" placeholder=" " class="input-field w-full" value="${entry.fio2}">
                <label class="input-field-label">FiO2(%)</label>
              </div>
              ` : ''}
            </div>
            <div class="flex justify-end gap-2">
              <button class="btn btn-text btn-sm" id="cancel-edit-${dateStr}">
                キャンセル
              </button>
              <button class="btn btn-primary btn-sm" id="save-edit-${dateStr}">
                保存
              </button>
            </div>
          </div>
        `;
      } else {
        // 通常表示
        li.innerHTML = `
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 flex-grow">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">schedule</span>
                        </div>
                        <span class="md-body-large font-medium">${formatDate(entry.dateTime)} <span class="text-blue-600 dark:text-blue-400 font-bold">${entry.flow}L/min</span>${fio2Mode ? `<span class="text-emerald-600 dark:text-emerald-400 font-bold"> FiO2:${entry.fio2}%</span>` : ""}</span>
                    </div>
                    <div class="flex gap-2 flex-shrink-0">
                        <button class="btn-icon btn-sm hover:bg-blue-100 dark:hover:bg-blue-900/30" id="edit-btn-${dateStr}" title="修正">
                            <span class="material-symbols-outlined pointer-events-none">edit</span>
                        </button>
                        <button class="btn-icon btn-sm hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500" id="delete-btn-${dateStr}" title="削除">
                            <span class="material-symbols-outlined pointer-events-none">delete</span>
                        </button>
                    </div>
                </div>
            `;
      }
      entriesUl.appendChild(li);
      
      if (entry.editing && saveEditCallback && cancelEditCallback) {
        // 保存ボタンのイベント
        const saveBtn = document.getElementById(`save-edit-${dateStr}`);
        if (saveBtn) {
          saveBtn.addEventListener("click", () => {
            const dateInput = document.getElementById(`edit-date-${dateStr}`) as HTMLInputElement;
            const flowInput = document.getElementById(`edit-flow-${dateStr}`) as HTMLInputElement;
            const fio2Input = document.getElementById(`edit-fio2-${dateStr}`) as HTMLInputElement;
            saveEditCallback(index, dateInput.value, flowInput.value, fio2Input?.value);
          });
        }
        // キャンセルボタンのイベント
        const cancelBtn = document.getElementById(`cancel-edit-${dateStr}`);
        if (cancelBtn) {
          cancelBtn.addEventListener("click", cancelEditCallback);
        }
      } else if (!entry.editing) {
        // 編集ボタンのイベント
        const editBtn = document.getElementById(`edit-btn-${dateStr}`);
        if (editBtn) {
          editBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            editEntryCallback(index);
          });
        }
        // 削除ボタンのイベント
        const deleteBtn = document.getElementById(`delete-btn-${dateStr}`);
        if (deleteBtn) {
          deleteBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteEntryCallback(index);
          });
        }
      }
    });
  }

  const usageData = calculateUsage(entriesData, fio2Mode, noRoomAirMode);
  const usageUl = usageList();
  usageUl.innerHTML = "";
  const sortedDates = Object.keys(usageData)
    .map(Number)
    .sort((a, b) => a - b);

  if (sortedDates.length === 0 && entriesData.length > 0) {
    usageUl.innerHTML =
      '<li class="text-center text-[var(--md-on-surface-variant)] py-8 md-body-medium opacity-60">⏳ 計算中です...</li>';
  } else if (sortedDates.length === 0) {
    usageUl.innerHTML =
      '<li class="text-center text-[var(--md-on-surface-variant)] py-8 md-body-medium opacity-60">📊 入力後に計算結果が表示されます</li>';
  } else {
    sortedDates.forEach((date) => {
      const amounts = usageData[date];
      const oxygenUsageStr =
        amounts.oxygen % 1 === 0
          ? String(amounts.oxygen)
          : amounts.oxygen.toFixed(1);
      const nitrogenUsageStr =
        amounts.nitrogen % 1 === 0
          ? String(amounts.nitrogen)
          : amounts.nitrogen.toFixed(1);

      let usageText = `<span class="font-bold text-emerald-600">酸素 ${oxygenUsageStr}L</span>`;
      if (noRoomAirMode && amounts.nitrogen > 0) {
        usageText += ` <span class="text-slate-400">/</span> <span class="font-bold text-slate-600">窒素 ${nitrogenUsageStr}L</span>`;
      }

      const li = document.createElement("li");
      li.className = "md-list-item list-item-enter";
      li.innerHTML = `
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 flex-grow">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-emerald-600 text-lg">gas_meter</span>
                        </div>
                        <span class="md-body-large"><span class="font-semibold text-slate-700">${date}日:</span> ${usageText}</span>
                    </div>
                    <button class="btn-icon btn-sm primary flex-shrink-0" id="copy-btn-${date}" title="コピー" data-oxygen="${oxygenUsageStr}" data-nitrogen="${nitrogenUsageStr}">
                        <span class="material-symbols-outlined pointer-events-none">content_copy</span>
                    </button>
                </div>
            `;
      usageUl.appendChild(li);
      
      // コピーボタンに直接イベントリスナーを追加
      const copyBtn = document.getElementById(`copy-btn-${date}`);
      if (copyBtn) {
        copyBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          copyUsageCallback(oxygenUsageStr, nitrogenUsageStr);
        });
      }
    });
  }
}

/**
 * エラーメッセージをスナックバーで表示する
 */
export function displayError(message: string): void {
  if (!message) {
    snackbar().classList.add("hidden");
    return;
  }

  snackbarText().textContent = message;
  snackbar().classList.remove("hidden");

  setTimeout(() => {
    snackbar().classList.add("hidden");
  }, 3000);

  snackbarAction().onclick = () => {
    snackbar().classList.add("hidden");
  };
}

/**
 * 設定ダイアログの表示/非表示を切り替える
 */
export function toggleSettings(event?: MouseEvent): void {
  const overlay = settingsOverlay();

  if (event && event.target === overlay) {
    overlay.classList.add("hidden");
  } else if (!event) {
    overlay.classList.toggle("hidden");
  }
}

/**
 * ダークモードのトグル処理
 */
export function handleDarkModeToggle(): boolean {
  const isChecked = darkModeCheckbox().checked;
  if (isChecked) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("darkMode", "true");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", "false");
  }
  return isChecked;
}

/**
 * ダークモードの初期化
 */
export function initializeDarkMode(): void {
  const saved = localStorage.getItem("darkMode");
  if (saved === "true") {
    document.documentElement.classList.add("dark");
    darkModeCheckbox().checked = true;
  }
}

/**
 * FiO2 モードのトグル処理
 */
export function handleFio2ModeToggle(clearAllCallback: () => void): boolean {
  const isChecked = fio2ModeCheckbox().checked;
  fio2InputGroup().classList.toggle("hidden", !isChecked);
  noRoomAirModeCheckbox().disabled = !isChecked;

  if (!isChecked) {
    noRoomAirModeCheckbox().checked = false;
  }

  clearAllCallback();
  return isChecked;
}

/**
 * 室内気不使用モードのトグル処理
 */
export function handleNoRoomAirModeToggle(
  clearAllCallback: () => void,
): boolean {
  const isChecked = noRoomAirModeCheckbox().checked;
  clearAllCallback();
  return isChecked;
}

/**
 * 入力フィールドをクリアする
 */
export function clearInputFields(): void {
  dateTimeInput().value = "";
  flowInput().value = "";
  fio2Input().value = "";
  displayError("");
  dateTimeInput().focus();
}

/**
 * 計算結果をクリップボードにコピーする
 */
export function copyUsageToClipboard(
  oxygenUsage: string,
  nitrogenUsage: string,
  noRoomAirMode: boolean,
): void {
  let text = `402400+552010/${oxygenUsage}*1`;
  if (noRoomAirMode && parseFloat(nitrogenUsage) > 0) {
    text += `\n402400+552010/${nitrogenUsage}*1`;
  }
  
  // Clipboard API が利用可能かチェック（HTTPS または localhost の場合のみ）
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        displayError("✅ クリップボードにコピーしました");
      })
      .catch((err) => {
        console.error("Clipboard API 失敗：", err);
        fallbackCopyToClipboard(text);
      });
  } else {
    // HTTP 環境などのフォールバック
    fallbackCopyToClipboard(text);
  }
}

/**
 * フォールバックのコピー機能（document.execCommand）
 */
function fallbackCopyToClipboard(text: string): void {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand("copy");
    if (successful) {
      displayError("✅ クリップボードにコピーしました");
    } else {
      displayError("❌ コピーに失敗しました");
    }
  } catch (err) {
    console.error("execCommand 失敗：", err);
    displayError("❌ コピーに失敗しました");
  }
  
  document.body.removeChild(textArea);
}
