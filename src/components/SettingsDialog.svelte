<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    isOpen: boolean;
    darkMode: boolean;
    close: () => void;
    returnFocusTo?: HTMLElement;
    onDarkModeChange: (enabled: boolean) => void;
  }

  let {
    isOpen = $bindable(),
    darkMode,
    close,
    returnFocusTo,
    onDarkModeChange,
  }: Props = $props();
  let dialog = $state<HTMLDivElement>();
  function focusOnMount(node: HTMLElement) {
    node.focus();
  }

  function closeDialog() {
    close();
    void tick().then(() => returnFocusTo?.focus());
  }

  function onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) closeDialog();
  }

  function onDialogKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
</script>

{#if isOpen}
  <div class="dialog-overlay" onclick={onOverlayClick} id="settingsOverlay" role="presentation">
    <div
      class="md-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settingsTitle"
      tabindex="-1"
      bind:this={dialog}
      onkeydown={onDialogKeydown}
    >
      <div class="dialog-header">
        <h2 id="settingsTitle" class="md-headline-small">設定</h2>
        <button use:focusOnMount class="btn-icon" onclick={closeDialog} title="閉じる" aria-label="閉じる">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="settings-list">
        <label class="setting-row">
          <span><strong>ダークモード</strong><small>暗い配色に切り替え</small></span>
          <input aria-label="ダークモード" id="darkMode" type="checkbox" checked={darkMode} onchange={(event) => onDarkModeChange(event.currentTarget.checked)} />
        </label>
      </div>

      <div class="dialog-actions">
        <button class="btn-text" onclick={closeDialog} id="settingsCloseBtn2">閉じる</button>
      </div>
    </div>
  </div>
{/if}
