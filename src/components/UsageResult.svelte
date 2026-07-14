<script lang="ts">
  import type { CalculationMode, Entry } from "../types/entry.ts";
  import { CALCULATION_MODES, calculationModeLabel } from "../types/entry.ts";
  import type { OxygenMeasurement } from "../types/pfRatio.ts";
  import { formatBillingDateTime } from "../utils/billingDateTime.ts";
  import { copyText, formatUsageForClipboard } from "../utils/clipboard.ts";
  import type { UsageByDayAndMode } from "../utils/calculation.ts";
  import { calculatePfRatio } from "../utils/pfRatio.ts";

  interface Props {
    usageData: UsageByDayAndMode;
    entries: Entry[];
    measurements: OxygenMeasurement[];
    notify: (message: string, kind: "success" | "error") => void;
    onEditMeasurement: (measurement: OxygenMeasurement) => void;
    onDeleteMeasurement: (measurement: OxygenMeasurement) => void;
  }
  let {
    usageData,
    entries,
    measurements,
    notify,
    onEditMeasurement,
    onDeleteMeasurement,
  }: Props = $props();

  const pfResults = $derived(
    measurements.map((measurement) => calculatePfRatio(measurement, entries)),
  );
  const sortedDays = $derived(
    Array.from(
      new Set([
        ...Object.keys(usageData).map(Number),
        ...measurements.map((measurement) => measurement.dateTime.day),
      ]),
    ).sort((left, right) => left - right),
  );

  async function copyUsage(oxygen: number, nitrogen: number, mode: CalculationMode) {
    const text = formatUsageForClipboard(oxygen, nitrogen, mode);
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
      {@const usageByMode = usageData[day]}
      {@const dayPfResults = pfResults.filter((result) => result.measurement.dateTime.day === day)}
      <li class="result-day-group">
        <h3 class="result-day-heading">{day}日</h3>

        {#if usageByMode}
          {#each CALCULATION_MODES as mode}
            {@const amounts = usageByMode[mode]}
            {#if amounts}
              <div class="md-card p-3 mb-2">
                <p class="helper-text">{calculationModeLabel(mode)}</p>
                <div class="list-row">
                  <span class="md-body-large flex-grow">
                    酸素 {amounts.oxygen}L
                    {#if mode === "fio2-no-room-air" && amounts.nitrogen > 0} / 窒素 {amounts.nitrogen}L{/if}
                  </span>
                  <button class="btn-icon primary" onclick={() => copyUsage(amounts.oxygen, amounts.nitrogen, mode)} title="コピー" aria-label={`${day}日の${calculationModeLabel(mode)}のガス使用量をコピー`}>
                    <span class="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>
            {/if}
          {/each}
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
              <p class="result-notice">流量 {result.oxygenEntry.flow} L/minに対応する投与方法を推定できません。設定酸素濃度が分かる場合は、入力欄の「総流量・酸素濃度から計算」を使用してください。</p>
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
