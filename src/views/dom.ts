/** 画面を組み立てるための小さなDOMヘルパー（各ビューで共通して使う）。 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** ボタンは type を明示する（フォーム内で誤送信しないため）。 */
export function button(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const node = el('button', className, text);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

/**
 * 進捗バー。第1部と第2部で同じものを使う（通しの1本・要件 §5）。
 *
 * 質問画面は縦のflexなので、この行は縮まないようにしてある（base.css）。
 */
export function progressHead(current: number, total: number): HTMLElement {
  const head = el('div', 'q__head');
  const bar = el('div', 'q__bar');
  const fill = el('span', 'q__bar-fill');
  fill.style.width = `${(current / total) * 100}%`;
  bar.append(fill);
  head.append(bar, el('p', 'q__count', `${current} / ${total}`));
  return head;
}

/**
 * 画面ひとつ。
 *
 * 第2部のデモはタイマーとイベントを持つので、画面を描き直す前に
 * 後片付けが要る。また、動きの自動再生は要素がページに入ってからでないと
 * 始められない（入る前だと transition が効かない）。
 * そのため、ただの要素ではなくこの形で受け渡す。
 */
export interface View {
  element: HTMLElement;
  /** ページに入れたあとに呼ばれる。自動再生の開始に使う */
  mounted?: () => void;
  /** 画面を離れるときに呼ばれる。タイマーとイベントを止める */
  destroy?: () => void;
}

/** 後片付けの要らない画面を View にする。 */
export function staticView(element: HTMLElement): View {
  return { element };
}
