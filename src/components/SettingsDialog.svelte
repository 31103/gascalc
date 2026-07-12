<script lang="ts">
    export let isOpen: boolean;
    export let fio2Mode: boolean;
    export let noRoomAirMode: boolean;
    export let close: () => void;

    function onOverlayClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            close();
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center transition-opacity"
        on:click={onOverlayClick}
        id="settingsOverlay"
    >
        <div
            class="bg-[var(--md-surface-container)] rounded-[28px] p-6 max-w-sm w-full mx-4 shadow-xl"
        >
            <div class="flex items-center justify-between mb-4">
                <h2 class="md-headline-small text-[var(--md-on-surface)]">
                    設定
                </h2>
                <button class="btn-icon" on:click={close} title="閉じる">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="md-body-large text-[var(--md-on-surface)]">
                            FiO2モード
                        </div>
                        <div
                            class="md-body-medium text-[var(--md-on-surface-variant)]"
                        >
                            FiO2を指定して計算
                        </div>
                    </div>
                    <label class="md-switch">
                        <input
                            type="checkbox"
                            bind:checked={fio2Mode}
                            id="fio2Mode"
                        />
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="flex items-center justify-between">
                    <div>
                        <div class="md-body-large text-[var(--md-on-surface)]">
                            室内気不使用
                        </div>
                        <div
                            class="md-body-medium text-[var(--md-on-surface-variant)]"
                        >
                            配管からの合成空気を使用
                        </div>
                    </div>
                    <label class="md-switch">
                        <input
                            type="checkbox"
                            bind:checked={noRoomAirMode}
                            disabled={!fio2Mode}
                            id="noRoomAirMode"
                        />
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div class="flex justify-end mt-6">
                <button
                    class="btn-text"
                    on:click={close}
                    id="settingsCloseBtn2"
                >
                    閉じる
                </button>
            </div>
        </div>
    </div>
{/if}
