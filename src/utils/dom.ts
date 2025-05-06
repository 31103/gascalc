import type { Entry } from "../types/entry.ts";
import { formatDate, calculateUsage, type DailyUsage, formatDateForInput } from "./calculation.ts";

// --- DOM Element Getters ---

function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with ID "${id}" not found.`);
  }
  return element as T;
}

export const dateTimeInput = () => getElementById<HTMLInputElement>('dateTime');
export const flowInput = () => getElementById<HTMLInputElement>('flow');
export const fio2Input = () => getElementById<HTMLInputElement>('fio2Input');
export const fio2InputGroup = () => getElementById<HTMLDivElement>('fio2InputGroup');
export const errorDiv = () => getElementById<HTMLDivElement>('error');
export const entriesList = () => getElementById<HTMLUListElement>('entries');
export const usageList = () => getElementById<HTMLUListElement>('usage');
export const settingsOverlay = () => getElementById<HTMLDivElement>('settingsOverlay');
export const fio2ModeCheckbox = () => getElementById<HTMLInputElement>('fio2Mode');
export const noRoomAirModeCheckbox = () => getElementById<HTMLInputElement>('noRoomAirMode');
// ボタン要素の Getter を追加
export const addEntryBtn = () => getElementById<HTMLButtonElement>('addEntryBtn');
export const clearAllBtn = () => getElementById<HTMLButtonElement>('clearAllBtn');
export const settingsBtn = () => getElementById<HTMLButtonElement>('settingsBtn');
export const settingsCloseBtn = () => getElementById<HTMLButtonElement>('settingsCloseBtn');

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
    // 入力リストの更新
    const entriesUl = entriesList();
    entriesUl.innerHTML = ''; // 一旦クリア
    if (entriesData.length === 0) {
        entriesUl.innerHTML = '<li class="text-center text-gray-500 text-sm py-4">まだ入力がありません</li>';
    } else {
        entriesData.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center p-2 bg-white rounded border border-gray-200 text-sm';
            li.innerHTML = `
                <span>${formatDate(entry.dateTime)} ${entry.flow}L/min${fio2Mode ? ` FiO2:${entry.fio2}%` : ''}</span>
                <div class="flex gap-1">
                    <button class="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs" data-index="${index}" data-action="edit">修正</button>
                    <button class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs" data-index="${index}" data-action="delete">削除</button>
                </div>
            `;
            entriesUl.appendChild(li);
        });
        // イベントリスナーを一括で設定 (Event Delegation)
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


    // ガス使用量リストの更新
    const usageData = calculateUsage(entriesData, fio2Mode, noRoomAirMode);
    const usageUl = usageList();
    usageUl.innerHTML = ''; // 一旦クリア
    const sortedDates = Object.keys(usageData).map(Number).sort((a, b) => a - b);

    if (sortedDates.length === 0 && entriesData.length > 0) {
         usageUl.innerHTML = '<li class="text-center text-gray-500 text-sm py-4">計算中です...</li>'; // Or handle appropriately
    } else if (sortedDates.length === 0) {
         usageUl.innerHTML = '<li class="text-center text-gray-500 text-sm py-4">入力後に計算結果が表示されます</li>';
    } else {
        sortedDates.forEach(date => {
            const amounts = usageData[date];
            // 整数なら小数点以下を表示しない、そうでなければ小数点以下1桁まで表示
            const oxygenUsageStr = amounts.oxygen % 1 === 0 ? String(amounts.oxygen) : amounts.oxygen.toFixed(1);
            const nitrogenUsageStr = amounts.nitrogen % 1 === 0 ? String(amounts.nitrogen) : amounts.nitrogen.toFixed(1);

            const li = document.createElement('li');
            li.className = 'flex justify-between items-center p-2 bg-white rounded border border-gray-200 text-sm';
            let usageText = `${date}日: 酸素 ${oxygenUsageStr}L`;
            if (noRoomAirMode && amounts.nitrogen > 0) { // 窒素使用量がある場合のみ表示
                usageText += ` / 窒素 ${nitrogenUsageStr}L`;
            }
            li.innerHTML = `
                <span>${usageText}</span>
                <div class="flex gap-1">
                    <button class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs" data-oxygen="${oxygenUsageStr}" data-nitrogen="${nitrogenUsageStr}" data-action="copy">コピー</button>
                </div>
            `;
            usageUl.appendChild(li);
        });
         // イベントリスナーを一括で設定 (Event Delegation)
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
 * エラーメッセージを表示またはクリアする
 * @param message 表示するメッセージ、または空文字列でクリア
 */
export function displayError(message: string): void {
  errorDiv().textContent = message;
}

/**
 * 設定モーダルの表示/非表示を切り替える
 */
export function toggleSettings(): void {
  const overlay = settingsOverlay();
  overlay.classList.toggle('hidden');
  overlay.classList.toggle('flex'); // flex を使って中央揃え
}

/**
 * FiO2モードのトグル処理
 * @param clearAllCallback 全クリア処理のコールバック
 */
export function handleFio2ModeToggle(clearAllCallback: () => void): boolean {
  const isChecked = fio2ModeCheckbox().checked;
  fio2InputGroup().style.display = isChecked ? 'block' : 'none'; // blockに変更
  noRoomAirModeCheckbox().disabled = !isChecked;

  // FiO2モードが無効になったら、室内気不使用モードも強制的に無効化
  if (!isChecked) {
    noRoomAirModeCheckbox().checked = false;
  }

  clearAllCallback(); // モード変更時はデータをクリア
  return isChecked; // 新しいモードの状態を返す
}

/**
 * 室内気不使用モードのトグル処理
 * @param clearAllCallback 全クリア処理のコールバック
 */
export function handleNoRoomAirModeToggle(clearAllCallback: () => void): boolean {
  const isChecked = noRoomAirModeCheckbox().checked;
  clearAllCallback(); // モード変更時はデータをクリア
  return isChecked; // 新しいモードの状態を返す
}

/**
 * 入力フィールドをクリアする
 */
export function clearInputFields(): void {
    dateTimeInput().value = '';
    flowInput().value = '';
    fio2Input().value = ''; // FiO2入力もクリア
    displayError(''); // エラーメッセージもクリア
    dateTimeInput().focus(); // 日付時刻入力にフォーカスを戻す
}

/**
 * 指定されたエントリの内容を入力フィールドに設定する (修正用)
 * @param entry 編集するエントリ
 * @param fio2Mode 現在のFiO2モード
 */
export function populateInputFieldsForEdit(entry: Entry, fio2Mode: boolean): void {
    dateTimeInput().value = formatDateForInput(entry.dateTime);
    flowInput().value = String(entry.flow);
    if (fio2Mode) {
        fio2Input().value = String(entry.fio2);
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
    // 窒素使用量があり、室内気不使用モードが有効な場合のみ窒素行を追加
    if (noRoomAirMode && parseFloat(nitrogenUsage) > 0) {
        text += `\n402400+552010/${nitrogenUsage}*1`;
    }
    navigator.clipboard.writeText(text)
        .then(() => {
            // 必要であればコピー成功のフィードバックをユーザーに表示
            // 例: displayError("クリップボードにコピーしました。");
            // setTimeout(() => displayError(""), 2000); // 2秒後にメッセージを消す
        })
        .catch(err => {
            console.error('コピーに失敗しました: ', err);
            displayError("クリップボードへのコピーに失敗しました。");
        });
}