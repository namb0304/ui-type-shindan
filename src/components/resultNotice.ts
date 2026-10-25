import { el } from '../views/dom';

/**
 * 結果ページのお知らせ（K4 のてんこ盛り化・要件 §5）。
 *
 * 第2部で選んだ出し方で、「コピーしました」を出す。
 *   トースト … 画面の下に浮いて、数秒で自分で消える
 *   バナー   … 画面の上に居座り、✕を押すまで消えない
 *
 * 質問画面のデモ（components/kit/notice.ts）とは別物にしてある。
 * あちらはスマホの枠の中の見本で、こちらは本物の画面に出すもの。
 * 形は同じでも、置き場所（画面の端）と寿命の持ち方が違う。
 *
 * 画面を離れるときは destroy() を呼ぶ。消えるタイマーが残っていると、
 * すでに無い要素を触ってエラーになる。
 */

/** トーストが自分で消えるまで。短すぎると読めない */
const TOAST_LIFETIME_MS = 2600;

export type NoticeVariant = 'toast' | 'banner';

export interface ResultNotice {
  element: HTMLElement;
  /** お知らせを出す。同じ文言で連続して押されても出し直す */
  show: (message: string) => void;
  destroy: () => void;
}

export function createResultNotice(variant: NoticeVariant): ResultNotice {
  const element = el('div', `notice notice--${variant}`);
  // 操作の結果を知らせるものなので status。alert だと読み上げが割り込みすぎる
  element.setAttribute('role', 'status');
  element.hidden = true;

  const text = el('span', 'notice__text');
  element.append(text);

  let hideTimer: number | undefined;
  let closeButton: HTMLButtonElement | undefined;

  function hide(): void {
    window.clearTimeout(hideTimer);
    delete element.dataset.open;
    // 出入りの動きが終わってから隠す。すぐ hidden にすると消え方が飛ぶ
    hideTimer = window.setTimeout(() => {
      element.hidden = true;
    }, 400);
  }

  if (variant === 'banner') {
    closeButton = el('button', 'notice__close', '✕');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'お知らせを閉じる');
    closeButton.addEventListener('click', hide);
    element.append(closeButton);
  }

  function show(message: string): void {
    window.clearTimeout(hideTimer);
    text.textContent = message;
    element.hidden = false;

    // hidden を外した直後だと、出入りの動きが始まらない。
    // 1フレーム待ってから開いた状態にする
    requestAnimationFrame(() => {
      element.dataset.open = 'true';
    });

    if (variant !== 'toast') return;
    hideTimer = window.setTimeout(hide, TOAST_LIFETIME_MS);
  }

  return {
    element,
    show,
    destroy() {
      window.clearTimeout(hideTimer);
      closeButton?.removeEventListener('click', hide);
    },
  };
}
