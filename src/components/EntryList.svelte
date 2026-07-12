<script lang="ts">
  import type { Entry } from "../types/entry.ts";
  import { formatDate } from "../utils/calculation.ts";

  export let entries: Entry[];
  export let fio2Mode: boolean;
  export let onEdit: (index: number) => void;
  export let onDelete: (index: number) => void;
</script>

<ul class="space-y-2">
  {#if entries.length === 0}
    <li
      class="text-center text-[var(--md-on-surface-variant)] py-4 md-body-medium"
    >
      まだ入力がありません
    </li>
  {:else}
    {#each entries as entry, index}
      <li class="md-list-item md-card p-3 mb-2">
        <div class="flex items-center justify-between gap-2">
          <span class="md-body-large flex-grow">
            {formatDate(entry.dateTime)}
            {entry.flow}L/min
            {#if fio2Mode}
              FiO2:{entry.fio2}%
            {/if}
          </span>
          <div class="flex gap-1 flex-shrink-0 ml-auto">
            <button
              class="btn-icon btn-sm"
              on:click={() => onEdit(index)}
              title="修正"
              aria-label="修正"
            >
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button
              class="btn-icon btn-sm text-[var(--md-error)]"
              on:click={() => onDelete(index)}
              title="削除"
              aria-label="削除"
            >
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </li>
    {/each}
  {/if}
</ul>
