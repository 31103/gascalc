<script lang="ts">
  import type { DailyUsage } from "../utils/calculation.ts";

  export let usageData: Record<number, DailyUsage>;
  export let noRoomAirMode: boolean;

  $: sortedDates = Object.keys(usageData)
    .map(Number)
    .sort((a, b) => a - b);

  function copyUsage(oxygen: number, nitrogen: number) {
    const oxygenUsageStr =
      oxygen % 1 === 0 ? String(oxygen) : oxygen.toFixed(1);
    const nitrogenUsageStr =
      nitrogen % 1 === 0 ? String(nitrogen) : nitrogen.toFixed(1);

    let text = `402400+552010/${oxygenUsageStr}*1`;
    if (noRoomAirMode && nitrogen > 0) {
      text += `\n402400+552010/${nitrogenUsageStr}*1`;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => alert("クリップボードにコピーしました"))
      .catch((err) => console.error("コピーに失敗しました", err));
  }
</script>

<ul class="space-y-2">
  {#if sortedDates.length === 0}
    <li
      class="text-center text-[var(--md-on-surface-variant)] py-4 md-body-medium"
    >
      (入力後に計算結果が表示されます)
    </li>
  {:else}
    {#each sortedDates as date}
      {@const amounts = usageData[date]}
      {@const oxygenUsageStr =
        amounts.oxygen % 1 === 0
          ? String(amounts.oxygen)
          : amounts.oxygen.toFixed(1)}
      {@const nitrogenUsageStr =
        amounts.nitrogen % 1 === 0
          ? String(amounts.nitrogen)
          : amounts.nitrogen.toFixed(1)}

      <li class="md-list-item md-card p-3 mb-2">
        <div class="flex items-center justify-between gap-2">
          <span class="md-body-large flex-grow">
            {date}日: 酸素 {oxygenUsageStr}L
            {#if noRoomAirMode && amounts.nitrogen > 0}
              / 窒素 {nitrogenUsageStr}L
            {/if}
          </span>
          <button
            class="btn-icon btn-sm text-[var(--md-primary)] flex-shrink-0 ml-auto"
            on:click={() => copyUsage(amounts.oxygen, amounts.nitrogen)}
            title="コピー"
            aria-label="コピー"
          >
            <span class="material-symbols-outlined">content_copy</span>
          </button>
        </div>
      </li>
    {/each}
  {/if}
</ul>
