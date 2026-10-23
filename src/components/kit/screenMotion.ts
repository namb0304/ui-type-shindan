import { createDemoFrame, createMemoBar, createTapper, MEMO_LIST_ITEMS } from './memoApp';
import { createScheduler } from './scheduler';
import type { KitDemo, KitDemoInstance } from './types';

/**
 * K9 動きの速さ ／ K10 画面の切り替わり。
 *
 * この2問は**まったく同じデモ**を使う。
 * 同じ一覧の同じ行を押し、同じ詳細を開いて、同じボタンで戻る。
 * 違うのは、切り替わるときの動き方だけ。
 *
 *   K9  … 出方はフェードで固定し、**速さと動き方**を変える
 *          きびきび：短く、まっすぐ止まる
 *          ふんわり：長く、行き過ぎてから少し戻る（弾む）
 *   K10 … 速さは固定し、**出方**を変える
 *          スライド：横から入ってくる
 *          フェード：薄いところから浮かび上がる
 *
 * 速さと動き方はCSS変数で持ち、data-speed / data-transition で切り替える。
 * JSから style で直接書かない。インラインの指定は
 * 「動きを減らす」設定の打ち消し（--kit-duration: 0s）に勝ってしまい、
 * 動きを止めたい人の画面でも動いてしまうため。
 *
 * この2問だけは、動きを止めると本当に差が出ない。
 * そのときは質問画面が案内を出す（kitQuestionView.ts・要件 §4.2）。
 */

const PLAY_LEAD_MS = 450;

/** 詳細を開いたまま見せる時間 */
const DETAIL_HOLD_MS = 900;

/** 一覧に戻ってから、もう一度開くまでの間 */
const BETWEEN_MS = 600;

interface MotionVariant {
  /** 速さの指定。null なら質問画面のニュートラル（0.25秒）のまま */
  speed: 'snappy' | 'soft' | null;
  transition: 'slide' | 'fade';
}

function screenMotionBase(variant: MotionVariant): KitDemoInstance {
  const scheduler = createScheduler();
  const tap = createTapper(scheduler);
  const { frame, screen } = createDemoFrame();

  const listeners = new AbortController();
  const { signal } = listeners;

  if (variant.speed) frame.dataset.speed = variant.speed;
  frame.dataset.transition = variant.transition;

  const stage = document.createElement('div');
  stage.className = 'kit-stage';

  // --- 一覧の画面 ---
  const listPane = document.createElement('div');
  listPane.className = 'kit-screen kit-screen--list';
  listPane.append(createMemoBar('メモ').element);

  const listBody = document.createElement('div');
  listBody.className = 'memo__body';
  const list = document.createElement('ul');
  list.className = 'memo__list';

  // 行は押せるようにする。タップの波紋を出すので button にしてある
  const rows = MEMO_LIST_ITEMS.map((item) => {
    const li = document.createElement('li');
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'memo__row memo__row--tappable';
    row.innerHTML = `
      <span class="memo__row-title">${item.title}</span>
      <span class="memo__row-note">${item.note}</span>
    `;
    li.append(row);
    list.append(li);
    return row;
  });

  listBody.append(list);
  listPane.append(listBody);

  // --- 詳細の画面 ---
  const detailPane = document.createElement('div');
  detailPane.className = 'kit-screen kit-screen--detail';

  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.className = 'memo__back';
  backButton.textContent = '← もどる';

  detailPane.append(createMemoBar(MEMO_LIST_ITEMS[0].title, backButton).element);

  const detailBody = document.createElement('div');
  detailBody.className = 'memo__body';
  detailBody.innerHTML = `
    <p class="memo__text memo__text--detail">牛乳／食パン／たまご<br />ねぎは2本でいい</p>
  `;
  detailPane.append(detailBody);

  stage.append(listPane, detailPane);
  screen.append(stage);

  function openDetail(): void {
    frame.dataset.view = 'detail';
  }

  function closeDetail(): void {
    frame.dataset.view = 'list';
  }

  for (const row of rows) {
    row.addEventListener('click', openDetail, { signal });
  }
  backButton.addEventListener('click', closeDetail, { signal });

  function reset(): void {
    closeDetail();
  }

  reset();

  return {
    element: frame,
    reset,

    /**
     * [買い物メモ] → 詳細 → [← もどる] → 一覧 を2回くり返す。
     *
     * 1周だと切り替わりが2回しか見られず、
     * AとBを続けて見たときに速さの差を覚えていられない。
     */
    async play(): Promise<void> {
      reset();
      await scheduler.wait(PLAY_LEAD_MS);
      if (scheduler.cancelled) return;

      const firstRow = rows[0];
      if (!firstRow) return;

      for (let round = 0; round < 2; round += 1) {
        await tap(firstRow, openDetail);
        if (scheduler.cancelled) return;
        await scheduler.wait(DETAIL_HOLD_MS);
        if (scheduler.cancelled) return;

        await tap(backButton, closeDetail);
        if (scheduler.cancelled) return;
        await scheduler.wait(round === 0 ? BETWEEN_MS : 300);
        if (scheduler.cancelled) return;
      }
    },

    destroy(): void {
      scheduler.cancel();
      listeners.abort();
    },
  };
}

/** K9-A きびきび。速さだけが違うので、出方はフェードで固定する */
export const snappyDemo: KitDemo = {
  id: 'snappy',
  create: () => screenMotionBase({ speed: 'snappy', transition: 'fade' }),
};

/** K9-B ふんわり */
export const softDemo: KitDemo = {
  id: 'soft',
  create: () => screenMotionBase({ speed: 'soft', transition: 'fade' }),
};

/** K10-A スライド。速さはニュートラル（0.25秒）のまま */
export const slideDemo: KitDemo = {
  id: 'slide',
  create: () => screenMotionBase({ speed: null, transition: 'slide' }),
};

/** K10-B フェード */
export const fadeDemo: KitDemo = {
  id: 'fade',
  create: () => screenMotionBase({ speed: null, transition: 'fade' }),
};
