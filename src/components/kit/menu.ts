import {
  createBurgerButton,
  createDemoFrame,
  createMemoBar,
  createTapper,
  memoListHtml,
  type MemoBar,
} from './memoApp';
import { createScheduler } from './scheduler';
import type { KitDemo, KitDemoInstance } from './types';

/**
 * K1 メニューの出し方：ハンバーガーメニュー ／ ボトムナビ。
 *
 * 差が出るのは次の3点。どれも「行き先が隠れているか」から来ている。
 *   1. 行き先が目に入るか … 押すまで分からない／いつも並んでいる
 *   2. 1か所動くのに何回押すか … 2回（開いて選ぶ）／1回
 *   3. 中身の広さ … 画面いっぱい／下の帯に少し取られる
 *
 * 動きを止める設定でも、1と3は見ただけで分かる（要件 §4.2）。
 */

/** 行き先。どちらの部品でも同じ3つにして、置き方だけが違うようにする。 */
const DESTINATIONS = [
  { id: 'memo', name: 'メモ' },
  { id: 'search', name: '検索' },
  { id: 'settings', name: '設定' },
] as const;

type PageId = (typeof DESTINATIONS)[number]['id'];

/** 自動再生で、押すまでの間。いきなり動くと見逃すため少し待つ */
const PLAY_LEAD_MS = 450;

/** 引き出しを開けたまま見せる時間。行き先3つを読める長さにする */
const DRAWER_HOLD_MS = 1200;

/** 行き先を変えたあと、そのまま見せる時間 */
const PAGE_HOLD_MS = 900;

/** 設定の画面。行き先が本当に変わったと分かればよいので、中身は3行だけ */
const SETTING_ROWS = ['文字の大きさ', '通知', 'バックアップ'] as const;

function pageHtml(page: PageId): string {
  if (page === 'memo') return memoListHtml();

  if (page === 'search') {
    // 欄の形だけ置く。ここで文字を打つのは K8（入力ミスの伝え方）の役目
    return `
      <div class="memo__search" aria-hidden="true">
        <span class="memo__search-icon"></span>
        <span class="memo__search-text">メモを探す</span>
      </div>
    `;
  }

  const rows = SETTING_ROWS.map(
    (label) => `
      <li class="memo__row">
        <span class="memo__row-title">${label}</span>
      </li>
    `,
  ).join('');
  return `<ul class="memo__list">${rows}</ul>`;
}

function createPages(): { element: HTMLElement; show: (page: PageId) => void } {
  const element = document.createElement('div');
  element.className = 'memo__body memo__body--pages';

  const pages = new Map<PageId, HTMLElement>();
  for (const destination of DESTINATIONS) {
    const page = document.createElement('div');
    page.className = 'memo__page';
    page.innerHTML = pageHtml(destination.id);
    pages.set(destination.id, page);
    element.append(page);
  }

  return {
    element,
    show(target: PageId) {
      for (const [id, page] of pages) {
        page.classList.toggle('memo__page--on', id === target);
      }
    },
  };
}

function menuBase(variant: 'drawer' | 'nav'): KitDemoInstance {
  const scheduler = createScheduler();
  const tap = createTapper(scheduler);
  const { frame, screen } = createDemoFrame();

  // イベントの後片付け。画面を離れたら signal で一括して外す
  const listeners = new AbortController();
  const { signal } = listeners;

  const app = document.createElement('div');
  app.className = 'memo';

  const pages = createPages();

  /** 行き先のボタン。引き出しの中／下の帯のどちらかに置く */
  const destinationButtons = new Map<PageId, HTMLButtonElement>();

  let bar: MemoBar;
  let burger: HTMLButtonElement | undefined;
  if (variant === 'drawer') {
    burger = createBurgerButton();
    bar = createMemoBar('メモ', burger);
  } else {
    bar = createMemoBar('メモ');
  }

  app.append(bar.element, pages.element);

  function openDrawer(): void {
    frame.dataset.drawerOpen = 'true';
  }

  function closeDrawer(): void {
    delete frame.dataset.drawerOpen;
  }

  /** 行き先を変える。中身とバーの題の両方が変わる */
  function goTo(page: PageId): void {
    const destination = DESTINATIONS.find((candidate) => candidate.id === page);
    pages.show(page);
    if (destination) bar.setTitle(destination.name);

    for (const [id, item] of destinationButtons) {
      const selected = id === page;
      item.classList.toggle('memo__nav-item--on', selected && variant === 'nav');
      if (selected) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    }
  }

  if (variant === 'drawer') {
    // 幕。開いているあいだ、後ろの中身を押せないようにする役目も持つ
    const scrim = document.createElement('div');
    scrim.className = 'kit-scrim';
    scrim.addEventListener('click', closeDrawer, { signal });

    const drawer = document.createElement('nav');
    drawer.className = 'kit-drawer';
    drawer.setAttribute('aria-label', 'メニュー');

    for (const destination of DESTINATIONS) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'kit-drawer__item';
      item.textContent = destination.name;
      item.addEventListener(
        'click',
        () => {
          // 引き出しを閉じてから中身を変える。本物もこの順で動く
          closeDrawer();
          goTo(destination.id);
        },
        { signal },
      );
      destinationButtons.set(destination.id, item);
      drawer.append(item);
    }

    burger?.addEventListener('click', openDrawer, { signal });
    screen.append(app, scrim, drawer);
  } else {
    const nav = document.createElement('nav');
    nav.className = 'memo__nav';
    nav.setAttribute('aria-label', 'メニュー');

    for (const destination of DESTINATIONS) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'memo__nav-item';
      item.innerHTML = `
        <span class="memo__nav-icon memo__nav-icon--${destination.id}" aria-hidden="true"></span>
        <span class="memo__nav-label">${destination.name}</span>
      `;
      item.addEventListener('click', () => goTo(destination.id), { signal });
      destinationButtons.set(destination.id, item);
      nav.append(item);
    }

    app.append(nav);
    screen.append(app);
  }

  function reset(): void {
    closeDrawer();
    goTo('memo');
  }

  reset();

  return {
    element: frame,
    reset,

    /**
     * ハンバーガー：[三本線] → 行き先が出る → [設定] → 設定の画面
     *               → [三本線] → [メモ] → 一覧に戻る（押すのは4回）
     * ボトムナビ  ：[設定] → 設定の画面 → [メモ] → 一覧に戻る（押すのは2回）
     *
     * 押す回数の差は部品の差そのものなので、わざとそろえない。
     */
    async play(): Promise<void> {
      reset();
      await scheduler.wait(PLAY_LEAD_MS);
      if (scheduler.cancelled) return;

      const settings = destinationButtons.get('settings');
      const memo = destinationButtons.get('memo');
      if (!settings || !memo) return;

      if (variant === 'nav') {
        await tap(settings, () => goTo('settings'));
        if (scheduler.cancelled) return;
        await scheduler.wait(PAGE_HOLD_MS);
        if (scheduler.cancelled) return;

        await tap(memo, () => goTo('memo'));
        await scheduler.wait(300);
        return;
      }

      if (!burger) return;

      // 1回目：開いて、設定へ
      await tap(burger, openDrawer);
      if (scheduler.cancelled) return;
      await scheduler.wait(DRAWER_HOLD_MS);
      if (scheduler.cancelled) return;

      await tap(settings, () => {
        closeDrawer();
        goTo('settings');
      });
      if (scheduler.cancelled) return;
      await scheduler.wait(PAGE_HOLD_MS);
      if (scheduler.cancelled) return;

      // 2回目：戻るときも、もう一度開く必要がある
      await tap(burger, openDrawer);
      if (scheduler.cancelled) return;
      await scheduler.wait(600);
      if (scheduler.cancelled) return;

      await tap(memo, () => {
        closeDrawer();
        goTo('memo');
      });
      await scheduler.wait(300);
    },

    destroy(): void {
      scheduler.cancel();
      listeners.abort();
    },
  };
}

export const hamburgerDemo: KitDemo = {
  id: 'hamburger',
  create: () => menuBase('drawer'),
};

export const bottomNavDemo: KitDemo = {
  id: 'bottom-nav',
  create: () => menuBase('nav'),
};
