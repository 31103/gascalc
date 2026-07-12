<script lang="ts">
  import type { Entry } from "../types/entry.ts";
  import type { OxygenMeasurement } from "../types/pfRatio.ts";
  import { formatBillingDateTime } from "../utils/billingDateTime.ts";
  import { copyText, formatUsageForClipboard } from "../utils/clipboard.ts";
  import type { DailyUsage } from "../utils/calculation.ts";
  import { calculatePfRatio } from "../utils/pfRatio.ts";

  interface Props {
    usageData: Record<number, DailyUsage>;
    noRoomAirMode: boolean;
    entries: Entry[];
    fio2Mode: boolean;
    measurements: OxygenMeasurement[];
    notify: (message: string, kind: "success" | "error") => void;
    onEditMeasurement: (measurement: OxygenMeasurement) => void;
    onDeleteMeasurement: (measurement: OxygenMeasurement) => void;
  }
  let {
    usageData,
    noRoomAirMode,
    entries,
    fio2Mode,
    measurements,
    notify,
    onEditMeasurement,
    onDeleteMeasurement,
  }: Props = $props();

  const pfResults = $derived(
    measurements.map((measurement) => calculatePfRatio(measurement, entries, fio2Mode)),
  );
  const sortedDays = $derived(
    Array.from(
      new Set([
        ...Object.keys(usageData).map(Number),
        ...measurements.map((measurement) => measurement.dateTime.day),
      ]),
    ).sort((left, right) => left - right),
  );

  async function copyUsage(oxygen: number, nitrogen: number) {
    const text = formatUsageForClipboard(oxygen, nitrogen, noRoomAirMode);
    const copied = await copyText(text);
    notify(
      copied ? "クリップボードにコピーしました" : "コピーに失敗しました",
      copied ? "success" : "error",
    );
  }
</script>

<ul class="space-y-3">
  {#if sortedDays.length === 0}
    <li class="empty-message">(入力後に計算結果が表示されます)</li>
  {:else}
    {#each sortedDays as day}
      {@const amounts = usageData[day]}
      {@const dayPfResults = pfResults.filter((result) => result.measurement.dateTime.day === day)}
      <li class="result-day-group">
        <h3 class="result-day-heading">{day}日</h3>

        {#if amounts}
          <div class="md-card p-3 mb-2">
            <div class="list-row">
              <span class="md-body-large flex-grow">
                酸素 {amounts.oxygen}L
                {#if noRoomAirMode && amounts.nitrogen > 0} / 窒素 {amounts.nitrogen}L{/if}
              </span>
              <button class="btn-icon primary" onclick={() => copyUsage(amounts.oxygen, amounts.nitrogen)} title="コピー" aria-label={`${day}日のガス使用量をコピー`}>
                <span class="material-symbols-outlined">content_copy</span>
              </button>
            </div>
          </div>
        {/if}

        {#each dayPfResults as result}
          <div class="md-card result-card pf-history-card">
            <div class="list-row">
              <div>
                <p class="font-semibold">{formatBillingDateTime(result.measurement.dateTime)}のP/F比</p>
                <p class="helper-text">
                  {result.measurement.kind === "pao2" ? "動脈血 PaO2" : "SpO2"}：{result.measurement.value}{result.measurement.kind === "pao2" ? " mmHg" : "%"}
                </p>
              </div>
              <div class="list-actions">
                <button class="btn-icon" type="button" onclick={() => onEditMeasurement(result.measurement)} title="この測定を修正" aria-label={`${formatBillingDateTime(result.measurement.dateTime)}の測定を修正`}><span class="material-symbols-outlined">edit</span></button>
                <button class="btn-icon danger" type="button" onclick={() => onDeleteMeasurement(result.measurement)} title="この測定を削除" aria-label={`${formatBillingDateTime(result.measurement.dateTime)}の測定を削除`}><span class="material-symbols-outlined">delete</span></button>
              </div>
            </div>

            {#if !result.oxygenEntry}
              <p class="result-notice">この時刻に適用できる酸素量の入力がありません。酸素量の日時と流量を確認してください。</p>
            {:else if result.candidates.length === 0}
              <p class="result-notice">流量 {result.oxygenEntry.flow} L/minに対応する投与方法を推定できません。FiO2が分かる場合は設定の「FiO2モード」を使用してください。</p>
            {:else}
              {#if result.candidates.length > 1}
                <p class="result-notice neutral">投与方法によって結果が異なります。実際に使用したものを確認してください。</p>
              {/if}
              <div class="result-grid">
                {#each result.candidates as candidate}
                  <div class="pf-result">
                    <div class="flex flex-wrap items-center gap-2">
                      <strong>{candidate.device}</strong>
                      {#if result.pao2Estimated || candidate.estimated}<span class="estimate-badge">概算</span>{/if}
                    </div>
                    <p class="pf-number"><span>P/F比</span> {candidate.pfRatio}</p>
                    <p class="helper-text">
                      PaO2 {result.pao2}{result.pao2Estimated ? "（SpO2から推定）" : ""} ÷ FiO2 {candidate.fio2}%{candidate.estimated ? "（流量から推定）" : ""}
                    </p>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </li>
    {/each}
  {/if}
</ul>
