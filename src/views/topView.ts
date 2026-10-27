import { createShopThumb } from '../components/shopThumb';
import { tagsOfType, TYPE_FAMILIES, typesOfFamily } from '../data/families';
import { estimatedMinutes, TOTAL_ALL_QUESTIONS } from '../data/quiz';
import { TYPE_INFOS } from '../data/typeInfos';
import { button, el } from './dom';

/**
 * トップ画面（要件 §5-1）。
 *
 * 友達に「何のサイトか分からない」と言われたので、
 * **開いた瞬間に「何ができて、何が分かるのか」が伝わる**ことを狙って組み直した。
 *
 * 上から「何が分かるか → 具体例 → やり方 → 開始」の順に並べる。
 * やり方（遊び方）を先に置かないのは、分からなかったのが
 * 「どう遊ぶか」ではなく「何のサイトか」だったため。
 *
 * ページの色は、すべて場所の写真から来る。サイト側は白〜薄いグレーのままにして、
 * 結果ページで一気にテーマが変わる落差を演出として残している。
 */

/**
 * ファーストビューでチラ見せする3つ。
 *
 * 16タイプの中で雰囲気がいちばん離れた組み合わせを選んでいる。
 * 言葉で「16タイプあります」と書くより、振れ幅を見せるほうが早い。
 */
const PEEK_CODES = ['DFPM', 'AFCM', 'DRPG'] as const;

export function renderTop(onStart: () => void): HTMLElement {
  const screen = el('main', 'screen screen--top');

  screen.append(renderHero(onStart), renderWhat(), renderTypes(), renderHow(), renderFoot(onStart));

  return screen;
}

/** 1. ファーストビュー。スマホ390×700に収める（要件 §5） */
function renderHero(onStart: () => void): HTMLElement {
  const hero = el('header', 'top__hero');

  hero.append(
    el('h1', 'top__title', 'デザインの好み、場所でいうと？'),
    el(
      'p',
      'top__lead',
      '2つの画面を見比べて、好きなほうを選ぶだけ。あなたのデザインの好みが、16タイプの「場所」で分かります。',
    ),
  );

  // 結果の実物をチラ見せする。ここだけは先に読み込む（3枚で約52KB）
  const strip = el('div', 'top__strip');
  strip.setAttribute('aria-hidden', 'true');
  for (const code of PEEK_CODES) {
    const info = TYPE_INFOS.find((candidate) => candidate.code === code);
    if (!info) continue;
    const card = el('div', 'top__peek');
    card.append(createShopThumb(code), el('p', 'top__peek-name', info.shop));
    strip.append(card);
  }
  hero.append(strip);

  const cta = el('div', 'top__cta');
  cta.append(button('btn btn--primary', '診断をはじめる', onStart));
  hero.append(cta);

  // 問題数と所要時間は質問データから数える（増やしてもここは直さない）
  const meta = el('ul', 'top__meta');
  for (const text of [`全${TOTAL_ALL_QUESTIONS}問`, `約${estimatedMinutes()}分`, '登録なし']) {
    meta.append(el('li', 'top__meta-item', text));
  }
  hero.append(meta);

  return hero;
}

/**
 * 2. 答えると、3つが分かります（3層のコンセプト・要件 §1）。
 *
 * 3つを文章で説明せず、**出てくるものの縮小版**を見せる。
 * 3つとも同じ形のカードにはしない（写真／白い一覧／黒いコード）。
 * 同じ枠が3つ並ぶと、よくあるテンプレートに見えてしまう。
 */
function renderWhat(): HTMLElement {
  const section = el('section', 'top__section');
  section.append(el('h2', 'top__section-title', '答えると、3つが分かります'));

  const list = el('div', 'top__layers');
  list.append(
    layer(
      samplePlace(),
      '好みが「場所」で分かる',
      'あなたのデザインの好みを、16タイプの場所にたとえます。',
    ),
    layer(
      sampleKit(),
      'よく使うUIの名前が分かる',
      '「お知らせはトースト派」のような、あなたの定番がまとまります。部品の名前も覚えられます。',
    ),
    layer(
      sampleSpec(),
      'AIに渡せる設計図がもらえる',
      'ChatGPTなどに貼り付けるだけで、あなた好みの見た目で画面を作ってくれます。',
    ),
  );

  section.append(list);
  return section;
}

function layer(sample: HTMLElement, title: string, note: string): HTMLElement {
  const item = el('div', 'top__layer');
  const body = el('div', 'top__layer-body');
  body.append(el('h3', 'top__layer-title', title), el('p', 'top__layer-note', note));
  item.append(sample, body);
  return item;
}

/** ①の見本：場所の写真 */
function samplePlace(): HTMLElement {
  const box = el('div', 'top__sample top__sample--place');
  box.setAttribute('aria-hidden', 'true');
  box.append(createShopThumb('ARPM', { lazy: true }));
  return box;
}

/** ②の見本：定番UIキットの行 */
function sampleKit(): HTMLElement {
  const box = el('div', 'top__sample top__sample--kit');
  box.setAttribute('aria-hidden', 'true');
  for (const [label, name] of [
    ['お知らせの出し方', 'トースト'],
    ['一覧の見せ方', 'カード'],
  ]) {
    const row = el('div', 'top__sample-row');
    row.append(el('span', 'top__sample-label', label), el('span', 'top__sample-name', name));
    box.append(row);
  }
  return box;
}

/** ③の見本：AIに渡す設計図の抜粋 */
function sampleSpec(): HTMLElement {
  const box = el('pre', 'top__sample top__sample--spec');
  box.setAttribute('aria-hidden', 'true');
  box.textContent = [
    '## デザイントークン',
    ':root {',
    '  --radius: 20px;',
    '  --space: 16px;',
    '}',
    '## 使いたいUI部品',
    '- お知らせ：トースト',
  ].join('\n');
  return box;
}

/**
 * 3. 16タイプの場所。
 *
 * 写真と名前だけ16個並べても、初めての人には何のタイプか分からない。
 * 情報量 × トーンの4系統に分け、系統ごとに見出し・一言・色を付ける。
 * 残りの2軸（装飾・見出し）は、各カードに小さなタグで添える。
 *
 * 系統も所属タイプもタグも data/ から組み立てる（ここにベタ書きしない）。
 */
function renderTypes(): HTMLElement {
  const section = el('section', 'top__section');
  section.append(
    el('h2', 'top__section-title', '16タイプの場所'),
    el(
      'p',
      'top__section-note',
      '好みは4つの系統に分かれます。この中のどれかが、あなたのタイプです。',
    ),
  );

  const families = el('div', 'top__families');
  for (const family of TYPE_FAMILIES) {
    const group = el('section', 'top__family');
    // 色はこの1か所から渡す。CSSは変数を見るだけにして、系統を足しても直さない
    group.style.setProperty('--family-color', family.color);

    const head = el('div', 'top__family-head');
    head.append(
      el('h3', 'top__family-name', family.name),
      el('p', 'top__family-note', family.note),
    );

    const grid = el('ul', 'top__types');
    for (const info of typesOfFamily(family)) {
      const item = el('li', 'top__type');
      const body = el('div', 'top__type-body');
      body.append(el('p', 'top__type-name', info.shop));

      const tags = el('p', 'top__type-tags');
      for (const text of tagsOfType(info.code)) {
        tags.append(el('span', 'top__type-tag', text));
      }
      body.append(tags);

      item.append(createShopThumb(info.code, { lazy: true }), body);
      grid.append(item);
    }

    group.append(head, grid);
    families.append(group);
  }

  section.append(families);
  return section;
}

/** 4. 遊び方（3ステップ） */
function renderHow(): HTMLElement {
  const section = el('section', 'top__section');
  section.append(el('h2', 'top__section-title', '遊び方'));

  const steps = el('ol', 'top__steps');
  for (const [index, text] of ['2つの画面を見比べる', '好きなほうを選ぶ', '結果が出る'].entries()) {
    const step = el('li', 'top__step');
    const number = el('span', 'top__step-n', String(index + 1));
    number.setAttribute('aria-hidden', 'true');
    step.append(number, el('p', 'top__step-text', text));
    steps.append(step);
  }

  section.append(steps);
  return section;
}

/** 5. もう一度の開始ボタンと注記 */
function renderFoot(onStart: () => void): HTMLElement {
  const section = el('section', 'top__foot');
  section.append(
    button('btn btn--primary', '診断をはじめる', onStart),
    el(
      'p',
      'top__note',
      '遊びの診断です。科学的な根拠はありません。答えた内容はこの端末の中だけで、どこにも送られません。',
    ),
  );
  return section;
}
