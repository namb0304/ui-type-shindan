import { button, el } from '../views/dom';

/**
 * 「もう一度診断しますか？」の確認（K5 のてんこ盛り化・要件 §5）。
 *
 * 第2部で選んだ形で出す。
 *   モーダル     … 画面の真ん中に重なって出る窓。ボタンは横並び
 *   ボトムシート … 画面の下からせり上がる板。ボタンは縦積みで、
 *                  押したいほうを上（親指が届く位置）に置く
 *
 * 結果が消える操作なので、押し間違いを1回受け止める意味もある。
 */

export type ConfirmVariant = 'modal' | 'sheet';

export interface ConfirmPanel {
  /** 幕とパネルの2つ。結果画面の末尾に足す */
  elements: readonly HTMLElement[];
  open: () => void;
  destroy: () => void;
}

export interface ConfirmOptions {
  title: string;
  note: string;
  /** 実行する側のボタンの文字 */
  confirmLabel: string;
  /** やめる側のボタンの文字 */
  cancelLabel: string;
  onConfirm: () => void;
}

export function createConfirmPanel(
  variant: ConfirmVariant,
  options: ConfirmOptions,
): ConfirmPanel {
  const scrim = el('div', 'confirm-scrim');
  scrim.hidden = true;

  const panel = el('div', `confirm confirm--${variant}`);
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.hidden = true;

  const titleId = `confirm-title-${Math.random().toString(36).slice(2, 8)}`;
  const title = el('p', 'confirm__title', options.title);
  title.id = titleId;
  panel.setAttribute('aria-labelledby', titleId);

  if (variant === 'sheet') {
    // つまみ。下から引き出す板だと分かる目印
    const handle = el('span', 'confirm__handle');
    handle.setAttribute('aria-hidden', 'true');
    panel.append(handle);
  }

  panel.append(title, el('p', 'confirm__note', options.note));

  let hideTimer: number | undefined;

  function close(): void {
    window.clearTimeout(hideTimer);
    delete scrim.dataset.open;
    delete panel.dataset.open;
    // 出入りの動きが終わってから隠す
    hideTimer = window.setTimeout(() => {
      scrim.hidden = true;
      panel.hidden = true;
    }, 400);
    lastFocus?.focus();
  }

  const confirmButton = button('confirm__btn confirm__btn--main', options.confirmLabel, () => {
    close();
    options.onConfirm();
  });
  const cancelButton = button('confirm__btn confirm__btn--quiet', options.cancelLabel, close);

  const buttons = el('div', 'confirm__buttons');
  if (variant === 'modal') {
    buttons.append(cancelButton, confirmButton);
  } else {
    buttons.append(confirmButton, cancelButton);
  }
  panel.append(buttons);

  scrim.addEventListener('click', close);

  /** Esc で閉じられるようにする。開いているあいだだけ見る */
  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') close();
  }

  let lastFocus: HTMLElement | undefined;

  function open(): void {
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    window.clearTimeout(hideTimer);
    scrim.hidden = false;
    panel.hidden = false;

    // hidden を外した直後だと、出入りの動きが始まらない
    requestAnimationFrame(() => {
      scrim.dataset.open = 'true';
      panel.dataset.open = 'true';
      // 先に目が行くのは「やめる」側。結果が消える操作なので、
      // 何も考えずに Enter を押しても戻れるようにする
      cancelButton.focus();
    });
  }

  document.addEventListener('keydown', onKeyDown);

  return {
    elements: [scrim, panel],
    open,
    destroy() {
      window.clearTimeout(hideTimer);
      document.removeEventListener('keydown', onKeyDown);
      scrim.removeEventListener('click', close);
    },
  };
}
