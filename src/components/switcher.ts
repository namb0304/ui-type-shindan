import { el } from '../views/dom';

/**
 * 2つの中身を切り替える部品（K7 のてんこ盛り化・要件 §5）。
 *
 * 第2部で選んだ形で出す。押す場所も中身も同じで、形と置き場所だけが違う。
 *   セグメントコントロール … 面の中を、選んだ側につまみが滑る
 *   タブ                   … 見出しが並び、その下の線が動く
 *
 * 印の位置は data-selected（0 か 1）だけで決める。
 * CSSは「何番目か」しか見ないので、見た目の指定がJSに漏れない。
 */

export type SwitcherVariant = 'segmented' | 'tabs';

export interface SwitcherPanel {
  /** 切り替えボタンに出す文字 */
  label: string;
  /** その中身。切り替えても作り直さないよう、要素を受け取る */
  element: HTMLElement;
}

export interface Switcher {
  element: HTMLElement;
  /** いま選ばれている番号 */
  readonly selected: number;
}

export function createSwitcher(
  variant: SwitcherVariant,
  panels: readonly SwitcherPanel[],
  onChange?: (index: number) => void,
): Switcher {
  const wrap = el('div', 'switcher');

  const control = el('div', variant === 'segmented' ? 'seg' : 'tabs2');
  control.setAttribute('role', 'tablist');

  // 選んだ印。押した側へ横に動く
  const ink = el('span', variant === 'segmented' ? 'seg__thumb' : 'tabs2__ink');
  ink.setAttribute('aria-hidden', 'true');
  control.append(ink);

  const buttons: HTMLButtonElement[] = [];
  let selected = 0;

  function select(index: number): void {
    selected = index;
    control.dataset.selected = String(index);

    for (const [i, button] of buttons.entries()) {
      const on = i === index;
      button.setAttribute('aria-selected', String(on));
      button.classList.toggle(variant === 'segmented' ? 'seg__btn--on' : 'tabs2__btn--on', on);
      // 選ばれていない中身は、読み上げからも隠す
      panels[i].element.hidden = !on;
    }

    onChange?.(index);
  }

  for (const [index, panel] of panels.entries()) {
    const button = el(
      'button',
      variant === 'segmented' ? 'seg__btn' : 'tabs2__btn',
      panel.label,
    );
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.addEventListener('click', () => select(index));
    buttons.push(button);
    control.append(button);
  }

  const body = el('div', 'switcher__body');
  for (const panel of panels) body.append(panel.element);

  wrap.append(control, body);
  select(0);

  return {
    element: wrap,
    get selected() {
      return selected;
    },
  };
}
