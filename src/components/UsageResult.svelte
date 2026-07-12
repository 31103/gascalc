<script lang="ts">
  import { copyText, formatUsageForClipboard } from "../utils/clipboard.ts";
  import type { DailyUsage } from "../utils/calculation.ts";

  interface Props {
    usageData: Record<number, DailyUsage>;
    noRoomAirMode: boolean;
    notify: (message: string, kind: "success" | "error") => void;
  }
  let { usageData, noRoomAirMode, notify }: Props = $props();

  let sortedDates = $derived(Object.keys(usageData).map(Number).sort((a, b) => a - b));

  async function copyUsage(oxygen: number, nitrogen: number) {
    const text = formatUsageForClipboard(oxygen, nitrogen, noRoomAirMode);
    const copied = await copyText(text);
    notify(
      copied ? "クリップボードにコピーしました" : "コピーに失敗しました",
      copied ? "success" : "error",
    );
  }
</script>

<ul class="space-y-2">
  {#if sortedDates.length === 0}
    <li class="empty-message">(入力後に計算結果が表示されます)</li>
  {:else}
    {#each sortedDates as date}
      {@const amounts = usageData[date]}
      <li class="md-list-item md-card p-3 mb-2">
        <div class="list-row">
          <span class="md-body-large flex-grow">
            {date}日: 酸素 {amounts.oxygen}L
            {#if noRoomAirMode && amounts.nitrogen > 0} / 窒素 {amounts.nitrogen}L{/if}
          </span>
          <button class="btn-icon primary" onclick={() => copyUsage(amounts.oxygen, amounts.nitrogen)} title="コピー" aria-label="コピー">
            <span class="material-symbols-outlined">content_copy</span>
          </button>
        </div>
      </li>
    {/each}
  {/if}
</ul>
