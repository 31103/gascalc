<script lang="ts">
  import type { Entry } from "../types/entry.ts";
  import { formatDate, formatDateForInput } from "../utils/calculation.ts";

  export let entries: Entry[];
  export let fio2Mode: boolean;
  export let editingIndex: number | null;
  export let onEdit: (index: number) => void;
  export let onDelete: (index: number) => void;
  export let onSave: (
    index: number,
    dateTime: string,
    flow: string,
    fio2: string,
  ) => void;
  export let onCancel: () => void;
</script>

<ul class="space-y-2">
  {#if entries.length === 0}
    <li class="empty-message">まだ入力がありません</li>
  {:else}
    {#each entries as entry, index}
      <li class="md-list-item md-card p-3 mb-2">
        {#if editingIndex === index}
          <form
            class="edit-form"
            on:submit|preventDefault={(event) => {
              const form = event.currentTarget;
              const data = new FormData(form);
              onSave(
                index,
                String(data.get("dateTime") ?? ""),
                String(data.get("flow") ?? ""),
                String(data.get("fio2") ?? ""),
              );
            }}
          >
            <input
              class="input-field"
              name="dateTime"
              aria-label="編集する日付時刻"
              value={formatDateForInput(entry.dateTime)}
              inputmode="numeric"
              required
            />
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
            {#if fio2Mode}
              <input
                class="input-field"
                name="fio2"
                aria-label="編集するFiO2"
                type="number"
                min="21"
                max="100"
                value={entry.fio2}
                required
              />
            {/if}
            <div class="edit-actions">
              <button class="btn-icon primary" type="submit" title="保存" aria-label="保存">
                <span class="material-symbols-outlined">save</span>
              </button>
              <button class="btn-icon" type="button" on:click={onCancel} title="キャンセル" aria-label="キャンセル">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </form>
        {:else}
          <div class="list-row">
            <span class="md-body-large flex-grow">
              {formatDate(entry.dateTime)} {entry.flow}L/min
              {#if fio2Mode} FiO2:{entry.fio2}%{/if}
            </span>
            <div class="list-actions">
              <button class="btn-icon" on:click={() => onEdit(index)} title="修正" aria-label="修正">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="btn-icon danger" on:click={() => onDelete(index)} title="削除" aria-label="削除">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        {/if}
      </li>
    {/each}
  {/if}
</ul>
