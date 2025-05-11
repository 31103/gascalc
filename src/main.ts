import type { Entry } from "./types/entry.ts";
import {
  updateUI,
  displayError,
  toggleSettings,
  handleFio2ModeToggle,
  handleNoRoomAirModeToggle,
  clearInputFields,
  populateInputFieldsForEdit,
  copyUsageToClipboard,
  dateTimeInput,
  flowInput,
  fio2Input,
  fio2ModeCheckbox,
  noRoomAirModeCheckbox,
  addEntryBtn,
  clearAllBtn,
  settingsBtn,
  settingsCloseBtn,
  fio2InputGroup, // fio2InputGroup をインポートに追加
} from "./utils/dom.ts";

// --- Application State ---

let entries: Entry[] = [];
let lastDate: Date | null = null;
let fio2Mode = false;
let noRoomAirMode = false;

// --- Core Functions ---

/**
 * DDHHMM 形式または HHMM 形式の文字列を Date オブジェクトにパースする。
 * HHMM形式で日付が省略された場合は、lastDateが存在すればその日付を、なければ現在の日付を使用する。
 * @param input 日付時刻文字列
 * @returns パースされた Date オブジェクト、または無効な場合は null
 */
function parseDateTime(input: string): Date | null {
    let day: number, hour: number, minute: number;
    const now = new Date();

    if (input.length <= 4) { // HHMM 形式 (日付省略)
        input = input.padStart(4, '0');
        if (!lastDate) { // 初回入力 (lastDate が null) の場合、日付を1日に設定
            day = 1;
        } else { // 2回目以降は前回の日付を使用
            day = lastDate.getDate();
        }
        hour = parseInt(input.slice(0, 2), 10);
        minute = parseInt(input.slice(2, 4), 10);
    } else { // DDHHMM 形式
        input = input.padStart(6, '0');
        day = parseInt(input.slice(0, 2), 10);
        hour = parseInt(input.slice(2, 4), 10);
        minute = parseInt(input.slice(4, 6), 10);
    }

    if (isNaN(day) || isNaN(hour) || isNaN(minute) || day < 1 || day > 31 || hour >= 24 || minute >= 60) {
        // displayError は呼び出し元で行うため、ここでは null を返すだけ
        return null;
    }

    // 年と月は現在のものを使用。月またぎの厳密な処理は calculateUsage で考慮される想定。
    return new Date(now.getFullYear(), now.getMonth(), day, hour, minute);
}

/**
 * 入力値を検証し、Entryオブジェクトをパースして返す。
 * 無効な場合はエラーを表示し null を返す。
 * @param dateTimeStr 日付時刻文字列
 * @param flowStr 流量文字列
 * @param fio2Str FiO2文字列
 * @param currentFio2Mode 現在のFiO2モード
 * @returns 有効な場合はEntryオブジェクト、無効な場合はnull
 */
function validateAndParseEntry(
    dateTimeStr: string,
    flowStr: string,
    fio2Str: string,
    currentFio2Mode: boolean
): Entry | null {
    if (!dateTimeStr || !flowStr) {
        displayError('日付時刻と流量を入力してください。');
        return null;
    }

    const parsedDateTime = parseDateTime(dateTimeStr);
    if (!parsedDateTime) {
        displayError('無効な日付時刻形式です。DDHHMM または HHMM で入力してください。');
        return null;
    }

    const parsedFlow = parseFloat(flowStr);
    if (isNaN(parsedFlow) || parsedFlow < 0) {
        displayError('無効な流量です。0以上の数値を入力してください。');
        return null;
    }

    let parsedFio2 = 21; // デフォルト値
    if (currentFio2Mode) {
        if (!fio2Str) {
             displayError('FiO2モードが有効です。FiO2値を入力してください。');
             return null;
        }
        parsedFio2 = parseInt(fio2Str, 10);
        if (isNaN(parsedFio2) || parsedFio2 < 21 || parsedFio2 > 100) {
            displayError('無効なFiO2です。21以上100以下の整数を入力してください。');
            return null;
        }
    }
    displayError(''); // エラーをクリア
    return { dateTime: parsedDateTime, flow: parsedFlow, fio2: parsedFio2 };
}


/**
 * 新しいエントリを追加する
 */
function addEntry(): void {
    const dateTimeValue = dateTimeInput().value.trim();
    const flowValue = flowInput().value.trim();
    const fio2Value = fio2Input().value.trim();

    const newEntry = validateAndParseEntry(dateTimeValue, flowValue, fio2Value, fio2Mode);

    if (newEntry) {
        entries.push(newEntry);
        entries.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

        if (entries.length > 0) {
            lastDate = entries[entries.length - 1].dateTime;
        }

        updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);
        clearInputFields();
    }
}

/**
 * 指定されたインデックスのエントリを削除する
 * @param index 削除するエントリのインデックス
 */
function handleDeleteEntry(index: number): void {
    if (index >= 0 && index < entries.length) {
        entries.splice(index, 1);
        lastDate = entries.length > 0 ? entries[entries.length - 1].dateTime : null;
        updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);
    }
}

/**
 * 指定されたインデックスのエントリを編集する (削除して入力欄に戻す)
 * @param index 編集するエントリのインデックス
 */
function handleEditEntry(index: number): void {
    if (index >= 0 && index < entries.length) {
        const entryToEdit = entries[index];
        populateInputFieldsForEdit(entryToEdit, fio2Mode);
        entries.splice(index, 1);
        lastDate = entries.length > 0 ? entries[entries.length - 1].dateTime : null;
        updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);
        dateTimeInput().focus();
    }
}

/**
 * 全ての入力と計算結果をクリアする
 */
function clearAll(): void {
    entries = [];
    lastDate = null;
    updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);
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
    updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);

    addEntryBtn().addEventListener('click', addEntry);
    clearAllBtn().addEventListener('click', clearAll);
    settingsBtn().addEventListener('click', toggleSettings);
    settingsCloseBtn().addEventListener('click', toggleSettings);

    fio2ModeCheckbox().addEventListener('change', () => {
        fio2Mode = handleFio2ModeToggle(clearAll);
        updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);
    });
    noRoomAirModeCheckbox().addEventListener('change', () => {
        noRoomAirMode = handleNoRoomAirModeToggle(clearAll);
        updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);
    });

    dateTimeInput().addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            flowInput().focus();
        }
    });

    flowInput().addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (fio2Mode) {
                fio2Input().focus();
            } else {
                addEntry();
            }
        }
    });

    fio2Input().addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEntry();
        }
    });

    // 初期状態で FiO2 入力欄の表示を制御 (dom.ts側でキャッシュされた要素を使うため、ここでは直接DOM操作しない方が良いが、
    // fio2InputGroup() がdom.tsからエクスポートされているので、それを使うのが一貫性がある。
    // ただし、この初期表示ロジックは handleFio2ModeToggle の一部としても良いかもしれない。)
    // dom.tsからエクスポートされているアクセサを使用する。
    fio2InputGroup().style.display = fio2Mode ? 'block' : 'none';
    noRoomAirModeCheckbox().disabled = !fio2Mode;
}

// --- Initialize Application ---
document.addEventListener('DOMContentLoaded', initialize);
