import type { KitDemoInstance } from '../components/kit';
import { createScheduler } from '../components/kit/scheduler';
import { el } from './dom';

/**
 * 第2部のデモの再生を仕切る。質問画面と確認ページ（?debug=1）で共通に使う。
 *
 * やること：
 *   - 一度に動かすのは1つだけ（同時に動くと見比べられない）
 *   - 再生ボタンの表示を、状態に合わせて変える
 *   - スマホで「同じ場所で切り替える」ときの、表示中のデモの管理
 *
 * 表示中のデモの切り替えは `data-active` 属性でやり、どちらを出すかは
 * CSS（base.css のメディアクエリ）が決める。PC幅では両方出るので、
 * この属性は見た目に影響しない。
 */

export type PlayState = 'idle' | 'playing' | 'played';

/**
 * 再生ボタンの表示。
 * 「押すと何が起きるか」を書く（CLAUDE.md の文言のルール）。
 * 「見ました」のような状態の報告にはしない。
 */
const BUTTON_LABEL: Readonly<Record<PlayState, string>> = {
  idle: '▶ 動きを見る',
  playing: '再生中…',
  played: '▶ もう一度見る',
};

/** 自動再生で、1つめと2つめの間に置く間 */
const GAP_BETWEEN_DEMOS_MS = 600;

interface Entry {
  demo: KitDemoInstance;
  button: HTMLButtonElement;
  tab?: HTMLButtonElement;
  state: PlayState;
}

export interface KitPlayer {
  /** デモを登録して、そのデモ用の再生ボタンを受け取る */
  add: (demo: KitDemoInstance, tab?: HTMLButtonElement) => HTMLButtonElement;
  /** 表示するデモを切り替える（スマホのみ見た目が変わる） */
  setActive: (index: number) => void;
  /** 読み込み直後の自動再生。1つずつ順番に動かす */
  playAll: () => Promise<void>;
  destroy: () => void;
}

/**
 * @param stage デモを並べている要素。`data-active` をここに付ける
 */
export function createKitPlayer(stage: HTMLElement): KitPlayer {
  const scheduler = createScheduler();
  const entries: Entry[] = [];
  let activeIndex = 0;
  let busy = false;

  function render(): void {
    stage.dataset.active = String(activeIndex);

    for (const [i, entry] of entries.entries()) {
      entry.button.textContent = BUTTON_LABEL[entry.state];
      entry.button.dataset.state = entry.state;
      // 再生中は、もう片方のボタンも押せなくする。
      // 2つ同時に動くと、どちらを見ればいいか分からなくなるため
      entry.button.disabled = busy;

      entry.tab?.setAttribute('aria-selected', String(i === activeIndex));
      entry.tab?.classList.toggle('kit__tab--on', i === activeIndex);
    }
  }

  function setActive(index: number): void {
    activeIndex = index;
    render();
  }

  async function play(index: number): Promise<void> {
    if (busy || scheduler.cancelled) return;
    const entry = entries[index];
    if (!entry) return;

    busy = true;
    setActive(index);
    entry.state = 'playing';
    render();

    // 切り替えた直後は、まだ表示が確定していない。
    // 1拍おいてから動かさないと、出入りのアニメーションが飛ぶ
    await scheduler.wait(60);
    await entry.demo.play();

    busy = false;
    entry.state = 'played';
    render();
  }

  return {
    add(demo, tab) {
      const index = entries.length;
      const button = el('button', 'kit__play');
      button.type = 'button';
      const entry: Entry = { demo, button, tab, state: 'idle' };
      entries.push(entry);

      button.addEventListener('click', () => {
        void play(index);
      });
      tab?.addEventListener('click', () => setActive(index));

      render();
      return button;
    },

    setActive,

    async playAll(): Promise<void> {
      for (let i = 0; i < entries.length; i += 1) {
        if (scheduler.cancelled) return;
        await play(i);
        if (scheduler.cancelled) return;
        await scheduler.wait(GAP_BETWEEN_DEMOS_MS);
      }
      // 見比べ終わったら、最初のデモに戻しておく。
      // スマホでは「2つめが出たまま」になり、1つめを見失うため
      if (!scheduler.cancelled) setActive(0);
    },

    destroy(): void {
      scheduler.cancel();
      for (const entry of entries) entry.demo.destroy();
    },
  };
}
