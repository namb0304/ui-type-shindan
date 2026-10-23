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

/** メモ1件ぶんの中身。一覧・カード・スケルトンのどれも、この形から描く。 */
export interface MemoItem {
  title: string;
  note: string;
}

/**
 * メモの一覧（K2 一覧の見せ方・K3 続きの見せ方）。
 *
 * 10件あるのは、デモの画面でスクロールが起きる長さにするため。
 * リストなら7件ほど、カードなら2〜3件しか画面に入らないので、
 * 「一度にたくさん見渡せる」かどうかの差がそのまま目に見える。
 */
export const MEMO_FEED_ITEMS = [
  { title: '買い物メモ', note: '牛乳／食パン／たまご' },
  { title: '来週やること', note: '図書館に本を返す' },
  { title: '貸したもの', note: '傘（青）、返ってきた' },
  { title: '行きたい店', note: '駅前のパン屋。8時から' },
  { title: '旅行の持ち物', note: '充電器とイヤホン' },
  { title: '読みたい本', note: '文庫の2巻から' },
  { title: '部室のカギ', note: '木曜は自分が開ける' },
  { title: 'バイトのシフト', note: '来月ぶんを出す' },
  { title: '課題の締切', note: '金曜の正午まで' },
  { title: '録画したやつ', note: '3話まで見た' },
] as const satisfies readonly MemoItem[];

/** K3 で、続きを読み込んだときに増える3件。 */
export const MEMO_MORE_ITEMS = [
  { title: '返す本', note: '水曜までに2冊' },
  { title: '自転車の空気', note: '前輪だけ入れる' },
  { title: '誕生日', note: '妹に何か買う' },
] as const satisfies readonly MemoItem[];

/**
 * K6（読み込み中）とK1（メニュー）で使う3件。
 *
 * 一覧の先頭3件をそのまま使う。同じアプリなので、同じメモが出るようにしている。
 * K6のスケルトンは、この件数と同じ行数の灰色の帯を並べる（kit.css 参照）。
 */
export const MEMO_LIST_ITEMS: readonly MemoItem[] = MEMO_FEED_ITEMS.slice(0, 3);

/** 一覧の1行。K3 では、あとから足す行もこれで作る。 */
export function memoRowHtml(item: MemoItem): string {
  return `
    <li class="memo__row">
      <span class="memo__row-title">${item.title}</span>
      <span class="memo__row-note">${item.note}</span>
    </li>
  `;
}

export function memoListHtml(items: readonly MemoItem[] = MEMO_LIST_ITEMS): string {
  return `<ul class="memo__list">${items.map(memoRowHtml).join('')}</ul>`;
}

/** 一覧の1行を要素で作る（K3 で、読み込んだぶんを足すときに使う）。 */
export function createMemoRow(item: MemoItem): HTMLLIElement {
  const template = document.createElement('template');
  template.innerHTML = memoRowHtml(item).trim();
  return template.content.firstElementChild as HTMLLIElement;
}

/**
 * メモをカードで並べる（K2-B）。1件が1枚の面になる。
 *
 * 上に写真の場所を置いてある。カードは「1件を大きく見せる」部品なので、
 * これが無いと行の間隔が広いだけのリストに見えてしまう。
 * 写真は使わない決まりなので、色の面で代わりにする（要件 §5）。
 */
export function memoCardsHtml(items: readonly MemoItem[] = MEMO_FEED_ITEMS): string {
  const cards = items
    .map(
      (item) => `
      <article class="memo__card">
        <span class="memo__card-cover" aria-hidden="true"></span>
        <h4 class="memo__card-title">${item.title}</h4>
        <p class="memo__card-note">${item.note}</p>
      </article>
    `,
    )
    .join('');
  return `<div class="memo__cards">${cards}</div>`;
}

export interface MemoBar {
  element: HTMLElement;
  setTitle: (text: string) => void;
}

/**
 * 画面の上のバー。
 *
 * K4〜K6 は中身が変わらないので文字列で書いているが、
 * K1 は三本線を置き、ページに合わせて題を書き換える必要がある。
 * そのため要素で作れるようにしてある。
 *
 * @param lead 題の左に置くもの（三本線のボタンなど）
 */
export function createMemoBar(title: string, lead?: HTMLElement): MemoBar {
  const element = document.createElement('div');
  element.className = 'memo__bar';

  const titleNode = document.createElement('span');
  titleNode.className = 'memo__bar-title';
  titleNode.textContent = title;

  if (lead) element.append(lead);
  element.append(titleNode);

  return {
    element,
    setTitle(text: string) {
      titleNode.textContent = text;
    },
  };
}

/**
 * 三本線のボタン（K1-A）。
 *
 * 「押すまで行き先が分からない」というハンバーガーメニューの性格が、
 * この見た目だけで伝わる。線は飾りなので読み上げからは隠す。
 */
export function createBurgerButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'memo__burger';
  button.setAttribute('aria-label', 'メニューを開く');
  button.innerHTML = `
    <span class="memo__burger-lines" aria-hidden="true">
      <i></i><i></i><i></i>
    </span>
  `;
  return button;
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
