import {
  createDemoFrame,
  createMemoBar,
  MEMO_FEED_ITEMS,
  memoCardsHtml,
  memoListHtml,
} from './memoApp';
import { createScheduler } from './scheduler';
import { scrollToBottom, scrollToTop } from './scroll';
import type { KitDemo, KitDemoInstance } from './types';

/**
 * K2 一覧の見せ方：リスト ／ カード。
 *
 * 中身はどちらも同じ10件。差が出るのは次の2点。
 *   1. 1画面に入る件数 … リストは7件ほど／カードは2〜3件
 *   2. 1件の目立ち方   … 行の区切りだけ／1件が1枚の面になる
 *
 * この問題だけはボタンを押さない。押して何かが起きる部品ではなく、
 * 「同じ中身が、どれだけ一度に見渡せるか」を見せるものなので、
 * 再生ではスクロールだけをする（下まで行って、先頭まで戻る）。
 *
 * 動きを止める設定でもスクロールが瞬間移動になるだけで、
 * 1画面に入る件数という差はそのまま残る（要件 §4.2）。
 */

/** 最初の状態を見せる時間。1画面に何件入るかを数えられる長さにする */
const PLAY_LEAD_MS = 1100;

/** 下まで行くのにかける時間。速すぎると量が分からない */
const SCROLL_DOWN_MS = 1000;

/** いちばん下を見せる時間 */
const BOTTOM_HOLD_MS = 900;

/** 先頭まで戻るのにかける時間。戻りは用が済んでいるので少し速く */
const SCROLL_UP_MS = 800;

function listBase(variant: 'list' | 'card'): KitDemoInstance {
  const scheduler = createScheduler();
  const { frame, screen } = createDemoFrame();

  const app = document.createElement('div');
  app.className = 'memo';
  app.append(createMemoBar('メモ').element);

  // 指でもスクロールできるようにしておく（デモは触って試せる・要件 §5）
  const feed = document.createElement('div');
  feed.className = `memo__feed memo__feed--${variant}`;
  feed.innerHTML =
    variant === 'list' ? memoListHtml(MEMO_FEED_ITEMS) : memoCardsHtml(MEMO_FEED_ITEMS);

  app.append(feed);
  screen.append(app);

  function reset(): void {
    feed.scrollTop = 0;
  }

  return {
    element: frame,
    reset,

    /** 先頭で少し止まる → 下までスクロール → 少し止まる → 先頭に戻る */
    async play(): Promise<void> {
      reset();
      await scheduler.hold(PLAY_LEAD_MS);
      if (scheduler.cancelled) return;

      await scrollToBottom(feed, SCROLL_DOWN_MS, scheduler);
      if (scheduler.cancelled) return;

      await scheduler.hold(BOTTOM_HOLD_MS);
      if (scheduler.cancelled) return;

      await scrollToTop(feed, SCROLL_UP_MS, scheduler);
      await scheduler.hold(200);
    },

    destroy(): void {
      scheduler.cancel();
    },
  };
}

export const listDemo: KitDemo = {
  id: 'list',
  create: () => listBase('list'),
};

export const cardDemo: KitDemo = {
  id: 'card',
  create: () => listBase('card'),
};
