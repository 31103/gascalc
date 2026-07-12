<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    close: () => void;
    confirm: () => void;
    returnFocusTo?: HTMLElement;
  }

  let { isOpen, title, message, confirmLabel = "実行する", close, confirm, returnFocusTo }: Props = $props();
  let dialog = $state<HTMLDivElement>();

  function focusOnMount(node: HTMLElement) {
    node.focus();
  }

  function closeDialog() {
    const focusTarget = returnFocusTo;
    close();
    void tick().then(() => focusTarget?.focus());
  }

  function confirmDialog() {
    confirm();
    close();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(dialog?.querySelectorAll<HTMLElement>("button") ?? []);
    if (controls.length < 2) return;
    if (event.shiftKey && document.activeElement === controls[0]) {
      event.preventDefault();
      controls.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
      event.preventDefault();
      controls[0].focus();
    }
  }
</script>

{#if isOpen}
  <div class="dialog-overlay sheet-overlay" role="presentation" onclick={(event) => event.target === event.currentTarget && closeDialog()}>
    <div use:focusOnMount class="md-dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle" aria-describedby="confirmMessage" tabindex="-1" bind:this={dialog} onkeydown={onKeydown}>
      <div class="dialog-icon danger"><span class="material-symbols-outlined">warning</span></div>
      <h2 id="confirmTitle" class="md-headline-small">{title}</h2>
      <p id="confirmMessage" class="dialog-copy">{message}</p>
      <div class="dialog-actions gap-2">
        <button class="btn-text" type="button" onclick={closeDialog}>キャンセル</button>
        <button class="btn-filled danger" type="button" onclick={confirmDialog}>{confirmLabel}</button>
      </div>
    </div>
  </div>
{/if}
