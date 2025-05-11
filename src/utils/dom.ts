import type { Entry } from "../types/entry.ts";
import { formatDate, calculateUsage, formatDateForInput } from "./calculation.ts";
// @ts-ignore
import DOMPurify from 'https://esm.sh/dompurify@3.0.11';

// --- DOM Element Getters Helper ---

function getElementById<T extends HTMLElement>(id: string): T | null {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with ID "${id}" not found.`);
    return null;
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
const settingsCloseBtn2Element = getElementById<HTMLButtonElement>('settingsCloseBtn2');

// --- Exported DOM Element Accessors (with null checks) ---
export const dateTimeInput = (): HTMLInputElement | null => dateTimeInputElement;
export const flowInput = (): HTMLInputElement | null => flowInputElement;
export const fio2Input = (): HTMLInputElement | null => fio2InputElement;
export const fio2InputGroup = (): HTMLDivElement | null => fio2InputGroupElement;
export const errorDiv = (): HTMLDivElement | null => errorDivElement;
export const snackbar = (): HTMLDivElement | null => snackbarElement;
export const snackbarText = (): HTMLSpanElement | null => snackbarTextElement;
export const snackbarAction = (): HTMLButtonElement | null => snackbarActionElement;
export const entriesList = (): HTMLUListElement | null => entriesListElement;
export const usageList = (): HTMLUListElement | null => usageListElement;
export const settingsOverlay = (): HTMLDivElement | null => settingsOverlayElement;
export const fio2ModeCheckbox = (): HTMLInputElement | null => fio2ModeCheckboxElement;
export const noRoomAirModeCheckbox = (): HTMLInputElement | null => noRoomAirModeCheckboxElement;
export const addEntryBtn = (): HTMLButtonElement | null => addEntryBtnElement;
export const clearAllBtn = (): HTMLButtonElement | null => clearAllBtnElement;
export const settingsBtn = (): HTMLButtonElement | null => settingsBtnElement;
export const settingsCloseBtn2 = (): HTMLButtonElement | null => settingsCloseBtn2Element;

// --- UI Update Functions ---

export function updateUI(
    entriesData: Entry[],
    fio2Mode: boolean,
    noRoomAirMode: boolean,
    editEntryCallback: (index: number) => void,
    deleteEntryCallback: (index: number) => void,
    copyUsageCallback: (oxygen: string, nitrogen: string) => void,
): void {
    const entriesUl = entriesList();
    if (!entriesUl) return;

    try {
        entriesUl.innerHTML = ''; // Clear previous entries
        if (entriesData.length === 0) {
            const li = document.createElement('li');
            li.className = 'text-center text-[var(--md-on-surface-variant)] py-4 md-body-medium';
            li.textContent = 'まだ入力がありません';
            entriesUl.appendChild(li);
        } else {
            entriesData.forEach((entry, index) => {
                const li = document.createElement('li');
                li.className = 'md-list-item md-card p-3 mb-2';
                const entryContentHTML = `
                    <div class="flex items-center justify-between gap-2">
                        <span class="md-body-large flex-grow">${formatDate(entry.dateTime)} ${entry.flow}L/min${fio2Mode ? ` FiO2:${entry.fio2}%` : ''}</span>
                        <div class="flex gap-1 flex-shrink-0 ml-auto">
                            <button class="btn-icon btn-sm" data-index="${index}" data-action="edit" title="修正"><span class="material-symbols-outlined">edit</span></button>
                            <button class="btn-icon btn-sm text-[var(--md-error)]" data-index="${index}" data-action="delete" title="削除"><span class="material-symbols-outlined">delete</span></button>
                        </div>
                    </div>
                `;
                const sanitizedEntryContent = DOMPurify.sanitize(entryContentHTML);
                li.appendChild(document.createRange().createContextualFragment(sanitizedEntryContent));
                entriesUl.appendChild(li);
            });
            entriesUl.onclick = (event) => {
                const target = event.target as HTMLElement;
                const button = target.closest('button'); // クリックされた要素またはその親からbutton要素を探す
                if (button) {
                    const index = parseInt(button.dataset.index ?? '-1', 10);
                    const action = button.dataset.action;
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
    } catch (error) {
        console.error('Error updating entries list:', error);
        displayError('エントリーリストの更新中にエラーが発生しました。');
    }

    const usageData = calculateUsage(entriesData, fio2Mode, noRoomAirMode);
    const usageUl = usageList();
    if (!usageUl) return;

    try {
        usageUl.innerHTML = ''; // Clear previous usage
        const sortedDates = Object.keys(usageData)
            .map(Number)
            .filter(key => !isNaN(key) && Object.prototype.hasOwnProperty.call(usageData, key))
            .sort((a, b) => a - b);

        if (sortedDates.length === 0 && entriesData.length > 0) {
            const li = document.createElement('li');
            li.className = 'text-center text-[var(--md-on-surface-variant)] py-4 md-body-medium';
            li.textContent = '計算中です...';
            usageUl.appendChild(li);
        } else if (sortedDates.length === 0) {
            const li = document.createElement('li');
            li.className = 'text-center text-[var(--md-on-surface-variant)] py-4 md-body-medium';
            li.textContent = '入力後に計算結果が表示されます';
            usageUl.appendChild(li);
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
                const usageContentHTML = `
                    <div class="flex items-center justify-between gap-2">
                        <span class="md-body-large flex-grow">${usageText}</span>
                        <button class="btn-icon btn-sm text-[var(--md-primary)] flex-shrink-0 ml-auto" data-oxygen="${oxygenUsageStr}" data-nitrogen="${nitrogenUsageStr}" data-action="copy" title="コピー"><span class="material-symbols-outlined">content_copy</span></button>
                    </div>
                `;
                const sanitizedUsageContent = DOMPurify.sanitize(usageContentHTML);
                li.appendChild(document.createRange().createContextualFragment(sanitizedUsageContent));
                usageUl.appendChild(li);
            });
            usageUl.onclick = (event) => {
                const target = event.target as HTMLElement;
                const button = target.closest('button'); // クリックされた要素またはその親からbutton要素を探す
                if (button && button.dataset.action === 'copy') {
                    const oxygen = button.dataset.oxygen ?? '0';
                    const nitrogen = button.dataset.nitrogen ?? '0';
                    copyUsageCallback(oxygen, nitrogen);
                }
            };
        }
    } catch (error) {
        console.error('Error updating usage list:', error);
        displayError('使用量リストの更新中にエラーが発生しました。');
    }
}

export function displayError(message: string): void {
  const snackbarEl = snackbar();
  const snackbarTextEl = snackbarText();
  const snackbarActionEl = snackbarAction();

  if (!snackbarEl || !snackbarTextEl || !snackbarActionEl) return;

  if (!message) {
    snackbarEl.classList.add('hidden');
    return;
  }
  
  snackbarTextEl.textContent = message;
  snackbarEl.classList.remove('hidden', 'bg-[var(--md-primary-container)]');
  snackbarEl.classList.add('bg-[var(--md-error-container)]');
  snackbarTextEl.classList.remove('text-[var(--md-on-primary-container)]');
  snackbarTextEl.classList.add('text-[var(--md-on-error-container)]');
  
  setTimeout(() => {
    snackbarEl.classList.add('hidden');
  }, 3000);
  
  snackbarActionEl.onclick = () => {
    snackbarEl.classList.add('hidden');
  };
}

export function displaySuccessMessage(message: string): void {
    const snackbarEl = snackbar();
    const snackbarTextEl = snackbarText();
    const snackbarActionEl = snackbarAction();

    if (!snackbarEl || !snackbarTextEl || !snackbarActionEl) return;
    
    if (!message) {
        snackbarEl.classList.add('hidden');
        return;
    }

    snackbarTextEl.textContent = message;
    snackbarEl.classList.remove('hidden', 'bg-[var(--md-error-container)]');
    snackbarEl.classList.add('bg-[var(--md-primary-container)]');
    snackbarTextEl.classList.remove('text-[var(--md-on-error-container)]');
    snackbarTextEl.classList.add('text-[var(--md-on-primary-container)]');

    setTimeout(() => {
        snackbarEl.classList.add('hidden');
        snackbarEl.classList.remove('bg-[var(--md-primary-container)]');
        snackbarEl.classList.add('bg-[var(--md-error-container)]');
        snackbarTextEl.classList.remove('text-[var(--md-on-primary-container)]');
        snackbarTextEl.classList.add('text-[var(--md-on-error-container)]');
    }, 3000);

    snackbarActionEl.onclick = () => {
        snackbarEl.classList.add('hidden');
        snackbarEl.classList.remove('bg-[var(--md-primary-container)]');
        snackbarEl.classList.add('bg-[var(--md-error-container)]');
        snackbarTextEl.classList.remove('text-[var(--md-on-primary-container)]');
        snackbarTextEl.classList.add('text-[var(--md-on-error-container)]');
    };
}

export function toggleSettings(event?: MouseEvent): void {
  const overlay = settingsOverlay();
  if (!overlay) return;

  if (event && event.target === overlay) {
    overlay.classList.add('hidden');
  } else if (!event) {
    overlay.classList.toggle('hidden');
  }
}

export function handleFio2ModeToggle(clearAllCallback: () => void): boolean {
  const fio2ModeCheckboxEl = fio2ModeCheckbox();
  const fio2InputGroupEl = fio2InputGroup();
  const noRoomAirModeCheckboxEl = noRoomAirModeCheckbox();

  if (!fio2ModeCheckboxEl || !fio2InputGroupEl || !noRoomAirModeCheckboxEl) return false;

  const isChecked = fio2ModeCheckboxEl.checked;
  fio2InputGroupEl.classList.toggle('hidden', !isChecked);
  noRoomAirModeCheckboxEl.disabled = !isChecked;

  if (!isChecked) {
    noRoomAirModeCheckboxEl.checked = false;
  }

  clearAllCallback();
  return isChecked;
}

export function handleNoRoomAirModeToggle(clearAllCallback: () => void): boolean {
  const noRoomAirModeCheckboxEl = noRoomAirModeCheckbox();
  if (!noRoomAirModeCheckboxEl) return false;

  const isChecked = noRoomAirModeCheckboxEl.checked;
  clearAllCallback();
  return isChecked;
}

export function clearInputFields(): void {
    const dtInput = dateTimeInput();
    const flInput = flowInput();
    const fiO2InputEl = fio2Input();

    if (dtInput) dtInput.value = '';
    if (flInput) flInput.value = '';
    if (fiO2InputEl) fiO2InputEl.value = '';
    
    displayError('');
    if (dtInput) dtInput.focus();
}

export function populateInputFieldsForEdit(entry: Entry, fio2Mode: boolean): void {
    const dtInput = dateTimeInput();
    const flInput = flowInput();
    const fiO2InputEl = fio2Input();

    if (dtInput) dtInput.value = formatDateForInput(entry.dateTime);
    if (flInput) flInput.value = String(entry.flow);
    if (fio2Mode && fiO2InputEl) {
        fiO2InputEl.value = String(entry.fio2);
    }
}

function sanitizeErrorMessage(error: unknown): string {
    let message = '不明なエラーが発生しました。';
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    }
    return message.replace(/[\n\r]/g, ' ').replace(/[<>&"']/g, (match) => {
        switch (match) {
            case '<': return '<';
            case '>': return '>';
            case '&': return '&';
            case '"': return '"';
            case "'": return '&#x27;';
            default: return match;
        }
    });
}

export function copyUsageToClipboard(oxygenUsage: string, nitrogenUsage: string, noRoomAirMode: boolean): void {
    let text = `402400+552010/${oxygenUsage}*1`;
    if (noRoomAirMode && parseFloat(nitrogenUsage) > 0) {
        text += `\n402400+552010/${nitrogenUsage}*1`;
    }
    navigator.clipboard.writeText(text)
        .then(() => {
            displaySuccessMessage("クリップボードにコピーしました");
        })
        .catch(err => {
            console.error(`コピーに失敗しました: ${sanitizeErrorMessage(err)}`);
            displayError("クリップボードへのコピーに失敗しました");
        });
}
