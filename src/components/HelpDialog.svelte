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
        <li><span>1</span><div><strong>計算方法を選んで入力</strong><p>酸素流量方式、または総流量・酸素濃度方式を選び、日時と流量を入力します。</p></div></li>
        <li><span>2</span><div><strong>時刻だけでも入力できます</strong><p>「907」のように入力すると、入力欄の下に表示されている日として追加されます。</p></div></li>
        <li><span>3</span><div><strong>結果を確認・コピー</strong><p>日ごと・計算モードごとの酸素・窒素使用量が自動計算されます。コピーボタンからレセプト入力用の文字列をコピーできます。</p></div></li>
      </ol>
      <div class="help-topics">
        <details><summary>入力の修正・削除</summary><p>入力リスト右側の鉛筆で修正、ごみ箱で削除できます。同じ日時を追加すると新しい内容で置き換わります。</p></details>
        <details><summary>計算方法と空気の供給元</summary><p>画面下部の現在方式を押すと選択エリアが開きます。カヌラや酸素マスクでは「酸素流量から計算」を選びます。人工呼吸器やハイフローでは「総流量・酸素濃度から計算」を選び、空気源を室内空気または合成空気から指定します。切替は次に追加する入力から適用され、入力済み条件は残ります。</p></details>
        <details><summary>合成空気の計算</summary><p>合成空気は酸素21%・窒素79%として扱います。合成空気に含まれる酸素は、純酸素として供給した分と合算して酸素ガス使用量へ計上します。</p></details>
        <details><summary>P/F比について</summary><p>P/F比ボタンからPaO2またはSpO2を入力します。流量などから推定した値には「概算」と表示されます。</p></details>
        <details><summary>データの保存と注意事項</summary><p>入力内容は保存されず、再読み込みすると失われます。本ツールはレセプト作成の確認補助であり、請求や治療判断を代替しません。</p></details>
      </div>
      <div class="dialog-actions"><button class="btn-filled" type="button" onclick={closeDialog}>わかりました</button></div>
    </div>
  </div>
{/if}
