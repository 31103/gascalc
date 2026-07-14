<script lang="ts">
  import type { CalculationMode, Entry } from "../types/entry.ts";
  import { CALCULATION_MODES, calculationModeLabel, isFio2CalculationMode } from "../types/entry.ts";
  import { formatBillingDateTime, formatBillingDateTimeForInput } from "../utils/billingDateTime.ts";

  interface Props {
    entries: Entry[];
    editingIndex: number | null;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
    onSave: (index: number, dateTime: string, flow: string, fio2: string, mode: CalculationMode) => void;
    onCancel: () => void;
  }
  let { entries, editingIndex, onEdit, onDelete, onSave, onCancel }: Props = $props();
  let editingMode: CalculationMode = $state("standard");

  $effect(() => {
    if (editingIndex !== null) {
      editingMode = entries[editingIndex]?.mode ?? "standard";
    }
  });
</script>

<ul class="space-y-2">
  {#if entries.length === 0}
    <li class="empty-message">まだ入力がありません</li>
  {:else}
    {#each entries as entry, index}
      <li class:editing={editingIndex === index} class="entry-card md-card">
        {#if editingIndex === index}
          <form
            class="edit-form"
            onsubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              onSave(
                index,
                String(data.get("dateTime") ?? ""),
                String(data.get("flow") ?? ""),
                String(data.get("fio2") ?? ""),
                String(data.get("mode") ?? "standard") as CalculationMode,
              );
            }}
          >
            <div class="edit-form-heading">
              <div><span class="material-symbols-outlined">edit</span><strong>使用条件を修正</strong></div>
              <span>{formatBillingDateTime(entry.dateTime)}</span>
            </div>
            <div class="edit-field-grid">
              <label>
                <span>日付時刻 <small>DDHHMM</small></span>
                <input
                  class="input-field"
                  name="dateTime"
                  aria-label="編集する日付時刻"
                  value={formatBillingDateTimeForInput(entry.dateTime)}
                  inputmode="numeric"
                  required
                />
              </label>
              <label>
                <span>{isFio2CalculationMode(editingMode) ? "総流量" : "酸素流量"} <small>L/min</small></span>
                <input
                  class="input-field"
                  name="flow"
                  aria-label="編集する流量"
                  type="number"
                  min="0"
                  step="0.1"
                  value={entry.flow}
                  required
                />
              </label>
              <label class="edit-mode-field">
                <span>計算方式</span>
                <select class="input-field" name="mode" aria-label="編集する計算モード" bind:value={editingMode}>
                  {#each CALCULATION_MODES as mode}
                    <option value={mode}>{calculationModeLabel(mode)}</option>
                  {/each}
                </select>
              </label>
              {#if isFio2CalculationMode(editingMode)}
                <label>
                  <span>設定酸素濃度 <small>%</small></span>
                  <input
                    class="input-field"
                    name="fio2"
                    aria-label="編集する設定酸素濃度"
                    type="number"
                    min="21"
                    max="100"
                    value={entry.fio2}
                    required
                  />
                </label>
              {/if}
            </div>
            <div class="edit-actions">
              <button class="btn-text" type="button" onclick={onCancel} aria-label="キャンセル"><span class="material-symbols-outlined">close</span>キャンセル</button>
              <button class="btn-filled" type="submit" aria-label="保存"><span class="material-symbols-outlined">save</span>保存</button>
            </div>
          </form>
        {:else}
          <div class="entry-summary">
            <div class="entry-details">
              <strong class="entry-time">{formatBillingDateTime(entry.dateTime)}</strong>
              <div class="entry-metadata">
                <span>{isFio2CalculationMode(entry.mode) ? "総流量" : "酸素流量"} <strong>{entry.flow} L/min</strong></span>
                {#if isFio2CalculationMode(entry.mode)}<span>設定酸素濃度 <strong>{entry.fio2}%</strong></span>{/if}
              </div>
              <span class="mode-badge">{calculationModeLabel(entry.mode)}</span>
            </div>
            <div class="entry-actions">
              <button class="btn-icon" onclick={() => onEdit(index)} title="修正" aria-label={`${formatBillingDateTime(entry.dateTime)}の入力を修正`}>
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="btn-icon danger" onclick={() => onDelete(index)} title="削除" aria-label={`${formatBillingDateTime(entry.dateTime)}の入力を削除`}>
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        {/if}
      </li>
    {/each}
  {/if}
</ul>
