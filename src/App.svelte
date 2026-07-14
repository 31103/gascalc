<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import EntryList from "./components/EntryList.svelte";
    import UsageResult from "./components/UsageResult.svelte";
    import SettingsDialog from "./components/SettingsDialog.svelte";
    import PfRatioDialog from "./components/PfRatioDialog.svelte";
    import HelpDialog from "./components/HelpDialog.svelte";
    import ConfirmDialog from "./components/ConfirmDialog.svelte";
    import { calculateUsage } from "./utils/calculation.ts";
    import type { BillingDateTime, CalculationMode, Entry } from "./types/entry.ts";
    import { calculationModeLabel, isFio2CalculationMode } from "./types/entry.ts";
    import { isSameBillingDateTime, parseBillingDateTime, previewBillingDateTime } from "./utils/billingDateTime.ts";
    import { upsertEntry } from "./utils/entries.ts";
    import type { OxygenMeasurement } from "./types/pfRatio.ts";
    import { upsertMeasurement } from "./utils/pfRatio.ts";

    // --- State ---
    let entries: Entry[] = $state([]);
    let fio2Mode = $state(false);
    let noRoomAirMode = $state(false);
    let isSettingsOpen = $state(false);
    let darkMode = $state(false);
    let editingIndex: number | null = $state(null);
    let measurements: OxygenMeasurement[] = $state([]);
    let isPfDialogOpen = $state(false);
    let editingMeasurement: OxygenMeasurement | null = $state(null);
    let isHelpOpen = $state(false);
    let isModeControlsOpen = $state(false);
    type Confirmation = { title: string; message: string; confirmLabel: string; action: () => void; returnFocusTo?: HTMLElement };
    let confirmation: Confirmation | null = $state(null);

    // Inputs
    let dateTimeStr = $state("");
    let flowStr = $state("");
    let fio2Str = $state("");

    // DOM Refs
    let dateTimeInputRef = $state<HTMLInputElement>();
    let flowInputRef = $state<HTMLInputElement>();
    let fio2InputRef = $state<HTMLInputElement>();
    let settingsButtonRef = $state<HTMLButtonElement>();
    let pfButtonRef = $state<HTMLButtonElement>();
    let clearButtonRef = $state<HTMLButtonElement>();
    let helpButtonRef = $state<HTMLButtonElement>();

    // Derived State
    let lastDate: BillingDateTime | null = $state(null);
    let currentMode: CalculationMode = $derived(fio2Mode ? (noRoomAirMode ? "fio2-no-room-air" : "fio2-room-air") : "standard");
    let usageData = $derived(calculateUsage(entries));
    let fallbackDay = $derived(entries.at(-1)?.dateTime.day ?? 1);
    let dateTimePreview = $derived(previewBillingDateTime(dateTimeStr, fallbackDay));
    type Notification = { message: string; kind: "success" | "error" | "info" };
    let notification: Notification | null = $state(null);
    let notificationTimer: ReturnType<typeof setTimeout> | null = null;

    onMount(() => {
        darkMode = localStorage.getItem("darkMode") === "true";
        document.documentElement.classList.toggle("dark", darkMode);
    });

    onDestroy(() => {
        if (notificationTimer) clearTimeout(notificationTimer);
    });

    // --- Logic ---

    function addEntry() {
        if (!dateTimeStr || !flowStr) {
            showError("日付時刻と流量を入力してください。");
            return;
        }

        const parsedDateTime = parseBillingDateTime(dateTimeStr, lastDate?.day ?? 1);
        if (!parsedDateTime) {
            showError(
                "無効な日付時刻形式です。DDHHMM または HHMM で入力してください。",
            );
            return;
        }

        const parsedFlow = parseFloat(flowStr);
        if (isNaN(parsedFlow) || parsedFlow < 0) {
            showError("無効な流量です。0以上の数値を入力してください。");
            return;
        }

        let parsedFio2 = 21;
        if (fio2Mode) {
            if (!fio2Str) {
                showError("設定酸素濃度を入力してください。");
                return;
            }
            parsedFio2 = parseInt(fio2Str, 10);
            if (isNaN(parsedFio2) || parsedFio2 < 21 || parsedFio2 > 100) {
                showError(
                    "無効なFiO2です。21以上100以下の整数を入力してください。",
                );
                return;
            }
        }

        const newEntry: Entry = {
            dateTime: parsedDateTime,
            flow: parsedFlow,
            fio2: parsedFio2,
            mode: currentMode,
        };

        entries = upsertEntry(entries, newEntry);
        lastDate = entries[entries.length - 1].dateTime;

        // Reset inputs
        dateTimeStr = "";
        flowStr = "";
        fio2Str = "";
        isModeControlsOpen = false;
        clearNotification();

        // Focus back to dateTime
        dateTimeInputRef?.focus();
    }

    function handleEdit(index: number) {
        editingIndex = index;
    }

    function saveEdit(
        index: number,
        editedDateTime: string,
        editedFlow: string,
        editedFio2: string,
        editedMode: CalculationMode,
    ) {
        const dateTime = parseBillingDateTime(editedDateTime.trim(), lastDate?.day ?? 1);
        const flow = Number(editedFlow);
        const fio2ModeForEntry = isFio2CalculationMode(editedMode);
        const fio2 = fio2ModeForEntry ? Number(editedFio2) : 21;
        if (!dateTime) {
            showError("無効な日付時刻形式です。");
            return;
        }
        if (!Number.isFinite(flow) || flow < 0) {
            showError("無効な流量です。0以上の数値を入力してください。");
            return;
        }
        if (fio2ModeForEntry && (!Number.isInteger(fio2) || fio2 < 21 || fio2 > 100)) {
            showError("無効なFiO2です。21以上100以下の整数を入力してください。");
            return;
        }
        const updated = entries.filter((_, currentIndex) => currentIndex !== index);
        entries = upsertEntry(updated, { dateTime, flow, fio2, mode: editedMode });
        lastDate = entries[entries.length - 1]?.dateTime ?? null;
        editingIndex = null;
        showNotification("編集を保存しました", "success");
    }

    function cancelEdit() {
        editingIndex = null;
    }

    function handleDelete(index: number) {
        const newEntries = [...entries];
        newEntries.splice(index, 1);
        entries = newEntries;
        if (editingIndex === index) {
            editingIndex = null;
        } else if (editingIndex !== null && editingIndex > index) {
            editingIndex -= 1;
        }
        if (entries.length > 0) {
            lastDate = entries[entries.length - 1].dateTime;
        } else {
            lastDate = null;
        }
    }

    function clearAll() {
        entries = [];
        measurements = [];
        lastDate = null;
        dateTimeStr = "";
        flowStr = "";
        fio2Str = "";
        editingIndex = null;
        editingMeasurement = null;
        isPfDialogOpen = false;
        clearNotification();
        dateTimeInputRef?.focus();
    }

    function requestClearAll() {
        if (entries.length === 0 && measurements.length === 0) {
            clearAll();
            return;
        }
        confirmation = {
            title: "すべてクリアしますか？",
            message: "入力リスト、計算結果、P/F比の測定履歴がすべて消えます。この操作は元に戻せません。",
            confirmLabel: "すべてクリア",
            action: clearAll,
            returnFocusTo: clearButtonRef,
        };
    }

    function changeDarkMode(enabled: boolean) {
        darkMode = enabled;
        document.documentElement.classList.toggle("dark", enabled);
        localStorage.setItem("darkMode", String(enabled));
    }

    function changeFio2Mode(enabled: boolean) {
        if (fio2Mode === enabled) return;
        fio2Mode = enabled;
        if (!enabled) {
            noRoomAirMode = false;
            fio2Str = "";
            isModeControlsOpen = false;
        }
    }

    function changeNoRoomAirMode(enabled: boolean) {
        if (noRoomAirMode === enabled) return;
        noRoomAirMode = enabled;
    }

    function showError(msg: string) {
        showNotification(msg, "error");
    }

    function showNotification(message: string, kind: Notification["kind"] = "info") {
        if (notificationTimer) clearTimeout(notificationTimer);
        notification = message ? { message, kind } : null;
        if (message) {
            notificationTimer = setTimeout(() => {
                notification = null;
                notificationTimer = null;
            }, 3000);
        }
    }

    function clearNotification() {
        if (notificationTimer) clearTimeout(notificationTimer);
        notificationTimer = null;
        notification = null;
    }

    function openNewPfMeasurement() {
        editingMeasurement = null;
        isPfDialogOpen = true;
    }

    function openPfMeasurementEdit(measurement: OxygenMeasurement) {
        editingMeasurement = measurement;
        isPfDialogOpen = true;
    }

    function closePfDialog() {
        isPfDialogOpen = false;
        editingMeasurement = null;
    }

    function savePfMeasurement(
        measurement: OxygenMeasurement,
        original: OxygenMeasurement | null,
    ) {
        const remaining = original
            ? measurements.filter(
                  (current) =>
                      !isSameBillingDateTime(current.dateTime, original.dateTime),
              )
            : measurements;
        measurements = upsertMeasurement(remaining, measurement);
    }

    function deletePfMeasurement(measurement: OxygenMeasurement) {
        measurements = measurements.filter(
            (current) =>
                !isSameBillingDateTime(current.dateTime, measurement.dateTime),
        );
    }

    // Key handlers
    function onDateTimeEnter(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.isComposing) {
            e.preventDefault();
            flowInputRef?.focus();
        }
    }

    function onFlowEnter(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.isComposing) {
            e.preventDefault();
            if (fio2Mode) {
                fio2InputRef?.focus();
            } else {
                addEntry();
            }
        }
    }

    function onFio2Enter(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.isComposing) {
            e.preventDefault();
            addEntry();
        }
    }
</script>

<header class="app-header">
    <div class="app-header-inner">
        <div class="brand">
            <span class="brand-mark material-symbols-outlined">oxygen_saturation</span>
            <div>
                <h1>ガス使用量計算</h1>
                <p>次回入力：{calculationModeLabel(currentMode)}</p>
            </div>
        </div>
        <nav class="header-actions" aria-label="アプリ操作">
            <button class="header-help" type="button" onclick={() => (isHelpOpen = true)} bind:this={helpButtonRef} aria-label="使い方を開く">
                <span class="material-symbols-outlined">help</span><span class="header-action-label">使い方</span>
            </button>
            <button class="header-clear" type="button" onclick={requestClearAll} bind:this={clearButtonRef} id="clearAllBtn" aria-label="全クリア">
                <span class="material-symbols-outlined">delete_sweep</span><span>全クリア</span>
            </button>
            <button class="btn-icon" onclick={() => (isSettingsOpen = true)} bind:this={settingsButtonRef} id="settingsBtn" aria-label="設定を開く" title="設定">
                <span class="material-symbols-outlined">settings</span>
            </button>
        </nav>
    </div>
</header>

<main class:fio2-mode={fio2Mode} class:mode-expanded={isModeControlsOpen} class="app-main">
    {#if entries.length === 0}
        <section class="start-guide" aria-labelledby="startGuideTitle">
            <div class="start-guide-icon"><span class="material-symbols-outlined">add_notes</span></div>
            <div>
                <h2 id="startGuideTitle">最初の入力を追加しましょう</h2>
                <p>画面下の入力欄に、日付時刻と流量を入力します。</p>
                <p class="start-example"><strong>例</strong> 2日9時7分・1.5 L/min → <code>20907</code> と <code>1.5</code></p>
            </div>
        </section>
    {/if}
    <div class="workspace-grid">
        <!-- Input List -->
        <section>
            <div class="section-heading"><span class="material-symbols-outlined">format_list_bulleted</span><div><h2>入力リスト</h2><p>{entries.length}件の入力</p></div></div>
            <div id="entries" class="space-y-2">
                <EntryList
                    {entries}
                    {editingIndex}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                />
            </div>
        </section>

        <!-- Calculation Result -->
        <section>
            <div class="section-heading"><span class="material-symbols-outlined">analytics</span><div><h2>計算結果</h2><p>日・モードごとの使用量</p></div></div>
            <div id="usage" class="space-y-2">
                <UsageResult
                    {usageData}
                    {entries}
                    {measurements}
                    onEditMeasurement={openPfMeasurementEdit}
                    onDeleteMeasurement={deletePfMeasurement}
                    notify={(message, kind) => showNotification(message, kind)}
                />
            </div>
        </section>
    </div>
</main>

<footer class:fio2-mode={fio2Mode} class:mode-expanded={isModeControlsOpen} class="input-dock">
    <div class="input-dock-inner">
        <div class="input-dock-title">
            <div><span class="material-symbols-outlined">add_circle</span><strong>使用条件を追加</strong></div>
            <div class="dock-shortcuts">
                <button class="mode-toggle" type="button" onclick={() => (isModeControlsOpen = !isModeControlsOpen)} aria-label="計算方法を変更" aria-expanded={isModeControlsOpen} aria-controls="modeControls">
                    <span>{calculationModeLabel(currentMode)}</span><span class="material-symbols-outlined">{isModeControlsOpen ? "expand_more" : "tune"}</span>
                </button>
                <button class="pf-link" type="button" onclick={openNewPfMeasurement} bind:this={pfButtonRef} aria-label="P/F比を入力"><span class="material-symbols-outlined">monitor_heart</span>P/F比</button>
            </div>
        </div>
        {#if isModeControlsOpen}
        <div class="mode-controls" id="modeControls">
            <fieldset class="mode-choice">
                <legend>計算方法</legend>
                <div class="mode-segments">
                    <label>
                        <input aria-label="酸素流量から計算" type="radio" name="inputMethod" checked={!fio2Mode} onchange={() => changeFio2Mode(false)} />
                        <span><strong>酸素流量から計算</strong><small>カヌラ・酸素マスクなど</small></span>
                    </label>
                    <label>
                        <input aria-label="総流量・酸素濃度から計算" type="radio" name="inputMethod" checked={fio2Mode} onchange={() => changeFio2Mode(true)} />
                        <span><strong>総流量・酸素濃度から計算</strong><small>人工呼吸器・ハイフローなど</small></span>
                    </label>
                </div>
            </fieldset>
            {#if fio2Mode}
                <fieldset class="air-source-choice">
                    <legend>空気の供給元</legend>
                    <div class="air-source-segments">
                        <label>
                            <input aria-label="室内空気（内蔵コンプレッサー）" type="radio" name="airSource" checked={!noRoomAirMode} onchange={() => changeNoRoomAirMode(false)} />
                            <span><strong>室内空気</strong><small>内蔵コンプレッサー</small></span>
                        </label>
                        <label>
                            <input aria-label="合成空気（配管）" type="radio" name="airSource" checked={noRoomAirMode} onchange={() => changeNoRoomAirMode(true)} />
                            <span><strong>合成空気</strong><small>配管から供給</small></span>
                        </label>
                    </div>
                    <p>{noRoomAirMode ? "酸素ガスと窒素ガスを計算します。合成空気中の酸素21%分は酸素ガスへ合算します。" : "室内空気と混合するため、追加する酸素ガスだけを計算します。"}</p>
                </fieldset>
            {/if}
        </div>
        {/if}
        <div class="footer-input-layout">
        <div class="footer-fields">
            <!-- Date Time Input -->
            <div class="date-time-field">
                <label
                    for="dateTime"
                    class="field-label"
                    >日付時刻 <span class="label-format">DDHHMM / HHMM</span></label
                >
                <input
                    type="text"
                    id="dateTime"
                    aria-label="日付時刻 (DDHHMM)"
                    class="input-field w-full"
                    placeholder="例：20907"
                    inputmode="numeric"
                    bind:value={dateTimeStr}
                    bind:this={dateTimeInputRef}
                    onkeydown={onDateTimeEnter}
                />
                <p class:preview-error={dateTimePreview.kind === "invalid"} class="date-preview" aria-live="polite">
                    <span class="material-symbols-outlined">{dateTimePreview.kind === "invalid" ? "error" : "event"}</span>{dateTimePreview.message}
                </p>
            </div>

            <!-- Flow Input -->
            <div>
                <label
                    for="flow"
                    class="field-label"
                    >{fio2Mode ? "総流量" : "酸素流量"} (L/min)</label
                >
                <input
                    type="number"
                    id="flow"
                    aria-label="流量 (L/min)"
                    class="input-field w-full"
                    placeholder="例: 1.5"
                    step="0.1"
                    inputmode="decimal"
                    bind:value={flowStr}
                    bind:this={flowInputRef}
                    onkeydown={onFlowEnter}
                />
            </div>

            <!-- FiO2 Input -->
            {#if fio2Mode}
                <div id="fio2InputGroup">
                    <label
                        for="fio2Input"
                    class="field-label"
                        >設定酸素濃度 (%)</label
                    >
                    <input
                        type="number"
                        id="fio2Input"
                        aria-label="設定酸素濃度 (%)"
                        class="input-field w-full"
                        placeholder="21-100"
                        min="21"
                        max="100"
                        inputmode="numeric"
                        bind:value={fio2Str}
                        bind:this={fio2InputRef}
                        onkeydown={onFio2Enter}
                    />
                </div>
            {/if}
        </div>

        <div class="footer-actions">
            <!-- Add Button -->
            <button
                class="md-fab md-fab-primary"
                id="addEntryBtn"
                onclick={addEntry}
                aria-label="入力を追加"
                title="追加"
            >
                <span class="material-symbols-outlined">add</span><span class="add-label">追加</span>
            </button>
        </div>
        </div>
    </div>
</footer>

<PfRatioDialog
    isOpen={isPfDialogOpen}
    {entries}
    {measurements}
    {editingMeasurement}
    close={closePfDialog}
    save={savePfMeasurement}
    returnFocusTo={pfButtonRef}
/>

<HelpDialog isOpen={isHelpOpen} close={() => (isHelpOpen = false)} returnFocusTo={helpButtonRef} />

<ConfirmDialog
    isOpen={Boolean(confirmation)}
    title={confirmation?.title ?? ""}
    message={confirmation?.message ?? ""}
    confirmLabel={confirmation?.confirmLabel}
    close={() => (confirmation = null)}
    confirm={() => confirmation?.action()}
    returnFocusTo={confirmation?.returnFocusTo}
/>

<!-- Snackbar -->
<div
    id="snackbar"
    class="snackbar {notification ? '' : 'hidden'}"
    role={notification?.kind === "error" ? "alert" : "status"}
    aria-live={notification?.kind === "error" ? "assertive" : "polite"}
>
    <span id="snackbarText" class="md-body-medium flex-grow mr-4"
        >{notification?.message ?? ""}</span
    >
    <button
        id="snackbarAction"
        class="text-[var(--md-inverse-primary)] font-bold text-sm uppercase tracking-wider"
        onclick={clearNotification}>閉じる</button
    >
</div>

<!-- Settings Modal -->
<SettingsDialog
    bind:isOpen={isSettingsOpen}
    {darkMode}
    close={() => (isSettingsOpen = false)}
    returnFocusTo={settingsButtonRef}
    onDarkModeChange={changeDarkMode}
/>
