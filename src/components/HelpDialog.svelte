<script lang="ts">
  import { tick } from "svelte";

  interface Props { isOpen: boolean; close: () => void; returnFocusTo?: HTMLElement; }
  let { isOpen, close, returnFocusTo }: Props = $props();
  let dialog = $state<HTMLDivElement>();

  function focusOnMount(node: HTMLElement) {
    node.focus();
  }

  function closeDialog() {
    close();
    void tick().then(() => returnFocusTo?.focus());
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(
      dialog?.querySelectorAll<HTMLElement>("button, summary, [tabindex]:not([tabindex='-1'])") ?? [],
    );
    if (controls.length === 0) return;
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
</script>

{#if isOpen}
  <div class="dialog-overlay sheet-overlay" role="presentation" onclick={(event) => event.target === event.currentTarget && closeDialog()}>
    <div use:focusOnMount class="md-dialog help-dialog" role="dialog" aria-modal="true" aria-labelledby="helpTitle" tabindex="-1" bind:this={dialog} onkeydown={onKeydown}>
      <div class="dialog-header">
        <div>
          <p class="eyebrow">かんたんガイド</p>
          <h2 id="helpTitle" class="md-headline-small">使い方</h2>
        </div>
        <button class="btn-icon" type="button" onclick={closeDialog} aria-label="ヘルプを閉じる"><span class="material-symbols-outlined">close</span></button>
      </div>
      <ol class="help-steps">
        <li><span>1</span><div><strong>日時と流量を入力</strong><p>例：2日9時7分、1.5 L/minなら「20907」「1.5」と入力して＋を押します。</p></div></li>
        <li><span>2</span><div><strong>時刻だけでも入力できます</strong><p>「907」のように入力すると、入力欄の下に表示されている日として追加されます。</p></div></li>
        <li><span>3</span><div><strong>結果を確認・コピー</strong><p>日ごとの酸素・窒素使用量が自動計算されます。コピーボタンからレセプト入力用の文字列をコピーできます。</p></div></li>
      </ol>
      <div class="help-topics">
        <details><summary>入力の修正・削除</summary><p>入力リスト右側の鉛筆で修正、ごみ箱で削除できます。同じ日時を追加すると新しい内容で置き換わります。</p></details>
        <details><summary>FiO2モードと室内気不使用</summary><p>設定から切り替えます。計算条件が変わるため、入力済みデータがある場合は確認後にクリアされます。</p></details>
        <details><summary>P/F比について</summary><p>P/F比ボタンからPaO2またはSpO2を入力します。流量などから推定した値には「概算」と表示されます。</p></details>
        <details><summary>データの保存と注意事項</summary><p>入力内容は保存されず、再読み込みすると失われます。本ツールはレセプト作成の確認補助であり、請求や治療判断を代替しません。</p></details>
      </div>
      <div class="dialog-actions"><button class="btn-filled" type="button" onclick={closeDialog}>わかりました</button></div>
    </div>
  </div>
{/if}
