import type { Settings } from './types.ts';

/**
 * Manages application settings
 */
export class SettingsManager {
  private settings: Settings = {
    fio2Mode: false,
    noRoomAirMode: false,
  };

  private fio2ModeElement: HTMLInputElement;
  private noRoomAirModeElement: HTMLInputElement;
  private settingsOverlayElement: HTMLDivElement;
  private fio2InputGroupElement: HTMLDivElement;

  /**
   * Constructor
   */
  constructor() {
    this.fio2ModeElement = document.getElementById('fio2Mode') as HTMLInputElement;
    this.noRoomAirModeElement = document.getElementById('noRoomAirMode') as HTMLInputElement;
    this.settingsOverlayElement = document.getElementById('settingsOverlay') as HTMLDivElement;
    this.fio2InputGroupElement = document.getElementById('fio2InputGroup') as HTMLDivElement;
    
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for settings elements
   */
  private setupEventListeners(): void {
    const settingsToggle = document.getElementById('settingsToggle');
    const closeSettings = document.getElementById('closeSettings');
    
    if (settingsToggle) {
      settingsToggle.addEventListener('click', () => this.toggleSettingsOverlay());
    }
    
    if (closeSettings) {
      closeSettings.addEventListener('click', () => this.toggleSettingsOverlay());
    }
    
    this.fio2ModeElement.addEventListener('change', () => this.toggleFio2Mode());
    this.noRoomAirModeElement.addEventListener('change', () => this.toggleNoRoomAirMode());
  }

  /**
   * Toggle settings overlay visibility
   */
  toggleSettingsOverlay(): void {
    if (this.settingsOverlayElement.style.display === 'block') {
      this.settingsOverlayElement.style.display = 'none';
    } else {
      this.settingsOverlayElement.style.display = 'block';
    }
  }

  /**
   * Toggle FiO2 mode
   * @returns Current settings
   */
  toggleFio2Mode(): Settings {
    this.settings.fio2Mode = this.fio2ModeElement.checked;
    this.fio2InputGroupElement.style.display = this.settings.fio2Mode ? 'flex' : 'none';

    // FiO2モードが無効になった場合、室内気不使用モードも無効にする
    if (!this.settings.fio2Mode) {
      this.settings.noRoomAirMode = false;
      this.noRoomAirModeElement.checked = false;
    }

    // 室内気不使用モードは、FiO2モードが有効な場合のみ設定可能
    this.noRoomAirModeElement.disabled = !this.settings.fio2Mode;
    
    return this.getSettings();
  }

  /**
   * Toggle no room air mode
   * @returns Current settings
   */
  toggleNoRoomAirMode(): Settings {
    this.settings.noRoomAirMode = this.noRoomAirModeElement.checked;
    return this.getSettings();
  }

  /**
   * Initialize settings UI based on current settings
   */
  initUI(): void {
    // Apply settings to UI elements
    this.fio2ModeElement.checked = this.settings.fio2Mode;
    this.noRoomAirModeElement.checked = this.settings.noRoomAirMode;
    this.noRoomAirModeElement.disabled = !this.settings.fio2Mode;
    this.fio2InputGroupElement.style.display = this.settings.fio2Mode ? 'flex' : 'none';
  }

  /**
   * Get current settings
   * @returns Current settings object
   */
  getSettings(): Settings {
    return { ...this.settings };
  }
}