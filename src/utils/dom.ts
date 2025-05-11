import type { Entry } from "../types/entry.ts";
import { formatDate, calculateUsage, formatDateForInput } from "./calculation.ts";

// --- DOM Element Getters Helper ---

function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with ID "${id}" not found.`);
  }
  return element as T;
}

// --- Cached DOM Element References ---
const dateTimeInputElement = getElementById<HTMLInputElement>('dateTime');
const flowInputElement = getElementById<HTMLInputElement>('flow');
const fio2InputElement = getElementById<HTMLInputElement>('fio2Input');
const fio2InputGroupElement = getElementById<HTMLDivElement>('fio2InputGroup');
const errorDivElement = getElementById<HTMLDivElement>('error');
const snackbarElement = getElementById<HTMLDivElement>('snackbar');
const snackbarTextElement = getElementById<HTMLSpanElement>('snackbarText');
const snackbarActionElement = getElementById<HTMLButtonElement>('snackbarAction');
const entriesListElement = getElementById<HTMLUListElement>('entries');
const usageListElement = getElementById<HTMLUListElement>('usage');
const settingsOverlayElement = getElementById<HTMLDivElement>('settingsOverlay');
const fio2ModeCheckboxElement = getElementById<HTMLInputElement>('fio2Mode');
const noRoomAirModeCheckboxElement = getElementById<HTMLInputElement>('noRoomAirMode');
const addEntryBtnElement = getElementById<HTMLButtonElement>('addEntryBtn');
const clearAllBtnElement = getElementById<HTMLButtonElement>('clearAllBtn');
const settingsBtnElement = getElementById<HTMLButtonElement>('settingsBtn');
// const settingsCloseBtnElement = getElementById<HTMLButtonElement>('settingsCloseBtn'); // 削除
const settingsCloseBtn2Element = getElementById<HTMLButtonElement>('settingsCloseBtn2');

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
export const addEntryBtn = () => addEntryBtnElement;
export const clearAllBtn = () => clearAllBtnElement;
export const settingsBtn = () => settingsBtnElement;
// export const settingsCloseBtn = () => settingsCloseBtnElement; // 削除
export const settingsCloseBtn2 = () => settingsCloseBtn2Element;

// --- UI Update Functions ---

/**
 * 入力リストと計算結果リストを更新する
 * @param entriesData 現在のエントリデータ
 * @param fio2Mode 現在のFiO2モード
 * @param noRoomAirMode 現在の室内気不使用モード
 * @param editEntryCallback 修正ボタンクリック時のコールバック
 * @param deleteEntryCallback 削除ボタンクリック時のコールバック
 * @param copyUsageCallback コピーボタンクリック時のコールバック
 */
export function updateUI(
    entriesData: Entry[],
    fio2Mode: boolean,
    noRoomAirMode: boolean,
    editEntryCallback: (index: number) => void,
    deleteEntryCallback: (index: number) => void,
    copyUsageCallback: (oxygen: string, nitrogen: string) => void,
): void {
    const entriesUl = entriesList(); // Accessor returns cached element
    entriesUl.innerHTML = ''; // 一旦クリア
    if (entriesData.length === 0) {
        entriesUl.innerHTML = '<li class="text-center text-[var(--md-on-surface-variant)] py-4 md-body-medium">まだ入力がありません</li>';
    } else {
        entriesData.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = 'md-list-item md-card p-3 mb-2';
            // ボタンが常に右側に配置されるように修正
            li.innerHTML = `
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="md-body-large flex-grow">${formatDate(entry.dateTime)} ${entry.flow}L/min${fio2Mode ? ` FiO2:${entry.fio2}%` : ''}</span>
                    <div class="flex gap-2 flex-shrink-0">
                        <button class="btn btn-text btn-sm" data-index="${index}" data-action="edit">修正</button>
                        <button class="btn btn-text btn-sm text-[var(--md-error)]" data-index="${index}" data-action="delete">削除</button>
                    </div>
                </div>
            `;
            entriesUl.appendChild(li);
        });
        entriesUl.onclick = (event) => {
             const target = event.target as HTMLElement;
             if (target.tagName === 'BUTTON') {
                 const index = parseInt(target.dataset.index ?? '-1', 10);
                 const action = target.dataset.action;
                 if (index !== -1) {
                     if (action === 'edit') {
                         editEntryCallback(index);
                     } else if (action === 'delete') {
                         deleteEntryCallback(index);
                     }
                 }
             }
         };
    }


    const usageData = calculateUsage(entriesData, fio2Mode, noRoomAirMode);
    const usageUl = usageList(); // Accessor returns cached element
    usageUl.innerHTML = ''; // 一旦クリア
    const sortedDates = Object.keys(usageData).map(Number).sort((a, b) => a - b);

    if (sortedDates.length === 0 && entriesData.length > 0) {
         usageUl.innerHTML = '<li class="text-center text-[var(--md-on-surface-variant)] py-4 md-body-medium">計算中です...</li>';
    } else if (sortedDates.length === 0) {
         usageUl.innerHTML = '<li class="text-center text-[var(--md-on-surface-variant)] py-4 md-body-medium">入力後に計算結果が表示されます</li>';
    } else {
        sortedDates.forEach(date => {
            const amounts = usageData[date];
            const oxygenUsageStr = amounts.oxygen % 1 === 0 ? String(amounts.oxygen) : amounts.oxygen.toFixed(1);
            const nitrogenUsageStr = amounts.nitrogen % 1 === 0 ? String(amounts.nitrogen) : amounts.nitrogen.toFixed(1);

            const li = document.createElement('li');
            li.className = 'md-list-item md-card p-3 mb-2';
            let usageText = `${date}日: 酸素 ${oxygenUsageStr}L`;
            if (noRoomAirMode && amounts.nitrogen > 0) {
                usageText += ` / 窒素 ${nitrogenUsageStr}L`;
            }
            // ボタンが常に右側に配置されるように修正
            li.innerHTML = `
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="md-body-large flex-grow">${usageText}</span>
                    <button class="btn btn-primary btn-sm flex-shrink-0" data-oxygen="${oxygenUsageStr}" data-nitrogen="${nitrogenUsageStr}" data-action="copy">コピー</button>
                </div>
            `;
            usageUl.appendChild(li);
        });
         usageUl.onclick = (event) => {
             const target = event.target as HTMLElement;
             if (target.tagName === 'BUTTON' && target.dataset.action === 'copy') {
                 const oxygen = target.dataset.oxygen ?? '0';
                 const nitrogen = target.dataset.nitrogen ?? '0';
                 copyUsageCallback(oxygen, nitrogen);
             }
         };
    }
}

/**
 * エラーメッセージをスナックバーで表示する
 * @param message 表示するメッセージ、または空文字列でクリア
 */
export function displayError(message: string): void {
  if (!message) {
    snackbar().classList.add('hidden');
    return;
  }
  
  snackbarText().textContent = message;
  snackbar().classList.remove('hidden');
  
  // 3秒後に自動的に閉じる
  setTimeout(() => {
    snackbar().classList.add('hidden');
  }, 3000);
  
  // 閉じるボタンのイベントリスナー
  snackbarAction().onclick = () => {
    snackbar().classList.add('hidden');
  };
}

/**
 * 設定ダイアログの表示/非表示を切り替える
 */
export function toggleSettings(event?: MouseEvent): void {
  const overlay = settingsOverlay(); // Accessor returns cached element

  // イベントが指定され、かつクリックターゲットがオーバーレイ自体である場合のみ閉じる
  if (event && event.target === overlay) {
    overlay.classList.add('hidden');
  } else if (!event) { // イベントが指定されていない場合は単純にトグルする（ボタンクリックなど）
    overlay.classList.toggle('hidden');
  }
  // ダイアログ内のクリックでは何もしない
}

/**
 * FiO2モードのトグル処理
 * @param clearAllCallback 全クリア処理のコールバック
 */
export function handleFio2ModeToggle(clearAllCallback: () => void): boolean {
  const isChecked = fio2ModeCheckbox().checked; // Accessor returns cached element
  fio2InputGroup().classList.toggle('hidden', !isChecked); // Accessor returns cached element
  noRoomAirModeCheckbox().disabled = !isChecked; // Accessor returns cached element

  if (!isChecked) {
    noRoomAirModeCheckbox().checked = false; // Accessor returns cached element
  }

  clearAllCallback();
  return isChecked;
}

/**
 * 室内気不使用モードのトグル処理
 * @param clearAllCallback 全クリア処理のコールバック
 */
export function handleNoRoomAirModeToggle(clearAllCallback: () => void): boolean {
  const isChecked = noRoomAirModeCheckbox().checked; // Accessor returns cached element
  clearAllCallback();
  return isChecked;
}

/**
 * 入力フィールドをクリアする
 */
export function clearInputFields(): void {
    dateTimeInput().value = ''; // Accessor returns cached element
    flowInput().value = ''; // Accessor returns cached element
    fio2Input().value = ''; // Accessor returns cached element
    displayError('');
    dateTimeInput().focus(); // Accessor returns cached element
}

/**
 * 指定されたエントリの内容を入力フィールドに設定する (修正用)
 * @param entry 編集するエントリ
 * @param fio2Mode 現在のFiO2モード
 */
export function populateInputFieldsForEdit(entry: Entry, fio2Mode: boolean): void {
    dateTimeInput().value = formatDateForInput(entry.dateTime); // Accessor returns cached element
    flowInput().value = String(entry.flow); // Accessor returns cached element
    if (fio2Mode) {
        fio2Input().value = String(entry.fio2); // Accessor returns cached element
    }
}

/**
 * 計算結果をクリップボードにコピーする
 * @param oxygenUsage 酸素使用量 (文字列)
 * @param nitrogenUsage 窒素使用量 (文字列)
 * @param noRoomAirMode 室内気不使用モードが有効か
 */
export function copyUsageToClipboard(oxygenUsage: string, nitrogenUsage: string, noRoomAirMode: boolean): void {
    let text = `402400+552010/${oxygenUsage}*1`;
    if (noRoomAirMode && parseFloat(nitrogenUsage) > 0) {
        text += `\n402400+552010/${nitrogenUsage}*1`;
    }
    navigator.clipboard.writeText(text)
        .then(() => {
            // コピー成功時のフィードバック
            displayError("クリップボードにコピーしました");
        })
        .catch(err => {
            console.error('コピーに失敗しました: ', err);
            displayError("クリップボードへのコピーに失敗しました");
        });
}
