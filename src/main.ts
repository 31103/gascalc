import type { Entry } from "./types/entry.ts";
import { formatDateForInput } from "./utils/calculation.ts";
import {
  updateUI,
  displayError,
  toggleSettings,
  handleFio2ModeToggle,
  handleNoRoomAirModeToggle,
  clearInputFields,
  populateInputFieldsForEdit,
  copyUsageToClipboard,
} from "./utils/dom.ts";

// --- Application State ---

let entries: Entry[] = [];
let lastDate: Date | null = null; // 初期値は null に変更
let fio2Mode = false;
let noRoomAirMode = false;

// --- DOM Element References ---
// dom.ts で取得するものはここでは不要

const dateTimeInput = () => document.getElementById('dateTime') as HTMLInputElement;
const flowInput = () => document.getElementById('flow') as HTMLInputElement;
const fio2Input = () => document.getElementById('fio2Input') as HTMLInputElement;
const addButton = () => document.querySelector('button[onclick="addEntry()"]') as HTMLButtonElement; // 仮。後で onclick は削除
const clearButton = () => document.querySelector('.clear-btn') as HTMLButtonElement; // 仮。後で onclick は削除
const settingsButton = () => document.querySelector('.tooltip[onclick="toggleSettings()"]') as HTMLDivElement; // 仮
const settingsCloseButton = () => document.querySelector('.close-btn[onclick="toggleSettings()"]') as HTMLSpanElement; // 仮
const fio2ModeCheckbox = () => document.getElementById('fio2Mode') as HTMLInputElement;
const noRoomAirModeCheckbox = () => document.getElementById('noRoomAirMode') as HTMLInputElement;


// --- Core Functions ---

/**
 * DDHHMM 形式または HHMM 形式の文字列を Date オブジェクトにパースする
 * 日付が省略された場合は lastDate の日付を使用する
 * @param input 日付時刻文字列
 * @returns パースされた Date オブジェクト、または無効な場合は null
 */
function parseDateTime(input: string): Date | null {
    let day: number, hour: number, minute: number;
    const now = new Date(); // 現在時刻を基準にする

    // 入力文字列の長さに応じてパース方法を決定
    if (input.length <= 4) { // HHMM 形式 (日付省略)
        if (!lastDate) { // 初回入力で日付省略はエラー
             displayError("最初のエントリでは日付を省略できません。DDHHMM形式で入力してください。");
             return null;
        }
        input = input.padStart(4, '0');
        day = lastDate.getDate();
        hour = parseInt(input.slice(0, 2), 10);
        minute = parseInt(input.slice(2, 4), 10);
    } else { // DDHHMM 形式
        input = input.padStart(6, '0');
        day = parseInt(input.slice(0, 2), 10);
        hour = parseInt(input.slice(2, 4), 10);
        minute = parseInt(input.slice(4, 6), 10);
    }

    // 簡単なバリデーション
    if (isNaN(day) || isNaN(hour) || isNaN(minute) || day < 1 || day > 31 || hour >= 24 || minute >= 60) {
        return null;
    }

    // Date オブジェクトを作成 (年は現在の年、月は現在の月を使用 - 必要に応じて調整)
    // 月をまたぐ場合などを考慮すると、より堅牢な日付処理が必要になる可能性がある
    const date = new Date(now.getFullYear(), now.getMonth(), day, hour, minute);

    // パース成功したら lastDate を更新
    lastDate = date;
    return date;
}


/**
 * 新しいエントリを追加する
 */
function addEntry(): void {
    const dateTimeValue = dateTimeInput().value.trim();
    const flowValue = flowInput().value.trim();
    const fio2Value = fio2Input().value.trim();

    if (!dateTimeValue || !flowValue) {
        displayError('日付時刻と流量を入力してください。');
        return;
    }

    const parsedDateTime = parseDateTime(dateTimeValue);
    if (!parsedDateTime) {
        displayError('無効な日付時刻形式です。DDHHMM または HHMM で入力してください。');
        return;
    }

    const parsedFlow = parseFloat(flowValue);
    if (isNaN(parsedFlow) || parsedFlow < 0) {
        displayError('無効な流量です。0以上の数値を入力してください。');
        return;
    }

    let parsedFio2 = 21; // デフォルト値
    if (fio2Mode) {
        if (!fio2Value) {
             displayError('FiO2モードが有効です。FiO2値を入力してください。');
             return;
        }
        parsedFio2 = parseInt(fio2Value, 10);
        if (isNaN(parsedFio2) || parsedFio2 < 21 || parsedFio2 > 100) {
            displayError('無効なFiO2です。21以上100以下の整数を入力してください。');
            return;
        }
    }

    displayError(''); // エラーをクリア

    entries.push({
        dateTime: parsedDateTime,
        flow: parsedFlow,
        fio2: parsedFio2,
    });

    // 日付時刻でソート
    entries.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    // lastDate が更新されている可能性があるので、ソート後の最後のエントリの日付を lastDate とする
    if (entries.length > 0) {
        lastDate = entries[entries.length - 1].dateTime;
    }


    updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);
    clearInputFields(); // 入力フィールドをクリアしてフォーカスを戻す
}

/**
 * 指定されたインデックスのエントリを削除する
 * @param index 削除するエントリのインデックス
 */
function handleDeleteEntry(index: number): void {
    if (index >= 0 && index < entries.length) {
        entries.splice(index, 1);
        // lastDate を再設定 (配列が空でなければ最後のエントリの日付)
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
        // 編集対象を配列から削除
        entries.splice(index, 1);
         // lastDate を再設定 (配列が空でなければ最後のエントリの日付)
        lastDate = entries.length > 0 ? entries[entries.length - 1].dateTime : null;
        updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);
        dateTimeInput().focus(); // 編集しやすいようにフォーカス
    }
}

/**
 * 全ての入力と計算結果をクリアする
 */
function clearAll(): void {
    entries = [];
    lastDate = null; // lastDate もリセット
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
    // 初期UI表示
    updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);

    // ボタンクリックイベント (onclick属性を削除し、こちらで設定)
    addButton().onclick = addEntry;
    clearButton().onclick = clearAll;
    settingsButton().onclick = toggleSettings;
    settingsCloseButton().onclick = toggleSettings;

    // 設定トグルイベント
    fio2ModeCheckbox().onchange = () => {
        fio2Mode = handleFio2ModeToggle(clearAll);
        // FiO2モード変更後、UIを再描画してFiO2表示を更新
        updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);
    };
    noRoomAirModeCheckbox().onchange = () => {
        noRoomAirMode = handleNoRoomAirModeToggle(clearAll);
         // 室内気モード変更後、UIを再描画して窒素表示を更新
        updateUI(entries, fio2Mode, noRoomAirMode, handleEditEntry, handleDeleteEntry, handleCopyUsage);
    };

    // Enterキーでのフォーカス移動と追加
    dateTimeInput().addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // デフォルトの送信動作を抑制
            flowInput().focus();
        }
    });

    flowInput().addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (fio2Mode) {
                fio2Input().focus();
            } else {
                addEntry();
            }
        }
    });

    fio2Input().addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEntry();
        }
    });

     // 初期状態で FiO2 入力欄の表示を制御
    document.getElementById('fio2InputGroup')!.style.display = fio2Mode ? 'block' : 'none';
    noRoomAirModeCheckbox().disabled = !fio2Mode;
}

// --- Initialize Application ---
// DOMContentLoaded を待って初期化を実行
document.addEventListener('DOMContentLoaded', initialize);