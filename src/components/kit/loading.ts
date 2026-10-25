import {
  createDemoFrame,
  createTapper,
  demoButton,
  MEMO_LIST_ITEMS,
  memoListHtml,
} from './memoApp';
import { createScheduler } from './scheduler';
import type { KitDemo, KitDemoInstance } from './types';

/**
 * K6 読み込み中の見せ方：スケルトンスクリーン ／ スピナー。
 *
 * 差が出るのは次の2点。
 *   1. 待っている間に、出てくる中身の形と量が分かるか
 *   2. 中身が出たときに、文字が「待っていた場所」にそのまま入るか
 *
 * 2つめを見せるため、スケルトンは**本物と同じ行数・同じ行位置**で作る
 * （灰色の帯の高さを、文字の行の高さに合わせてある。kit.css 参照）。
 * 中身に入れ替わっても1pxも動かないのがスケルトンの利点なので、
 * 行がずれていると、この問題自体が成立しない。
 * スピナーのほうは、中身がどこに何行出るのか、出るまで分からない。
 */

/** 読み込みにかかる時間。短すぎると差が見えない */
const LOADING_MS = 1400;

const PLAY_LEAD_MS = 350;

function skeletonHtml(): string {
  // 本物の行と同じ数だけ並べる（高さをそろえるため）
  const rows = MEMO_LIST_ITEMS.map(
    () => `
      <li class="memo__row memo__row--skeleton">
        <span class="kit-skeleton__bar kit-skeleton__bar--title"></span>
        <span class="kit-skeleton__bar kit-skeleton__bar--note"></span>
      </li>
    `,
  ).join('');
  return `<ul class="memo__list" aria-hidden="true">${rows}</ul>`;
}

function spinnerHtml(): string {
  return `
    <div class="kit-spinner-wrap" aria-hidden="true">
      <span class="kit-spinner"></span>
    </div>
  `;
}

function loadingBase(variant: 'skeleton' | 'spinner'): KitDemoInstance {
  const scheduler = createScheduler();
  const tap = createTapper(scheduler);
  const { frame, screen } = createDemoFrame();

  const app = document.createElement('div');
  app.className = 'memo';
  app.innerHTML = `<div class="memo__bar"><span class="memo__bar-title">メモ</span></div>`;

  // 待っている間に出すもの
  const waiting = document.createElement('div');
  waiting.className = 'memo__body memo__body--waiting';
  waiting.innerHTML = variant === 'skeleton' ? skeletonHtml() : spinnerHtml();

  // 読み込みが終わったら出すもの
  const loaded = document.createElement('div');
  loaded.className = 'memo__body memo__body--loaded';
  loaded.innerHTML = memoListHtml();

  app.append(waiting, loaded);

  const actions = document.createElement('div');
  actions.className = 'memo__actions';
  const reloadButton = demoButton('もう一度読み込む', { quiet: true });
  actions.append(reloadButton);
  app.append(actions);

  screen.append(app);

  let loadToken = 0;

  function startLoading(): Promise<void> {
    frame.dataset.loading = 'true';
    loadToken += 1;
    const token = loadToken;

    return scheduler.hold(LOADING_MS).then(() => {
      if (scheduler.cancelled || token !== loadToken) return;
      delete frame.dataset.loading;
    });
  }

  function onReload(): void {
    void startLoading();
  }

  reloadButton.addEventListener('click', onReload);

  /**
   * 最初の状態は「一覧が出ている状態」。
   * 読み込み中で止めて始めると、読み込みが**始まる瞬間**が見られず、
   * 一覧に変わるところしか見えない。
   */
  function reset(): void {
    loadToken += 1;
    delete frame.dataset.loading;
  }

  return {
    element: frame,
    reset,

    /** [もう一度読み込む] → 読み込み中 → 一覧が出る（＝最初の状態に戻る） */
    async play(): Promise<void> {
      reset();
      await scheduler.hold(PLAY_LEAD_MS);
      if (scheduler.cancelled) return;

      let loading: Promise<void> = Promise.resolve();
      await tap(reloadButton, () => {
        loading = startLoading();
      });
      await loading;

      // 中身が出たところを見せてから次へ
      await scheduler.hold(600);
    },

    destroy(): void {
      scheduler.cancel();
      reloadButton.removeEventListener('click', onReload);
    },
  };
}

export const skeletonDemo: KitDemo = {
  id: 'skeleton',
  create: () => loadingBase('skeleton'),
};

export const spinnerDemo: KitDemo = {
  id: 'spinner',
  create: () => loadingBase('spinner'),
};
