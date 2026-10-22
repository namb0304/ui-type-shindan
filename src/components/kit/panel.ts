import { createDemoFrame, demoButton, memoBodyHtml } from './memoApp';
import { createScheduler } from './scheduler';
import type { KitDemo, KitDemoInstance } from './types';

/**
 * K5 確認・選択パネル：モーダル ／ ボトムシート。
 *
 * 差が出るのは次の2点。
 *   1. 出てくる場所 … 真ん中に浮く／下の縁にくっついてせり上がる
 *   2. ボタンの並び … 横に並ぶ／縦に積む（親指で届く位置に来る）
 *
 * 自動再生では**開いたまま止める**。開いた状態こそが見比べたいものなので、
 * 閉じてしまうと差が残らない。
 *
 * ページの中の見本なので、Esc での閉じ方やフォーカスの閉じ込めまではやらない
 * （本物の実装では必要。ここでは閉じる手段をボタンと背景タップに絞る）。
 */

const PLAY_LEAD_MS = 450;

function panelBase(variant: 'modal' | 'sheet'): KitDemoInstance {
  const scheduler = createScheduler();
  const { frame, screen } = createDemoFrame();

  const app = document.createElement('div');
  app.className = 'memo';
  app.innerHTML = `
    <div class="memo__bar"><span class="memo__bar-title">メモ</span></div>
    ${memoBodyHtml()}
  `;

  const actions = document.createElement('div');
  actions.className = 'memo__actions';
  const deleteButton = demoButton('削除', 'quiet');
  actions.append(deleteButton);
  app.append(actions);
  screen.append(app);

  // --- 背景の幕 ---
  const scrim = document.createElement('div');
  scrim.className = 'kit-scrim';

  // --- パネル本体 ---
  const panel = document.createElement('div');
  panel.className = `kit-panel kit-panel--${variant}`;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'メモの削除の確認');

  if (variant === 'sheet') {
    // つまみ。下から引き出す板だと分かる目印
    const handle = document.createElement('span');
    handle.className = 'kit-panel__handle';
    handle.setAttribute('aria-hidden', 'true');
    panel.append(handle);
  }

  const message = document.createElement('p');
  message.className = 'kit-panel__text';
  message.textContent = 'このメモを削除しますか？';

  const buttons = document.createElement('div');
  buttons.className = 'kit-panel__buttons';
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'kit-panel__btn kit-panel__btn--main';
  confirm.textContent = '削除する';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'kit-panel__btn';
  cancel.textContent = 'やめる';

  // モーダルは横並びで「やめる → 削除する」、ボトムシートは縦積みで
  // 押したいほうを上に置く。実際のUIでの並べ方の違いをそのまま出す
  if (variant === 'modal') {
    buttons.append(cancel, confirm);
  } else {
    buttons.append(confirm, cancel);
  }

  panel.append(message, buttons);
  frame.append(scrim, panel);

  function open(): void {
    frame.dataset.panelOpen = 'true';
  }

  function close(): void {
    delete frame.dataset.panelOpen;
  }

  deleteButton.addEventListener('click', open);
  scrim.addEventListener('click', close);
  cancel.addEventListener('click', close);
  confirm.addEventListener('click', close);

  return {
    element: frame,

    async play(): Promise<void> {
      await scheduler.wait(PLAY_LEAD_MS);
      if (scheduler.cancelled) return;
      open();
      // 開ききるまで待って、開いたまま止める
      await scheduler.wait(900);
    },

    destroy(): void {
      scheduler.cancel();
      deleteButton.removeEventListener('click', open);
      scrim.removeEventListener('click', close);
      cancel.removeEventListener('click', close);
      confirm.removeEventListener('click', close);
    },
  };
}

export const modalDemo: KitDemo = {
  id: 'modal',
  create: () => panelBase('modal'),
};

export const bottomSheetDemo: KitDemo = {
  id: 'bottom-sheet',
  create: () => panelBase('sheet'),
};
