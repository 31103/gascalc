<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import EntryList from "./components/EntryList.svelte";
    import UsageResult from "./components/UsageResult.svelte";
    import SettingsDialog from "./components/SettingsDialog.svelte";
    import PfRatioDialog from "./components/PfRatioDialog.svelte";
    import { calculateUsage } from "./utils/calculation.ts";
    import type { BillingDateTime, Entry } from "./types/entry.ts";
    import { isSameBillingDateTime, parseBillingDateTime } from "./utils/billingDateTime.ts";
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

    // Derived State
    let lastDate: BillingDateTime | null = $state(null);
    let usageData = $derived(calculateUsage(entries, fio2Mode, noRoomAirMode));
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
                showError("FiO2モードが有効です。FiO2値を入力してください。");
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
        };

        entries = upsertEntry(entries, newEntry);
        lastDate = entries[entries.length - 1].dateTime;

        // Reset inputs
        dateTimeStr = "";
        flowStr = "";
        fio2Str = "";
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
    ) {
        const dateTime = parseBillingDateTime(editedDateTime.trim(), lastDate?.day ?? 1);
        const flow = Number(editedFlow);
        const fio2 = fio2Mode ? Number(editedFio2) : 21;
        if (!dateTime) {
            showError("無効な日付時刻形式です。");
            return;
        }
        if (!Number.isFinite(flow) || flow < 0) {
            showError("無効な流量です。0以上の数値を入力してください。");
            return;
        }
        if (fio2Mode && (!Number.isInteger(fio2) || fio2 < 21 || fio2 > 100)) {
            showError("無効なFiO2です。21以上100以下の整数を入力してください。");
            return;
        }
        const updated = entries.filter((_, currentIndex) => currentIndex !== index);
        entries = upsertEntry(updated, { dateTime, flow, fio2 });
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

    function changeDarkMode(enabled: boolean) {
        darkMode = enabled;
        document.documentElement.classList.toggle("dark", enabled);
        localStorage.setItem("darkMode", String(enabled));
    }

    function changeFio2Mode(enabled: boolean) {
        if (fio2Mode === enabled) return;
        clearAll();
        fio2Mode = enabled;
        if (!enabled) {
            noRoomAirMode = false;
            fio2Str = "";
        }
        showNotification("計算条件を変更したため、入力をクリアしました", "info");
    }

    function changeNoRoomAirMode(enabled: boolean) {
        if (noRoomAirMode === enabled) return;
        clearAll();
        noRoomAirMode = enabled;
        showNotification("計算条件を変更したため、入力をクリアしました", "info");
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

<!-- Top App Bar -->
<header
    class="bg-[var(--md-surface)] text-[var(--md-on-surface)] shadow-sm sticky top-0 z-40"
>
    <div
        class="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between"
    >
        <div class="flex items-center gap-3">
            <span
                class="material-symbols-outlined text-3xl text-[var(--md-primary)]"
                >gas_meter</span
            >
            <h1 class="md-title-large">ガス使用量計算</h1>
        </div>
        <div class="flex gap-2">
            <button
                class="btn-text text-[var(--md-error)]"
                onclick={clearAll}
                id="clearAllBtn"
            >
                クリア
            </button>
            <button
                class="btn-icon"
                onclick={() => (isSettingsOpen = true)}
                bind:this={settingsButtonRef}
                id="settingsBtn"
                title="設定"
            >
                <span class="material-symbols-outlined">settings</span>
            </button>
        </div>
    </div>
</header>

<main class="max-w-screen-xl mx-auto px-4 py-6 pb-40">
    <div class="grid md:grid-cols-2 gap-6">
        <!-- Input List -->
        <section>
            <h2
                class="md-title-medium mb-3 text-[var(--md-primary)] flex items-center gap-2"
            >
                <span class="material-symbols-outlined">list</span>
                入力リスト
            </h2>
            <div id="entries" class="space-y-2">
                <EntryList
                    {entries}
                    {fio2Mode}
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
            <h2
                class="md-title-medium mb-3 text-[var(--md-primary)] flex items-center gap-2"
            >
                <span class="material-symbols-outlined">calculate</span>
                計算結果
            </h2>
            <div id="usage" class="space-y-2">
                <UsageResult
                    {usageData}
                    {noRoomAirMode}
                    {entries}
                    {fio2Mode}
                    {measurements}
                    onEditMeasurement={openPfMeasurementEdit}
                    onDeleteMeasurement={deletePfMeasurement}
                    notify={(message, kind) => showNotification(message, kind)}
                />
            </div>
        </section>
    </div>
</main>

<!-- Footer Input Area -->
<footer
    class="fixed bottom-0 left-0 right-0 bg-[var(--md-surface-container)] p-4 shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-40"
>
    <div class="footer-input-layout max-w-screen-xl mx-auto">
        <div class="footer-fields">
            <!-- Date Time Input -->
            <div>
                <label
                    for="dateTime"
                    class="block md-label-small mb-1 text-[var(--md-on-surface-variant)]"
                    >日付時刻 (DDHHMM)</label
                >
                <input
                    type="text"
                    id="dateTime"
                    class="input-field w-full"
                    placeholder="例: 20907"
                    inputmode="numeric"
                    bind:value={dateTimeStr}
                    bind:this={dateTimeInputRef}
                    onkeydown={onDateTimeEnter}
                />
            </div>

            <!-- Flow Input -->
            <div>
                <label
                    for="flow"
                    class="block md-label-small mb-1 text-[var(--md-on-surface-variant)]"
                    >流量 (L/min)</label
                >
                <input
                    type="number"
                    id="flow"
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
                        class="block md-label-small mb-1 text-[var(--md-on-surface-variant)]"
                        >FiO2 (%)</label
                    >
                    <input
                        type="number"
                        id="fio2Input"
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
                title="追加"
            >
                <span class="material-symbols-outlined">add</span>
            </button>

            <!-- P/F Ratio Button -->
            <button
                class="btn-outlined"
                type="button"
                onclick={openNewPfMeasurement}
                bind:this={pfButtonRef}
                aria-label="P/F比を入力"
            >
                <span class="material-symbols-outlined text-xl"
                    >monitor_heart</span
                >
                <span>P/F比</span>
            </button>
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
    {fio2Mode}
    {noRoomAirMode}
    close={() => (isSettingsOpen = false)}
    returnFocusTo={settingsButtonRef}
    onDarkModeChange={changeDarkMode}
    onFio2ModeChange={changeFio2Mode}
    onNoRoomAirModeChange={changeNoRoomAirMode}
/>
