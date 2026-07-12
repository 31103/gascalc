<script lang="ts">
  export let isOpen: boolean;
  export let darkMode: boolean;
  export let fio2Mode: boolean;
  export let noRoomAirMode: boolean;
  export let close: () => void;
  export let onDarkModeChange: (enabled: boolean) => void;
  export let onFio2ModeChange: (enabled: boolean) => void;
  export let onNoRoomAirModeChange: (enabled: boolean) => void;

  function onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) close();
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="dialog-overlay" on:click={onOverlayClick} id="settingsOverlay">
    <div class="md-dialog" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
      <div class="dialog-header">
        <h2 id="settingsTitle" class="md-headline-small">設定</h2>
        <button class="btn-icon" on:click={close} title="閉じる" aria-label="閉じる">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="settings-list">
        <label class="setting-row">
          <span><strong>ダークモード</strong><small>暗い配色に切り替え</small></span>
          <input id="darkMode" type="checkbox" checked={darkMode} on:change={(event) => onDarkModeChange(event.currentTarget.checked)} />
        </label>
        <label class="setting-row">
          <span><strong>FiO2モード</strong><small>FiO2を指定して計算</small></span>
          <input id="fio2Mode" type="checkbox" checked={fio2Mode} on:change={(event) => onFio2ModeChange(event.currentTarget.checked)} />
        </label>
        <label class="setting-row">
          <span><strong>室内気不使用</strong><small>配管からの合成空気を使用</small></span>
          <input id="noRoomAirMode" type="checkbox" checked={noRoomAirMode} disabled={!fio2Mode} on:change={(event) => onNoRoomAirModeChange(event.currentTarget.checked)} />
        </label>
      </div>

      <div class="dialog-actions">
        <button class="btn-text" on:click={close} id="settingsCloseBtn2">閉じる</button>
      </div>
    </div>
  </div>
{/if}
