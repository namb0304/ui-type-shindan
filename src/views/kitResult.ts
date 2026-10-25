import { createKitDemo } from '../components/kit';
import type { KitDemoInstance } from '../components/kit';
import type { KitAnswers } from '../data/kitTypes';
import type { ThemeVars } from '../data/tokens';
import { groupKitByCategory } from '../logic/kit';
import type { KitChoiceResult } from '../logic/kit';
import { button, el } from './dom';

/**
 * 結果ページの「あなたの定番UIキット」（要件 §5・F13）。
 *
 * 第2部で選んだ部品を、名前・一言の説明・実際に動く見本の3つで並べる。
 *
 * **部品の名前を主役にしてある。** 名前を覚えて帰ってもらうことが
 * 第2部の目的なので、見出し用の書体で大きく出す（Mタイプなら明朝になる）。
 * 「聞くこと」は小さく上に、説明は小さく下に添える。
 *
 * 見本は**押したときだけ開く**。10個を一度に並べると1つが小さくなりすぎ、
 * 質問画面で決めた下限（幅200px。これを割ると中の文字が読めない）を下回る。
 * 開くのは常に1つだけにして、読める大きさで出す。
 *
 * 並べ方は第2部のK2（一覧の見せ方）で変わる（てんこ盛り化）。
 *   リスト … 1行ずつ、区切り線で分ける
 *   カード … 1件ずつ面にする
 */

export interface KitResultSection {
  element: HTMLElement;
  /** 開いているデモの後片付け。結果ページを離れるときに呼ぶ */
  destroy: () => void;
}

/**
 * @param vars その人のテーマ。見本もこのテーマで描く（要件 §5）
 * @param listStyle K2 の答え。'list' か 'card'
 */
export function renderKitResult(
  answers: KitAnswers,
  vars: ThemeVars,
  listStyle: 'list' | 'card',
): KitResultSection {
  const block = el('section', 'result__after result__block');
  block.append(
    el('h2', 'result__heading', 'あなたの定番UIキット'),
    el(
      'p',
      'result__sub',
      '後半の質問で、あなたが選んだUIです。名前を知っておくと、AIや人にデザインを頼むときに伝わりやすくなります。',
    ),
  );

  const list = el('div', `kitlist kitlist--${listStyle}`);

  /** 開いているデモ。切り替えるときに止めて片付ける */
  let open: { item: HTMLElement; toggle: HTMLButtonElement; demo: KitDemoInstance } | undefined;

  function close(): void {
    if (!open) return;
    open.item.dataset.open = 'false';
    open.toggle.setAttribute('aria-expanded', 'false');
    open.toggle.textContent = PLAY_LABEL;
    open.demo.destroy();
    open.demo.element.remove();
    open = undefined;
  }

  for (const group of groupKitByCategory(answers)) {
    const section = el('div', 'kitlist__group');
    section.append(el('p', 'kitlist__category', group.label));

    const items = el('div', 'kitlist__items');
    for (const result of group.items) {
      items.append(renderItem(result, vars, { close, setOpen: (next) => (open = next) }));
    }

    section.append(items);
    list.append(section);
  }

  block.append(list);

  return {
    element: block,
    destroy: close,
  };
}

const PLAY_LABEL = '▶ 動きを見る';
const CLOSE_LABEL = '▲ 閉じる';

interface OpenControl {
  close: () => void;
  setOpen: (next: { item: HTMLElement; toggle: HTMLButtonElement; demo: KitDemoInstance }) => void;
}

function renderItem(
  result: KitChoiceResult,
  vars: ThemeVars,
  control: OpenControl,
): HTMLElement {
  const { question, option } = result;

  const item = el('div', 'kitlist__item');
  const head = el('div', 'kitlist__head');
  const text = el('div', 'kitlist__text');
  text.append(el('p', 'kitlist__label', question.label));

  // 「どっちでもいい」を選んだ項目（要件 §4.2）。
  // 選ばなかった人にも、両方の名前は持って帰ってもらう
  if (!option) {
    item.classList.add('kitlist__item--either');
    text.append(
      el('p', 'kitlist__name', 'どちらでも'),
      el('p', 'kitlist__both', `${question.a.name} ／ ${question.b.name}`),
    );
    head.append(text);
    item.append(head);
    return item;
  }

  text.append(
    el('p', 'kitlist__name', option.name),
    el('p', 'kitlist__desc', option.description),
  );

  const demoBox = el('div', 'kitlist__demo');

  const toggle = button('kitlist__play', PLAY_LABEL, () => {
    const isOpen = item.dataset.open === 'true';
    // 開くのは常に1つだけ。2つ同時に動くと、どちらを見ればいいか分からない
    control.close();
    if (isOpen) return;

    const demo = createKitDemo(option.id, vars);
    demoBox.append(demo.element);
    item.dataset.open = 'true';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.textContent = CLOSE_LABEL;
    control.setOpen({ item, toggle, demo });

    // 要素がページに入ってからでないと、出入りの動きが始まらない
    requestAnimationFrame(() => {
      void demo.play();
    });
  });
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', `${option.name}の動きを見る`);

  head.append(text, toggle);
  item.append(head, demoBox);
  item.dataset.open = 'false';
  return item;
}
