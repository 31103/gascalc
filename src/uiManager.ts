import type { Entry, Usage } from './types.ts';
import { EntryManager } from './entryManager.ts';
import { SettingsManager } from './settingsManager.ts';
import { formatDate } from './utils.ts';
import { generateUsageText } from './calculator.ts';

/**
 * Manages the UI and user interactions
 */
export class UIManager {
  private entriesList: HTMLUListElement;
  private usageList: HTMLUListElement;
  private errorElement: HTMLDivElement;
  private dateTimeInput: HTMLInputElement;
  private flowInput: HTMLInputElement;
  private fio2Input: HTMLInputElement;

  /**
   * Constructor
   * @param entryManager - Entry manager instance
   * @param settingsManager - Settings manager instance
   */
  constructor(
    private entryManager: EntryManager,
    private settingsManager: SettingsManager
  ) {
    this.entriesList = document.getElementById('entries') as HTMLUListElement;
    this.usageList = document.getElementById('usage') as HTMLUListElement;
    this.errorElement = document.getElementById('error') as HTMLDivElement;
    this.dateTimeInput = document.getElementById('dateTime') as HTMLInputElement;
    this.flowInput = document.getElementById('flow') as HTMLInputElement;
    this.fio2Input = document.getElementById('fio2Input') as HTMLInputElement;
    
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    const addButton = document.getElementById('addButton');
    const clearButton = document.getElementById('clearButton');

    if (addButton) {
      addButton.addEventListener('click', () => this.addEntry());
    }

    if (clearButton) {
      clearButton.addEventListener('click', () => this.clearAll());
    }

    // Enter key handling
    this.dateTimeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.flowInput.focus();
      }
    });

    this.flowInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const settings = this.settingsManager.getSettings();
        if (settings.fio2Mode) {
          this.fio2Input.focus();
        } else {
          this.addEntry();
        }
      }
    });

    this.fio2Input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addEntry();
      }
    });
  }

  /**
   * Update the UI with current entries and usage data
   */
  updateUI(): void {
    const settings = this.settingsManager.getSettings();
    this.updateEntriesList(settings.fio2Mode);
    this.updateUsageList(settings.noRoomAirMode);
  }

  /**
   * Update the entries list UI
   * @param fio2Mode - Whether FiO2 mode is enabled
   */
  private updateEntriesList(fio2Mode: boolean): void {
    this.entriesList.innerHTML = '';
    
    this.entryManager.getEntries().forEach((entry, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${formatDate(entry.dateTime)} ${entry.flow}L/min${fio2Mode ? ` FiO2:${entry.fio2}%` : ''}</span>
        <div class="action-buttons">
          <button class="edit-btn">修正</button>
          <button class="delete-btn">削除</button>
        </div>
      `;
      
      // Add event listeners to buttons
      const editBtn = li.querySelector('.edit-btn');
      const deleteBtn = li.querySelector('.delete-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', () => this.editEntry(index));
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => this.deleteEntry(index));
      }
      
      this.entriesList.appendChild(li);
    });
  }

  /**
   * Update the usage list UI
   * @param noRoomAirMode - Whether no room air mode is enabled
   */
  private updateUsageList(noRoomAirMode: boolean): void {
    const settings = this.settingsManager.getSettings();
    const usage = this.entryManager.calculateUsage(settings.fio2Mode, settings.noRoomAirMode);
    
    this.usageList.innerHTML = '';
    
    Object.entries(usage).forEach(([date, amounts]) => {
      const oxygenUsage = amounts.oxygen % 1 === 0 ? Math.floor(amounts.oxygen) : amounts.oxygen.toFixed(1);
      const nitrogenUsage = amounts.nitrogen % 1 === 0 ? Math.floor(amounts.nitrogen) : amounts.nitrogen.toFixed(1);
      
      const li = document.createElement('li');
      li.innerHTML = `${date}日: 酸素 ${oxygenUsage}L${noRoomAirMode ? ` / 窒素 ${nitrogenUsage}L` : ''}
      <div class="action-buttons">
        <button class="copy-btn">コピー</button>
      </div>`;
      
      // Add event listener to copy button
      const copyBtn = li.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => this.copyUsage(oxygenUsage, nitrogenUsage));
      }
      
      this.usageList.appendChild(li);
    });
  }

  /**
   * Add a new entry
   */
  addEntry(): void {
    const settings = this.settingsManager.getSettings();
    const result = this.entryManager.addEntry(
      this.dateTimeInput.value,
      this.flowInput.value,
      this.fio2Input.value,
      settings.fio2Mode
    );
    
    if (!result.success) {
      this.showError(result.error || '');
      return;
    }
    
    this.clearError();
    this.updateUI();
    this.clearInputs();
    this.dateTimeInput.focus();
  }

  /**
   * Delete an entry
   * @param index - Index of entry to delete
   */
  private deleteEntry(index: number): void {
    this.entryManager.deleteEntry(index);
    this.updateUI();
  }

  /**
   * Edit an entry
   * @param index - Index of entry to edit
   */
  private editEntry(index: number): void {
    const entry = this.entryManager.getEntry(index);
    if (!entry) return;
    
    this.dateTimeInput.value = `${entry.dateTime.getDate()}${entry.dateTime.getHours().toString().padStart(2, '0')}${entry.dateTime.getMinutes().toString().padStart(2, '0')}`;
    this.flowInput.value = entry.flow.toString();
    
    const settings = this.settingsManager.getSettings();
    if (settings.fio2Mode) {
      this.fio2Input.value = entry.fio2.toString();
    }
    
    this.entryManager.deleteEntry(index);
    this.updateUI();
  }

  /**
   * Clear all data and reset UI
   */
  clearAll(): void {
    this.entryManager.clearEntries();
    this.clearError();
    this.clearInputs();
    this.updateUI();
    this.dateTimeInput.focus();
  }

  /**
   * Show error message
   * @param message - Error message to show
   */
  showError(message: string): void {
    this.errorElement.textContent = message;
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorElement.textContent = '';
  }

  /**
   * Clear input fields
   */
  clearInputs(): void {
    this.dateTimeInput.value = '';
    this.flowInput.value = '';
    this.fio2Input.value = '';
  }

  /**
   * Copy usage data to clipboard
   * @param oxygenUsage - Oxygen usage amount
   * @param nitrogenUsage - Nitrogen usage amount
   */
  private copyUsage(oxygenUsage: string | number, nitrogenUsage: string | number): void {
    const settings = this.settingsManager.getSettings();
    const text = generateUsageText(Number(oxygenUsage), Number(nitrogenUsage), settings.noRoomAirMode);
    
    navigator.clipboard.writeText(text)
      .then(() => {
        // Success - could show a toast message here
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  }
}