<script lang="ts">
    import { onMount } from "svelte";
    import EntryList from "./components/EntryList.svelte";
    import UsageResult from "./components/UsageResult.svelte";
    import SettingsDialog from "./components/SettingsDialog.svelte";
    import { calculateUsage } from "./utils/calculation.ts";
    import type { Entry } from "./types/entry.ts";

    // --- State ---
    let entries: Entry[] = [];
    let fio2Mode = false;
    let noRoomAirMode = false;
    let isSettingsOpen = false;
    let darkMode = false;
    let editingIndex: number | null = null;

    // Inputs
    let dateTimeStr = "";
    let flowStr = "";
    let fio2Str = "";

    // DOM Refs
    let dateTimeInputRef: HTMLInputElement;
    let flowInputRef: HTMLInputElement;
    let fio2InputRef: HTMLInputElement;

    // Derived State
    let lastDate: Date | null = null;
    // Svelte 4 reactivity
    $: usageData = calculateUsage(entries, fio2Mode, noRoomAirMode);
    let errorMsg = "";

    onMount(() => {
        darkMode = localStorage.getItem("darkMode") === "true";
        document.documentElement.classList.toggle("dark", darkMode);
    });

    // Effect to sync noRoomAirMode
    $: if (!fio2Mode) {
        noRoomAirMode = false;
        fio2Str = "";
    }

    // --- Logic ---

    function parseDateTime(input: string): Date | null {
        let day: number, hour: number, minute: number;
        const now = new Date();

        if (input.length <= 4) {
            // HHMM (Date omitted)
            const paddedInput = input.padStart(4, "0");
            if (!lastDate) {
                day = 1;
            } else {
                day = lastDate.getDate();
            }
            hour = parseInt(paddedInput.slice(0, 2), 10);
            minute = parseInt(paddedInput.slice(2, 4), 10);
        } else {
            // DDHHMM
            const paddedInput = input.padStart(6, "0");
            day = parseInt(paddedInput.slice(0, 2), 10);
            hour = parseInt(paddedInput.slice(2, 4), 10);
            minute = parseInt(paddedInput.slice(4, 6), 10);
        }

        if (
            isNaN(day) ||
            isNaN(hour) ||
            isNaN(minute) ||
            day < 1 ||
            day > 31 ||
            hour >= 24 ||
            minute >= 60
        ) {
            return null;
        }
        return new Date(now.getFullYear(), now.getMonth(), day, hour, minute);
    }

    function addEntry() {
        if (!dateTimeStr || !flowStr) {
            showError("日付時刻と流量を入力してください。");
            return;
        }

        const parsedDateTime = parseDateTime(dateTimeStr);
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

        entries = [...entries, newEntry].sort(
            (a, b) => a.dateTime.getTime() - b.dateTime.getTime(),
        );
        lastDate = entries[entries.length - 1].dateTime;

        // Reset inputs
        dateTimeStr = "";
        flowStr = "";
        fio2Str = "";
        showError("");

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
        const dateTime = parseDateTime(editedDateTime.trim());
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
        const updated = [...entries];
        updated[index] = { dateTime, flow, fio2 };
        entries = updated.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
        lastDate = entries[entries.length - 1]?.dateTime ?? null;
        editingIndex = null;
        showError("✅ 編集を保存しました");
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
        lastDate = null;
        dateTimeStr = "";
        flowStr = "";
        fio2Str = "";
        editingIndex = null;
        showError("");
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
        if (!enabled) noRoomAirMode = false;
        showError("計算条件を変更したため、入力をクリアしました");
    }

    function changeNoRoomAirMode(enabled: boolean) {
        if (noRoomAirMode === enabled) return;
        clearAll();
        noRoomAirMode = enabled;
        showError("計算条件を変更したため、入力をクリアしました");
    }

    function showError(msg: string) {
        errorMsg = msg;
        if (msg) {
            setTimeout(() => {
                errorMsg = "";
            }, 3000);
        }
    }

    // Key handlers
    function onDateTimeEnter(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            flowInputRef?.focus();
        }
    }

    function onFlowEnter(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (fio2Mode) {
                fio2InputRef?.focus();
            } else {
                addEntry();
            }
        }
    }

    function onFio2Enter(e: KeyboardEvent) {
        if (e.key === "Enter") {
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
                on:click={clearAll}
                id="clearAllBtn"
            >
                クリア
            </button>
            <button
                class="btn-icon"
                on:click={() => (isSettingsOpen = true)}
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
                <UsageResult {usageData} {noRoomAirMode} notify={showError} />
            </div>
        </section>
    </div>
</main>

<!-- Footer Input Area -->
<footer
    class="fixed bottom-0 left-0 right-0 bg-[var(--md-surface-container)] p-4 shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-40"
>
    <div class="max-w-screen-xl mx-auto flex flex-wrap gap-3 items-end">
        <!-- Date Time Input -->
        <div class="flex-grow min-w-[120px]">
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
                on:keypress={onDateTimeEnter}
            />
        </div>

        <!-- Flow Input -->
        <div class="flex-grow min-w-[100px]">
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
                on:keypress={onFlowEnter}
            />
        </div>

        <!-- FiO2 Input -->
        {#if fio2Mode}
            <div class="flex-grow min-w-[80px]" id="fio2InputGroup">
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
                    on:keypress={onFio2Enter}
                />
            </div>
        {/if}

        <!-- Add Button -->
        <button
            class="md-fab md-fab-primary mb-1 ml-auto"
            id="addEntryBtn"
            on:click={addEntry}
            title="追加"
        >
            <span class="material-symbols-outlined">add</span>
        </button>
    </div>
</footer>

<!-- Snackbar -->
<div id="snackbar" class="snackbar {errorMsg ? '' : 'hidden'}">
    <span id="snackbarText" class="md-body-medium flex-grow mr-4"
        >{errorMsg}</span
    >
    <button
        id="snackbarAction"
        class="text-[var(--md-inverse-primary)] font-bold text-sm uppercase tracking-wider"
        on:click={() => (errorMsg = "")}>閉じる</button
    >
</div>

<!-- Settings Modal -->
<SettingsDialog
    bind:isOpen={isSettingsOpen}
    {darkMode}
    {fio2Mode}
    {noRoomAirMode}
    close={() => (isSettingsOpen = false)}
    onDarkModeChange={changeDarkMode}
    onFio2ModeChange={changeFio2Mode}
    onNoRoomAirModeChange={changeNoRoomAirMode}
/>
