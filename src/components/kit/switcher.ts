import {
  createDemoFrame,
  createMemoBar,
  createTapper,
  MEMO_FEED_ITEMS,
  memoListHtml,
} from './memoApp';
import { createScheduler } from './scheduler';
import type { KitDemo, KitDemoInstance } from './types';

/**
 * K7 切り替えの形：セグメントコントロール ／ タブ。
 *
 * AもBも、押す場所も中身もまったく同じにしてある。
 * 違うのは切り替えの部品の形と、置かれる場所だけ。
 *   1. 選んだ印  … 面の中をつまみが横に動く／見出しの下の線が動く
 *   2. 置き場所  … 中身の上に置く面／バーの下にくっつく見出しの列
 *
 * 動きを止める設定でも、形と置き場所の差はそのまま残る（要件 §4.2）。
 */

/** 絞り込みの2つ。どちらの部品でも同じ言葉にする */
const FILTERS = [
  { id: 'all', name: 'すべて' },
  { id: 'favorite', name: 'お気に入り' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

/** すべて：4件。お気に入り：そのうちの2件 */
const ALL_ITEMS = MEMO_FEED_ITEMS.slice(0, 4);
const FAVORITE_ITEMS = [MEMO_FEED_ITEMS[0], MEMO_FEED_ITEMS[3]];

const PLAY_LEAD_MS = 450;

/** 最初の状態を見せる時間 */
const FIRST_HOLD_MS = 1000;

/** 切り替えたあと、そのまま見せる時間。印の位置と件数の両方を見る */
const SWITCHED_HOLD_MS = 1300;

function switcherBase(variant: 'segmented' | 'tabs'): KitDemoInstance {
  const scheduler = createScheduler();
  const tap = createTapper(scheduler);
  const { frame, screen } = createDemoFrame();

  const listeners = new AbortController();
  const { signal } = listeners;

  const app = document.createElement('div');
  app.className = 'memo';
  app.append(createMemoBar('メモ').element);

  // --- 切り替えの部品 ---
  const control = document.createElement('div');
  control.className = variant === 'segmented' ? 'kit-seg' : 'kit-tabs';
  control.setAttribute('role', 'tablist');
  control.setAttribute('aria-label', 'メモの絞り込み');

  // 選んだ印。どちらも、押した側へ横に動く
  const ink = document.createElement('span');
  ink.className = variant === 'segmented' ? 'kit-seg__thumb' : 'kit-tabs__ink';
  ink.setAttribute('aria-hidden', 'true');
  control.append(ink);

  const buttons = new Map<FilterId, HTMLButtonElement>();
  for (const filter of FILTERS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = variant === 'segmented' ? 'kit-seg__btn' : 'kit-tabs__btn';
    button.setAttribute('role', 'tab');
    button.textContent = filter.name;
    buttons.set(filter.id, button);
    control.append(button);
  }

  // --- 中身（絞り込んだ一覧） ---
  const body = document.createElement('div');
  body.className = 'memo__body memo__body--pages';

  const views = new Map<FilterId, HTMLElement>();
  for (const filter of FILTERS) {
    const view = document.createElement('div');
    view.className = 'memo__page';
    view.innerHTML = memoListHtml(filter.id === 'all' ? ALL_ITEMS : FAVORITE_ITEMS);
    views.set(filter.id, view);
    body.append(view);
  }

  /**
   * セグメントコントロールは中身の上に置く面、
   * タブはバーの下にくっつく見出しの列。本物の置き方の違いをそのまま出す。
   */
  if (variant === 'segmented') {
    const head = document.createElement('div');
    head.className = 'kit-seg-wrap';
    head.append(control);
    app.append(head, body);
  } else {
    app.append(control, body);
  }

  screen.append(app);

  function select(target: FilterId): void {
    const index = FILTERS.findIndex((filter) => filter.id === target);
    // 印の位置はここだけで決める。CSSは「何番目か」しか見ない
    control.dataset.selected = String(index);

    for (const [id, view] of views) {
      view.classList.toggle('memo__page--on', id === target);
    }
    for (const [id, button] of buttons) {
      const selected = id === target;
      button.setAttribute('aria-selected', String(selected));
      button.classList.toggle(
        variant === 'segmented' ? 'kit-seg__btn--on' : 'kit-tabs__btn--on',
        selected,
      );
    }
  }

  for (const [id, button] of buttons) {
    button.addEventListener('click', () => select(id), { signal });
  }

  function reset(): void {
    select('all');
  }

  reset();

  return {
    element: frame,
    reset,

    /** [お気に入り] → 印が動いて2件になる → [すべて] → 4件に戻る（最初の状態） */
    async play(): Promise<void> {
      reset();
      await scheduler.hold(PLAY_LEAD_MS);
      if (scheduler.cancelled) return;

      const favorite = buttons.get('favorite');
      const all = buttons.get('all');
      if (!favorite || !all) return;

      await scheduler.hold(FIRST_HOLD_MS);
      if (scheduler.cancelled) return;

      await tap(favorite, () => select('favorite'));
      if (scheduler.cancelled) return;
      await scheduler.hold(SWITCHED_HOLD_MS);
      if (scheduler.cancelled) return;

      await tap(all, () => select('all'));
      await scheduler.hold(300);
    },

    destroy(): void {
      scheduler.cancel();
      listeners.abort();
    },
  };
}

export const segmentedDemo: KitDemo = {
  id: 'segmented',
  create: () => switcherBase('segmented'),
};

export const tabsDemo: KitDemo = {
  id: 'tabs',
  create: () => switcherBase('tabs'),
};
