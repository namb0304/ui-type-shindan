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
 * 見本の出し方は画面の幅で変える。
 *   スマホ … 押したときだけ開く。縦に10個並べると延々スクロールすることになる
 *   PC    … 最初から2列に並べて出す。幅があるので、押す手間のほうが邪魔になる
 *
 * どちらでも**動くのは押したものだけ**。10個が同時に動くと、
 * どれを見ればいいか分からなくなる。
 *
 * デモは画面の幅にかかわらず最初から全部作っておき、出し分けはCSSに任せる。
 * JSで作り分けると、途中で幅が変わったとき（画面を回したとき）に食い違う。
 * 作っただけでは動かないので、置いておくこと自体は重くない。
 *
 * 並べ方は第2部のK2（一覧の見せ方）で変わる（てんこ盛り化）。
 *   リスト … 1行ずつ、区切り線で分ける
 *   カード … 1件ずつ面にする
 */

export interface KitResultSection {
  element: HTMLElement;
  /** デモの後片付け。結果ページを離れるときに呼ぶ */
  destroy: () => void;
}

/** PCとみなす幅。これ以上なら、見本を最初から2列で並べる */
const WIDE_QUERY = '(min-width: 900px)';

function isWide(): boolean {
  return window.matchMedia?.(WIDE_QUERY).matches === true;
}

/** 1項目ぶんの持ち物。再生のたびに作り直すので、材料を覚えておく */
interface Slot {
  item: HTMLElement;
  toggle: HTMLButtonElement;
  box: HTMLElement;
  optionId: string;
  demo: KitDemoInstance;
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

  const slots: Slot[] = [];
  /** いま動かしているもの。次を押したら、これを止める */
  let playing: Slot | undefined;

  /**
   * 見本を作り直して、最初の状態に戻す。
   *
   * 再生を途中で止める手段が destroy しかない（scheduler は一度 cancel すると
   * 元に戻せない）ので、止めたいときは作り直す。1回の再生につき1個だけなので軽い。
   */
  function rebuild(slot: Slot): void {
    slot.demo.destroy();
    slot.demo.element.remove();
    slot.demo = createKitDemo(slot.optionId, vars);
    slot.box.append(slot.demo.element);
    slot.toggle.disabled = false;
    slot.toggle.textContent = labelOf(slot);
  }

  /** ボタンの文字。PCは開閉しないので、いつも「動きを見る」 */
  function labelOf(slot: Slot): string {
    if (isWide()) return PLAY_LABEL;
    return slot.item.dataset.open === 'true' ? CLOSE_LABEL : PLAY_LABEL;
  }

  async function play(slot: Slot): Promise<void> {
    // 動くのは1つだけ。前のものは作り直して静止に戻す
    if (playing && playing !== slot) rebuild(playing);
    playing = slot;

    slot.toggle.disabled = true;
    slot.toggle.textContent = PLAYING_LABEL;
    await slot.demo.play();

    // 作り直されていたら、そちらで戻してあるので触らない
    if (playing !== slot) return;
    slot.toggle.disabled = false;
    slot.toggle.textContent = labelOf(slot);
  }

  function onToggle(slot: Slot): void {
    // PCは最初から出ているので、押すのは「もう一度動かす」だけ
    if (isWide()) {
      void play(slot);
      return;
    }

    const willOpen = slot.item.dataset.open !== 'true';
    // 開くのは常に1つだけ。2つ開くと、どちらを見ればいいか分からない
    for (const other of slots) {
      if (other === slot) continue;
      other.item.dataset.open = 'false';
      other.toggle.textContent = labelOf(other);
    }

    slot.item.dataset.open = String(willOpen);
    slot.toggle.textContent = labelOf(slot);

    if (willOpen) void play(slot);
    else if (playing === slot) rebuild(slot);
  }

  for (const group of groupKitByCategory(answers)) {
    const section = el('div', 'kitlist__group');
    section.append(el('p', 'kitlist__category', group.label));

    const items = el('div', 'kitlist__items');
    for (const result of group.items) {
      items.append(renderItem(result, vars, slots, onToggle));
    }

    section.append(items);
    list.append(section);
  }

  block.append(list);

  return {
    element: block,
    destroy() {
      for (const slot of slots) slot.demo.destroy();
    },
  };
}

const PLAY_LABEL = '▶ 動きを見る';
const CLOSE_LABEL = '▲ 閉じる';
const PLAYING_LABEL = '再生中…';

function renderItem(
  result: KitChoiceResult,
  vars: ThemeVars,
  slots: Slot[],
  onToggle: (slot: Slot) => void,
): HTMLElement {
  const { question, option } = result;

  const item = el('div', 'kitlist__item');
  const head = el('div', 'kitlist__head');
  const text = el('div', 'kitlist__text');
  text.append(el('p', 'kitlist__label', question.label));

  // 「どっちでもいい」を選んだ項目（要件 §4.2）。
  // 見本は出さない（出す部品が決まっていない）ので、場所を空けずに小さく収める。
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

  const box = el('div', 'kitlist__demo');
  const toggle = button('kitlist__play', PLAY_LABEL, () => onToggle(slot));
  toggle.setAttribute('aria-label', `${option.name}の動きを見る`);

  // 最初から作っておく。作っただけでは動かない
  const demo = createKitDemo(option.id, vars);
  box.append(demo.element);

  const slot: Slot = { item, toggle, box, optionId: option.id, demo };
  slots.push(slot);

  head.append(text, toggle);
  item.append(head, box);
  item.dataset.open = 'false';
  return item;
}
