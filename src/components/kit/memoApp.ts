import type { Scheduler } from './scheduler';

/**
 * デモ3問に共通の「架空のメモアプリ」の画面。
 *
 * 3問とも同じアプリ・同じ場面にしてあるのは、
 * 変わっているのが**部品だけ**だと分かるようにするため。
 * 文言やレイアウトまで違うと、何の差を見ているのか分からなくなる。
 *
 * デモは触れるので、本物のボタン（<button>）を使う。
 * 第1部のプレビューとは逆の方針（要件 §5「第2部のデモの作り方」）。
 */

/** スマホの画面に見せるための枠。これ自体が「ここは見本です」の合図になる。 */
export function createDemoFrame(): { frame: HTMLElement; screen: HTMLElement } {
  const frame = document.createElement('div');
  frame.className = 'kit-demo';

  const screen = document.createElement('div');
  screen.className = 'kit-demo__screen';

  // 時刻と電波。スマホの画面だと一目で分かるようにするためだけの飾り
  const status = document.createElement('div');
  status.className = 'kit-demo__status';
  status.setAttribute('aria-hidden', 'true');
  status.innerHTML = `
    <span class="kit-demo__clock">10:18</span>
    <span class="kit-demo__signal">
      <i class="kit-demo__bar kit-demo__bar--s"></i>
      <i class="kit-demo__bar kit-demo__bar--m"></i>
      <i class="kit-demo__bar kit-demo__bar--l"></i>
    </span>
  `;

  screen.append(status);
  frame.append(screen);
  return { frame, screen };
}

/** メモ1件の本文（K4・K5で使う）。 */
export function memoBodyHtml(): string {
  return `
    <div class="memo__body">
      <h4 class="memo__title">買い物メモ</h4>
      <p class="memo__text">牛乳／食パン／たまご<br />ねぎは2本でいい</p>
    </div>
  `;
}

/** メモ一覧の中身（K6で、読み込みが終わったあとに出す）。 */
export const MEMO_LIST_ITEMS = [
  { title: '買い物メモ', note: '牛乳／食パン／たまご' },
  { title: '来週やること', note: '図書館に本を返す' },
  { title: '貸したもの', note: '傘（青）— 返ってきた' },
] as const;

export function memoListHtml(): string {
  const rows = MEMO_LIST_ITEMS.map(
    (item) => `
      <li class="memo__row">
        <span class="memo__row-title">${item.title}</span>
        <span class="memo__row-note">${item.note}</span>
      </li>
    `,
  ).join('');
  return `<ul class="memo__list">${rows}</ul>`;
}

export interface DemoButtonOptions {
  /** 控えめな見た目にする（削除・再読み込みなど、主役でない操作） */
  quiet?: boolean;
}

/** デモの中の操作ボタン。「これにする」と見分けがつく見た目にする（kit.css）。 */
export function demoButton(label: string, options: DemoButtonOptions = {}): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `memo__btn${options.quiet ? ' memo__btn--quiet' : ''}`;
  button.textContent = label;
  return button;
}

/** タップの波紋を見せている時間。 */
export const TAP_MS = 420;

/**
 * 自動再生のときに「指で押した」ように見せる。
 *
 * 再生は人の操作なしで進むので、何もしないと
 * 「勝手に画面が変わった」ようにしか見えない。
 * どのボタンが押されたのかを波紋で示す。
 */
export function createTapper(scheduler: Scheduler) {
  return async function tap(button: HTMLButtonElement, action: () => void): Promise<void> {
    const ripple = document.createElement('span');
    ripple.className = 'memo__tap';
    ripple.setAttribute('aria-hidden', 'true');
    button.append(ripple);
    button.classList.add('memo__btn--pressed');

    // 波紋が広がり始めてから動かす。同時だと「押したから動いた」に見えない
    await scheduler.wait(TAP_MS * 0.5);
    if (!scheduler.cancelled) action();
    await scheduler.wait(TAP_MS * 0.5);

    // 片付けはタイマーでやる。animationend に任せると、動きを止めている
    // 環境ではイベントが来ず、押したままの見た目が残る
    ripple.remove();
    button.classList.remove('memo__btn--pressed');
  };
}
