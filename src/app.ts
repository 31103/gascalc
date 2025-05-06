import { EntryManager } from './entryManager.ts';
import { SettingsManager } from './settingsManager.ts';
import { UIManager } from './uiManager.ts';

/**
 * Main application entry point
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all managers
  const entryManager = new EntryManager();
  const settingsManager = new SettingsManager();
  const uiManager = new UIManager(entryManager, settingsManager);
  
  // Initialize UI
  settingsManager.initUI();
  uiManager.updateUI();
});