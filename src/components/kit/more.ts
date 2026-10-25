import {
  createDemoFrame,
  createMemoBar,
  createMemoRow,
  createTapper,
  demoButton,
  MEMO_FEED_ITEMS,
  MEMO_MORE_ITEMS,
  memoListHtml,
} from './memoApp';
import { createScheduler } from './scheduler';
import { scrollToBottom, scrollToTop } from './scroll';
import type { KitDemo, KitDemoInstance } from './types';

/**
 * K3 続きの見せ方：無限スクロール ／「もっと見る」ボタン。
 *
 * どちらも最初は10件で、続きを読み込むと3件増える。
 * 差が出るのは次の2点。
 *   1. 増えるきっかけ … 下まで行くと勝手に／押したときだけ
 *   2. 下に終わりが来るか … 読み込みの印が出て続く／ボタンで止まっている
 *
 * 指でスクロールして下まで行ったときも、無限スクロールのほうは
 * 本当に勝手に増える（見ているだけでなく、触っても同じように動く）。
 * 自動再生中だけは段取りを乱さないよう、この見張りを止める。
 *
 * 動きを止める設定でも、増えるきっかけの差は残る（要件 §4.2）。
 */

/** 読み込みにかかる時間。短すぎると「勝手に増えた」ことが分からない */
const LOADING_MS = 900;

const PLAY_LEAD_MS = 350;

/** 下まで行くのにかける時間 */
const SCROLL_DOWN_MS = 1000;

/** ボタンを見せる時間。「押すまで増えない」ことが伝わる長さにする */
const BUTTON_HOLD_MS = 800;

/** 増えたあとを見せる時間 */
const LOADED_HOLD_MS = 500;

/** 増えたぶんを見にいくのにかける時間 */
const SCROLL_MORE_MS = 900;

const SCROLL_UP_MS = 800;

/** いちばん下とみなす余裕。ぴったりを求めると端末によって発火しない */
const BOTTOM_SLACK_PX = 8;

function moreBase(variant: 'infinite' | 'button'): KitDemoInstance {
  const scheduler = createScheduler();
  const tap = createTapper(scheduler);
  const { frame, screen } = createDemoFrame();

  const listeners = new AbortController();
  const { signal } = listeners;

  const app = document.createElement('div');
  app.className = 'memo';
  app.append(createMemoBar('メモ').element);

  const feed = document.createElement('div');
  feed.className = 'memo__feed memo__feed--list';
  feed.innerHTML = memoListHtml(MEMO_FEED_ITEMS);
  const list = feed.querySelector('.memo__list') as HTMLUListElement;

  /**
   * 一覧のいちばん下。
   *
   * どちらの部品でも同じ高さを空けておく。片方だけ詰まっていると、
   * 「ボタンがあるぶん窮屈」という関係ない差が混ざる。
   */
  const foot = document.createElement('div');
  foot.className = 'kit-more__foot';

  let moreButton: HTMLButtonElement | undefined;
  if (variant === 'infinite') {
    foot.innerHTML = `
      <span class="kit-more__loading" aria-hidden="true">
        <span class="kit-spinner"></span>
      </span>
    `;
  } else {
    moreButton = demoButton('もっと見る');
    moreButton.classList.add('kit-more__btn');
    foot.append(moreButton);
  }

  feed.append(foot);
  app.append(feed);
  screen.append(app);

  /** 増やした行。reset で取り除くために覚えておく */
  const added: HTMLElement[] = [];
  let loading = false;
  /** 自動再生のあいだは、スクロールの見張りを止める */
  let playing = false;

  async function load(): Promise<void> {
    if (loading || added.length > 0) return;
    loading = true;

    // 無限スクロールは、読み込み中であることを印で見せる。
    // ボタンのほうは押した手応えがあるので、印は出さずにすぐ増やす
    if (variant === 'infinite') {
      frame.dataset.loading = 'true';
      await scheduler.hold(LOADING_MS);
      delete frame.dataset.loading;
      if (scheduler.cancelled) {
        loading = false;
        return;
      }
    }

    for (const item of MEMO_MORE_ITEMS) {
      const row = createMemoRow(item);
      list.append(row);
      added.push(row);
    }
    loading = false;
  }

  function atBottom(): boolean {
    return feed.scrollTop + feed.clientHeight >= feed.scrollHeight - BOTTOM_SLACK_PX;
  }

  if (variant === 'infinite') {
    feed.addEventListener(
      'scroll',
      () => {
        if (playing || !atBottom()) return;
        void load();
      },
      { signal, passive: true },
    );
  } else {
    moreButton?.addEventListener('click', () => void load(), { signal });
  }

  function reset(): void {
    loading = false;
    delete frame.dataset.loading;
    for (const row of added) row.remove();
    added.length = 0;
    feed.scrollTop = 0;
  }

  return {
    element: frame,
    reset,

    /**
     * 無限スクロール：下まで行く → 読み込みの印 → 勝手に3件増える → 増えたぶんを見る
     * もっと見る    ：下まで行く → ボタンが見えている → [もっと見る] → 3件増える
     *
     * 最後は先頭に戻し、増えた3件も取り除いて最初の状態に戻す。
     */
    async play(): Promise<void> {
      playing = true;
      try {
        reset();
        await scheduler.hold(PLAY_LEAD_MS);
        if (scheduler.cancelled) return;

        await scrollToBottom(feed, SCROLL_DOWN_MS, scheduler);
        if (scheduler.cancelled) return;

        if (variant === 'infinite') {
          // 押していないのに増えるところを見せる
          await scheduler.hold(300);
          if (scheduler.cancelled) return;
          await load();
        } else {
          await scheduler.hold(BUTTON_HOLD_MS);
          if (scheduler.cancelled || !moreButton) return;
          await tap(moreButton, () => void load());
        }
        if (scheduler.cancelled) return;

        await scheduler.hold(LOADED_HOLD_MS);
        if (scheduler.cancelled) return;

        // 増えた3件を見にいく
        await scrollToBottom(feed, SCROLL_MORE_MS, scheduler);
        if (scheduler.cancelled) return;
        await scheduler.hold(LOADED_HOLD_MS);
        if (scheduler.cancelled) return;

        await scrollToTop(feed, SCROLL_UP_MS, scheduler);
        reset();
      } finally {
        playing = false;
      }
    },

    destroy(): void {
      scheduler.cancel();
      listeners.abort();
    },
  };
}

export const infiniteScrollDemo: KitDemo = {
  id: 'infinite-scroll',
  create: () => moreBase('infinite'),
};

export const loadMoreDemo: KitDemo = {
  id: 'load-more',
  create: () => moreBase('button'),
};
