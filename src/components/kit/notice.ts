import { createDemoFrame, createTapper, demoButton, memoBodyHtml } from './memoApp';
import { createScheduler } from './scheduler';
import type { KitDemo, KitDemoInstance } from './types';

/**
 * K4 お知らせの出し方：トースト ／ バナー。
 *
 * 差が出るのは次の2点。どちらも「動かしてみないと分からない」ことなので、
 * 説明文ではなく実物で見せる。
 *   1. 出る位置     … 画面の下／画面の上
 *   2. 消え方       … 1.8秒で自分で消える／閉じるまで残る
 *
 * バナーは中身を押し下げて出す（grid-template-rows の 0fr → 1fr）。
 * 浮いて重なるトーストとの違いが、場所だけでなく「場所を取るかどうか」でも出る。
 */

/** お知らせが自分で消えるまでの時間。 */
const TOAST_LIFETIME_MS = 1800;

/** 自動再生で、押すまでの間。いきなり動くと見逃すため少し待つ */
const PLAY_LEAD_MS = 450;

/** バナーを出したまま見せる時間。押すまで消えないことが伝わる長さにする */
const BANNER_HOLD_MS = 2600;

function noticeBase(variant: 'toast' | 'banner'): KitDemoInstance {
  const scheduler = createScheduler();
  const tap = createTapper(scheduler);
  const { frame, screen } = createDemoFrame();

  const app = document.createElement('div');
  app.className = 'memo';
  app.innerHTML = `
    <div class="memo__bar"><span class="memo__bar-title">メモ</span></div>
    ${memoBodyHtml()}
  `;

  const actions = document.createElement('div');
  actions.className = 'memo__actions';
  const saveButton = demoButton('保存');
  actions.append(saveButton);
  app.append(actions);

  screen.append(app);

  // --- お知らせ本体 ---
  const notice = document.createElement('div');
  notice.className = `kit-notice kit-notice--${variant}`;
  notice.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.className = 'kit-notice__text';
  text.textContent = '保存しました';
  notice.append(text);

  let closeButton: HTMLButtonElement | undefined;
  if (variant === 'banner') {
    // バナーは自分で閉じる。閉じる手段があること自体が、トーストとの違い
    closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'kit-notice__close';
    closeButton.setAttribute('aria-label', 'お知らせを閉じる');
    closeButton.textContent = '✕';
    notice.append(closeButton);
  }

  if (variant === 'toast') {
    // 画面の上に浮かせる。中身の場所は取らない。
    // 外枠ではなく内側の画面に入れるので、角丸に沿って切り取られる
    screen.append(notice);
  } else {
    // 中身を押し下げて、場所を取って居座る
    const slot = document.createElement('div');
    slot.className = 'kit-notice__slot';
    slot.append(notice);
    screen.insertBefore(slot, app);
  }

  let hideToken = 0;

  function show(): void {
    frame.dataset.noticeOpen = 'true';
    if (variant !== 'toast') return;

    // 連打されたとき、古いタイマーで消さないように世代を持つ
    hideToken += 1;
    const token = hideToken;
    void scheduler.hold(TOAST_LIFETIME_MS).then(() => {
      if (scheduler.cancelled || token !== hideToken) return;
      delete frame.dataset.noticeOpen;
    });
  }

  function hide(): void {
    delete frame.dataset.noticeOpen;
  }

  function reset(): void {
    // 待っている消去タイマーを無効にしてから閉じる
    hideToken += 1;
    hide();
  }

  saveButton.addEventListener('click', show);
  closeButton?.addEventListener('click', hide);

  return {
    element: frame,
    reset,

    /**
     * トースト：[保存] → 出る → 数秒で自分で消える（押さなくても戻る）
     * バナー  ：[保存] → 出る → 2.6秒そのまま → [✕] → 閉じる
     */
    async play(): Promise<void> {
      reset();
      await scheduler.hold(PLAY_LEAD_MS);
      if (scheduler.cancelled) return;

      await tap(saveButton, show);
      if (scheduler.cancelled) return;

      if (variant === 'toast') {
        // 自分で消えるまでを見せきる。ここで最初の状態に戻る
        await scheduler.hold(TOAST_LIFETIME_MS + 500);
        return;
      }

      // バナーは押すまで消えない。そのことを見せてから、✕を押して閉じる
      await scheduler.hold(BANNER_HOLD_MS);
      if (scheduler.cancelled || !closeButton) return;
      await tap(closeButton, hide);
      await scheduler.hold(300);
    },

    destroy(): void {
      scheduler.cancel();
      saveButton.removeEventListener('click', show);
      closeButton?.removeEventListener('click', hide);
    },
  };
}

export const toastDemo: KitDemo = {
  id: 'toast',
  create: () => noticeBase('toast'),
};

export const bannerDemo: KitDemo = {
  id: 'banner',
  create: () => noticeBase('banner'),
};
