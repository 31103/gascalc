<script lang="ts">
  import { tick } from "svelte";
  import type { Entry } from "../types/entry.ts";
  import type { OxygenMeasurement, OxygenMeasurementKind } from "../types/pfRatio.ts";
  import { formatBillingDateTimeForInput, parseBillingDateTime } from "../utils/billingDateTime.ts";

  interface Props {
    isOpen: boolean;
    entries: Entry[];
    measurements: OxygenMeasurement[];
    editingMeasurement: OxygenMeasurement | null;
    close: () => void;
    save: (measurement: OxygenMeasurement, original: OxygenMeasurement | null) => void;
    returnFocusTo?: HTMLElement;
  }

  let {
    isOpen,
    entries,
    measurements,
    editingMeasurement,
    close,
    save,
    returnFocusTo,
  }: Props = $props();

  let dateTimeStr = $state("");
  let kind: OxygenMeasurementKind = $state("pao2");
  let valueStr = $state("");
  let dateTimeError = $state("");
  let valueError = $state("");
  let dialog = $state<HTMLDivElement>();

  $effect(() => {
    if (!isOpen) return;
    dateTimeStr = editingMeasurement
      ? formatBillingDateTimeForInput(editingMeasurement.dateTime)
      : "";
    kind = editingMeasurement?.kind ?? "pao2";
    valueStr = editingMeasurement ? String(editingMeasurement.value) : "";
    dateTimeError = "";
    valueError = "";
  });

  function focusOnMount(node: HTMLElement) {
    node.focus();
  }

  function closeDialog() {
    close();
    void tick().then(() => returnFocusTo?.focus());
  }

  function submitMeasurement() {
    dateTimeError = "";
    valueError = "";
    const fallbackDay =
      measurements.at(-1)?.dateTime.day ?? entries.at(-1)?.dateTime.day ?? 1;
    const dateTime = parseBillingDateTime(dateTimeStr.trim(), fallbackDay);
    if (!dateTime) {
      dateTimeError = "日付時刻をDDHHMMまたはHHMMの数字で入力してください（例：2日9時7分は20907）。";
    }

    const rawValue = String(valueStr).trim();
    const value = Number(rawValue);
    if (!rawValue || !Number.isFinite(value)) {
      valueError = `${kind === "pao2" ? "PaO2" : "SpO2"}を数字で入力してください。`;
    } else if (kind === "pao2" && value <= 0) {
      valueError = "PaO2は0より大きい値を入力してください。";
    } else if (kind === "spo2" && (value < 70 || value > 99)) {
      valueError = "SpO2は70〜99%の範囲で入力してください。範囲外ではPaO2を安全に推定できません。";
    }
    if (!dateTime || dateTimeError || valueError) return;

    save({ dateTime, kind, value }, editingMeasurement);
    closeDialog();
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
        'button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
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
  <div class="dialog-overlay" onclick={onOverlayClick} role="presentation">
    <div
      class="md-dialog pf-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pfDialogTitle"
      tabindex="-1"
      bind:this={dialog}
      onkeydown={onDialogKeydown}
    >
      <div class="dialog-header">
        <div>
          <h2 id="pfDialogTitle" class="md-headline-small">
            {editingMeasurement ? "P/F比の測定を修正" : "P/F比を計算"}
          </h2>
          <p class="helper-text mt-1">酸素量を入力した時刻に合わせて測定値を登録します。</p>
        </div>
        <button class="btn-icon" onclick={closeDialog} title="閉じる" aria-label="P/F比入力を閉じる">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form class="space-y-5" onsubmit={(event) => { event.preventDefault(); submitMeasurement(); }} novalidate>
        <div>
          <label class="field-label" for="pfDateTime">1. 日付時刻</label>
          <input
            use:focusOnMount
            id="pfDateTime"
            class:input-error={Boolean(dateTimeError)}
            class="input-field"
            inputmode="numeric"
            placeholder="例：20907"
            aria-describedby="pfDateTimeHelp pfDateTimeError"
            aria-invalid={Boolean(dateTimeError)}
            bind:value={dateTimeStr}
          />
          <p id="pfDateTimeHelp" class="helper-text">DDHHMMまたはHHMM（2日9時7分は20907）</p>
          {#if dateTimeError}<p id="pfDateTimeError" class="field-error">{dateTimeError}</p>{/if}
        </div>

        <fieldset>
          <legend class="field-label">2. 検査・測定方法</legend>
          <label class="measurement-option compact">
            <input type="radio" name="measurementKind" value="pao2" bind:group={kind} />
            <span><strong>動脈血 PaO2</strong><small>動脈血ガス分析で測る酸素分圧</small></span>
          </label>
          <label class="measurement-option compact">
            <input type="radio" name="measurementKind" value="spo2" bind:group={kind} />
            <span><strong>SpO2</strong><small>指などで測る酸素飽和度</small></span>
          </label>
          <p class="helper-text mt-2">静脈血ガス分析のPO2からはP/F比を計算できません。</p>
        </fieldset>

        <div>
          <label class="field-label" for="pfValue">3. {kind === "pao2" ? "PaO2" : "SpO2"}の値</label>
          <div class="unit-input">
            <input
              id="pfValue"
              type="number"
              step={kind === "pao2" ? "0.1" : "1"}
              class:input-error={Boolean(valueError)}
              class="input-field"
              placeholder={kind === "pao2" ? "例：80" : "70〜99"}
              aria-describedby="pfValueHelp pfValueError"
              aria-invalid={Boolean(valueError)}
              bind:value={valueStr}
            />
            <span>{kind === "pao2" ? "mmHg" : "%"}</span>
          </div>
          <p id="pfValueHelp" class="helper-text">
            {kind === "pao2" ? "検査結果に記載された動脈血の値" : "70〜99%の範囲。PaO2はこの値から推定します。"}
          </p>
          {#if valueError}<p id="pfValueError" class="field-error">{valueError}</p>{/if}
        </div>

        <details class="calculation-details compact">
          <summary>計算方法について</summary>
          <p>P/F比はPaO2をFiO2（小数）で割ります。SpO2からのPaO2と酸素流量からのFiO2は概算です。</p>
          <p>結果はレセプト作成時の確認補助であり、診断や治療判断を目的としたものではありません。</p>
        </details>

        <div class="dialog-actions gap-2">
          <button class="btn-text" type="button" onclick={closeDialog}>キャンセル</button>
          <button class="btn-filled" type="submit">{editingMeasurement ? "編集を保存" : "計算する"}</button>
        </div>
      </form>
    </div>
  </div>
{/if}
