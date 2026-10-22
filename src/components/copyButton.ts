import { button } from '../views/dom';

/**
 * コピーボタン。
 *
 * Clipboard API が使える環境ではそれでコピーし、
 * 使えない環境（古いiOS Safari、http接続など）では
 * 対象のテキストを選択状態にして、手動でコピーできるようにする。
 */
export interface CopyButtonOptions {
  /** コピーする文字列を返す */
  getText: () => string;
  /** コピーできないときに選択状態にする要素 */
  selectTarget: HTMLElement;
  label?: string;
}

const RESET_DELAY = 2000;

export function createCopyButton(options: CopyButtonOptions): HTMLButtonElement {
  const label = options.label ?? 'コピー';

  const node = button('btn btn--small', label, () => {
    void copy();
  });

  let resetTimer: number | undefined;

  function show(message: string): void {
    node.textContent = message;
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      node.textContent = label;
    }, RESET_DELAY);
  }

  /** 選択状態にして、手動コピーを促す。 */
  function selectForManualCopy(): void {
    const selection = window.getSelection();
    if (!selection) {
      show('コピーできません');
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(options.selectTarget);
    selection.removeAllRanges();
    selection.addRange(range);
    show('選択しました');
  }

  async function copy(): Promise<void> {
    const text = options.getText();
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API が使えません');
      }
      await navigator.clipboard.writeText(text);
      show('コピーしました');
    } catch {
      selectForManualCopy();
    }
  }

  return node;
}
