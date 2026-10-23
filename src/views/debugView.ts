import { createKitDemo } from '../components/kit';
import { createPreview, PREVIEWS } from '../components/previews';
import { createShopPhoto } from '../components/shopPhoto';
import { FALLBACK_SUBJECT, missingSubjects, resolveSubject } from '../components/previews/fallback';
import { AXES } from '../data/axes';
import type { AxisDefinition } from '../data/axes';
import { KIT_QUESTIONS } from '../data/kitQuestions';
import type { KitChoice } from '../data/kitTypes';
import { QUESTIONS } from '../data/questions';
import { TYPE_INFOS } from '../data/typeInfos';
import type { ThemeVars } from '../data/tokens';
import type { AxisId, AxisSide, RightPoints } from '../data/types';
import { pointsFromCode, toAxisScores } from '../logic/score';
import { buildTypeSummary } from '../logic/summary';
import { applyTheme, buildAxisVariantTheme, buildNeutralTheme, buildResultTheme } from '../logic/theme';
import { el } from './dom';
import type { View } from './dom';
import { createKitPlayer } from './kitPlayer';
import type { KitPlayer } from './kitPlayer';

/**
 * 部品カタログ（?debug=1 でのみ表示）。
 *
 * 「同じHTMLでも、CSS変数を差し替えると見た目が変わる」ことを確認するための画面。
 * ステップ6で残りの部品を作るときに、A/Bの差が十分かを見るのに使う。
 * 登録済みの部品（PREVIEWS）を自動で並べるので、部品を足せばここにも出る。
 */

/** 軸の左右の比較に使う題材。部品が無ければ最初の部品で代用する。 */
const AXIS_SUBJECT: Record<AxisId, string> = {
  density: 'cafe-menu',
  decoration: 'music-player',
  tone: 'weather-app',
  font: 'news-headline',
};

function caption(vars: ThemeVars): HTMLElement {
  const parts = [
    `余白 ${vars['--space-unit']}`,
    `文字 ${vars['--font-size-base']}`,
    `行間 ${vars['--line-height']}`,
    `角丸 ${vars['--radius']}`,
  ];
  return el('p', 'gallery__caption', parts.join(' ／ '));
}

function previewCell(subject: string, vars: ThemeVars, title: string): HTMLElement {
  const cell = el('div', 'gallery__cell');
  cell.append(el('p', 'gallery__cell-title', title), createPreview(subject, vars), caption(vars));
  return cell;
}

function section(title: string, note: string, body: HTMLElement): HTMLElement {
  const wrap = el('section', 'gallery__section');
  const head = el('div', 'gallery__section-head');
  head.append(el('h2', 'gallery__section-title', title), el('p', 'gallery__note', note));
  wrap.append(head, body);
  return wrap;
}

/** 登録済みの部品を1つのテーマで並べる */
function allPreviews(vars: ThemeVars): HTMLElement {
  const grid = el('div', 'gallery__grid gallery__grid--three');
  for (const preview of PREVIEWS) {
    grid.append(previewCell(preview.subject, vars, preview.label));
  }
  return grid;
}

/** 1つの軸の左右を並べる（質問画面と同じ見せ方） */
function axisComparison(axis: AxisDefinition): HTMLElement {
  const grid = el('div', 'gallery__grid gallery__grid--pair');
  const subject = AXIS_SUBJECT[axis.id] ?? PREVIEWS[0].subject;

  for (const side of ['left', 'right'] as const) {
    const info = axis[side];
    const vars = buildAxisVariantTheme(axis.id, side as AxisSide);
    grid.append(previewCell(subject, vars, `${info.name}（${info.letter}）`));
  }
  return grid;
}

function resultSection(points: RightPoints, code: string, label: string): HTMLElement {
  const vars = buildResultTheme(toAxisScores(points));
  return section(`結果テーマ：${code}`, label, allPreviews(vars));
}

/** 残りの部品づくり（ステップ6）の進み具合 */
function progressSection(): HTMLElement {
  const missing = missingSubjects();
  const body = el('div', 'gallery__status');

  body.append(
    el(
      'p',
      'gallery__status-line',
      `部品あり ${PREVIEWS.length} / ${QUESTIONS.length} 題材　（残り ${missing.length}）`,
    ),
  );

  const list = el('ul', 'gallery__todo');
  for (const question of QUESTIONS) {
    const done = !missing.includes(question.subject);
    const fallback = FALLBACK_SUBJECT[question.subject];
    const suffix = done ? '部品あり' : `代用中 → ${fallback}`;
    list.append(
      el(
        'li',
        `gallery__todo-item${done ? ' gallery__todo-item--done' : ''}`,
        `${question.id.toUpperCase()}　${question.label}　（${suffix}）`,
      ),
    );
  }
  body.append(list);

  return section('部品の進み具合', 'ステップ6で残りの題材を作る。作って登録すれば代用は自動で外れる', body);
}

/**
 * 16タイプの写真の加工具合を並べて確認する（確認用）。
 *
 * 写真の薄さ・テーマ色のなじみ・店名の読みやすさを一画面で見比べる。
 * 写真は16枚になるので、見えたものから読み込む（loading="lazy"）。
 */
function photoCheckSection(): HTMLElement {
  const grid = el('div', 'gallery__photos');

  for (const info of TYPE_INFOS) {
    const scores = toAxisScores(pointsFromCode(info.code));

    const card = el('a', 'photocheck');
    card.href = `?debug=1&type=${info.code}`;
    applyTheme(card, buildResultTheme(scores));

    const photo = el('div', 'photocheck__photo');
    photo.setAttribute('aria-hidden', 'true');
    photo.append(createShopPhoto(info.code, { lazy: true }));

    const text = el('div', 'photocheck__text');
    text.append(
      el('p', 'photocheck__shop', `『${info.shop}』`),
      el('p', 'photocheck__summary', buildTypeSummary(scores)),
      el('p', 'photocheck__code', info.code),
    );

    card.append(photo, text);
    grid.append(card);
  }

  return section(
    '写真の加工具合',
    '結果ページと同じ加工（写真を35%・テーマ色の幕65%）。写真が無いタイプはグラデーションだけになる',
    grid,
  );
}

/** 16タイプの結果ページへの入口（確認用）。 */
function typeLinksSection(): HTMLElement {
  const body = el('div', 'gallery__types');

  for (const info of TYPE_INFOS) {
    const link = el('a', 'gallery__type');
    link.href = `?debug=1&type=${info.code}`;
    link.append(
      el('span', 'gallery__type-code', info.code),
      el('span', 'gallery__type-shop', info.shop),
    );
    body.append(link);
  }

  return section(
    '16タイプの結果ページ',
    'どのタイプの結果ページもここから開ける。文字が読めるか、崩れていないかを確認する',
    body,
  );
}

/**
 * 第2部のデモ（?debug=1）。
 *
 * 質問画面と違って自動再生はしない。3問ぶんが一斉に動くと見にくいので、
 * 「動かす」ボタンで1つずつ確かめる。デモの中のボタンも普通に触れる。
 */
function kitSection(players: KitPlayer[]): HTMLElement {
  const body = el('div', 'gallery__kit');
  const vars = buildNeutralTheme();

  for (const question of KIT_QUESTIONS) {
    const block = el('div', 'gallery__kit-block');
    block.append(
      el('p', 'gallery__kit-label', `${question.id.toUpperCase()}　${question.label}`),
    );

    // 問題ごとに1つ。質問画面と同じ「一度に動かすのは1つだけ」が効く
    const grid = el('div', 'gallery__grid gallery__grid--pair');
    const player = createKitPlayer(grid);
    players.push(player);

    for (const choice of ['a', 'b'] as KitChoice[]) {
      const option = question[choice];
      const cell = el('div', 'gallery__cell');
      const demo = createKitDemo(option.id, vars);

      cell.append(
        el('p', 'gallery__cell-title', `${choice.toUpperCase()}　${option.name}`),
        el('p', 'gallery__caption', option.description),
        demo.element,
        player.add(demo),
      );
      grid.append(cell);
    }

    block.append(grid);
    body.append(block);
  }

  return section(
    '第2部のデモ',
    '質問画面と同じ再生ボタン。デモの中のボタン（保存・削除）も触れる',
    body,
  );
}


/* ------------------------------------------------------------------
 * 高さの点検（?debug=1）
 *
 * 「スマホで2枚を同時に見られるか」を12問ぶん一覧にする。
 * 部品を直したあと、ここを見れば収まったかどうかがすぐ分かる。
 *
 * 数値は推測ではなく、質問画面と同じ幅の器に実際に描いて測る。
 * ------------------------------------------------------------------ */

/** 基準にするスマホ。iPhone 15 などの論理ピクセル */
const PHONE_WIDTH = 390;

/**
 * 質問画面でのプレビュー1枚の幅。
 *   390 − 左右の余白(16×2) − 選択肢の内側(10×2) − 枠線(2×2)
 */
const PREVIEW_WIDTH = PHONE_WIDTH - 16 * 2 - 10 * 2 - 2 * 2;

/**
 * 2枚ぶんに使える高さ。
 *
 * iPhoneのSafariは、上下のバーのぶん実際に見える高さが画面より小さい
 * （390×844 の端末で、見えるのはおよそ700px）。
 *
 * 質問画面は**スクロールなしで操作が完結する**決まりなので、
 * 戻るボタンまで含めた全部が、この700pxに収まっていないといけない。
 * 上下に必ず要る行を引いた残りが、プレビュー2枚に使える高さになる。
 *
 *   余白(上16+下16) + 進捗21 + 問い(上16+28) + 置き場の上余白14
 *     + 「もどる／どっちも同じに見える」の行(上10+44)  = 165
 *   1問目は案内の枠（上10＋2行ぶん53）がさらに入る        = +63
 *
 * 2枚の間の余白(12)と、押せる枠の内側(8×2×2枚＋枠線)も引く。
 */
const VISIBLE_HEIGHT = 700;
const CHROME_FIXED = 165;
const CHROME_HINT = 63;
const OPTION_OVERHEAD = 12 + (8 * 2 + 2 * 2) * 2;

const HEIGHT_BUDGET = VISIBLE_HEIGHT - CHROME_FIXED - OPTION_OVERHEAD;
const HEIGHT_BUDGET_FIRST = HEIGHT_BUDGET - CHROME_HINT;

interface HeightRow {
  question: (typeof QUESTIONS)[number];
  cell: HTMLElement;
  budget: number;
}

function heightCheckSection(rows: HeightRow[], stage: HTMLElement): HTMLElement {
  const table = el('div', 'heightcheck');

  table.append(
    el('div', 'heightcheck__row heightcheck__row--head'),
  );
  const head = table.firstElementChild as HTMLElement;
  for (const text of ['問', '題材', '2枚の合計', '収まるか']) {
    head.append(el('span', 'heightcheck__cell', text));
  }

  for (const question of QUESTIONS) {
    const row = el('div', 'heightcheck__row');
    const budget = question === QUESTIONS[0] ? HEIGHT_BUDGET_FIRST : HEIGHT_BUDGET;
    const result = el('span', 'heightcheck__cell heightcheck__cell--result', '測定中…');

    row.append(
      el('span', 'heightcheck__cell', question.id.toUpperCase()),
      el('span', 'heightcheck__cell', question.label),
      el('span', 'heightcheck__cell heightcheck__cell--size', '…'),
      result,
    );
    table.append(row);
    rows.push({ question, cell: row.children[2] as HTMLElement, budget });
    // 判定の欄は cell の次。measure() でまとめて書き込む
  }

  const body = el('div', 'heightcheck__body');
  body.append(table, stage);

  return section(
    '第1部の高さの点検（スマホ幅390px）',
    `質問画面と同じ幅(${PREVIEW_WIDTH}px)で実際に描いて測っている。` +
      `iPhoneのSafariで見える高さ(${VISIBLE_HEIGHT}px)を基準に、2枚の合計が ` +
      `${HEIGHT_BUDGET}px（1問目は案内の枠があるので ${HEIGHT_BUDGET_FIRST}px）以内なら、` +
      `戻るボタンまで含めてスクロールなしで収まる`,
    body,
  );
}

/* ------------------------------------------------------------------
 * 第2部の高さの点検（?debug=1）
 *
 * 第2部のデモは、残った高さに合わせて自分で縮む。
 * だから見るのは「収まるか」ではなく、**縮んだ結果どのくらいの大きさになるか**。
 * 小さくなりすぎると、中の文字が読めず部品の違いが分からなくなる。
 * ------------------------------------------------------------------ */

/**
 * デモに残る高さ。
 *
 * 内訳は 余白(上16+下16) + 進捗21 + 問い(上16+28) + 切り替え(上12+44)
 * + 置き場の上余白12 + 選ぶボタン(上12+52) + 下の行(上10+44)。
 * 文字の折り返しで数pxずれるので、**実際の画面を390×700で測った値**を置く
 * （計算だけで置くと、この表と本物の画面が食い違う）。
 *
 * この残りから、名前の行(44)・説明(18)・枠の上余白(8)を引いたものが
 * スマホの枠の高さになり、幅はその 9/11。
 */
const KIT_CHROME = 297;
const KIT_CHROME_HINT = 50;
const KIT_DEMO_OVERHEAD = 44 + 18 + 8;

/** これより小さいと、デモの中の文字が読めなくなる */
const KIT_MIN_FRAME_WIDTH = 200;

function kitHeightSection(): HTMLElement {
  const table = el('div', 'heightcheck');

  const head = el('div', 'heightcheck__row heightcheck__row--head');
  for (const text of ['問', '聞くこと', 'スマホの枠', '読めるか']) {
    head.append(el('span', 'heightcheck__cell', text));
  }
  table.append(head);

  for (const [index, question] of KIT_QUESTIONS.entries()) {
    const chrome = KIT_CHROME + (index === 0 ? KIT_CHROME_HINT : 0);
    const frameHeight = VISIBLE_HEIGHT - chrome - KIT_DEMO_OVERHEAD;
    // 枠は 9:11 の縦長。幅は高さから決まる（kit.css）
    const frameWidth = Math.round((frameHeight * 9) / 11);
    const ok = frameWidth >= KIT_MIN_FRAME_WIDTH;

    const row = el('div', 'heightcheck__row');
    const result = el(
      'span',
      `heightcheck__cell heightcheck__cell--result heightcheck__cell--${ok ? 'ok' : 'ng'}`,
      ok ? `読める（${frameWidth - KIT_MIN_FRAME_WIDTH}px の余裕）` : '小さすぎる',
    );
    row.append(
      el('span', 'heightcheck__cell', question.id.toUpperCase()),
      el('span', 'heightcheck__cell', question.label),
      el('span', 'heightcheck__cell heightcheck__cell--size', `${frameWidth} × ${frameHeight}px`),
      result,
    );
    table.append(row);
  }

  return section(
    '第2部の高さの点検（スマホ幅390px）',
    `デモは残った高さに合わせて縮むので、はみ出すことはない。` +
      `見るのは縮んだあとの大きさ。幅 ${KIT_MIN_FRAME_WIDTH}px を下回ると、` +
      `中の文字が読めず部品の違いが分からなくなる`,
    table,
  );
}

/**
 * 実際に描いて測る。ページに入ってからでないと測れないので、
 * renderDebug の mounted() から呼ぶ。
 */
function measureHeights(rows: HeightRow[], stage: HTMLElement): void {
  for (const row of rows) {
    const { subject } = resolveSubject(row.question.subject);
    const heights = (['left', 'right'] as AxisSide[]).map((side) => {
      const host = el('div', 'heightcheck__probe');
      host.append(createPreview(subject, buildAxisVariantTheme(row.question.axis, side)));
      stage.append(host);
      const height = Math.round(
        (host.firstElementChild?.firstElementChild as HTMLElement).getBoundingClientRect().height,
      );
      host.remove();
      return height;
    });

    const total = heights[0] + heights[1];
    const over = total - row.budget;
    row.cell.textContent = `${heights[0]} + ${heights[1]} = ${total}px`;

    const result = row.cell.nextElementSibling as HTMLElement;
    result.textContent = over <= 0 ? `収まる（余り ${-over}px）` : `はみ出す（+${over}px）`;
    result.classList.toggle('heightcheck__cell--ng', over > 0);
    result.classList.toggle('heightcheck__cell--ok', over <= 0);
  }
}

export function renderDebug(): View {
  const wrap = el('div', 'gallery__wrap');

  const header = el('header', 'gallery__header');
  header.append(
    el('p', 'gallery__eyebrow', 'DEBUG / PREVIEW PARTS'),
    el('h1', 'gallery__title', '部品カタログ'),
    el(
      'p',
      'gallery__lead',
      'HTMLはどのカードも同じ。囲む要素のCSS変数だけを差し替えて描いています。' +
        '診断そのものは ?debug=1 を外すと表示されます。',
    ),
  );

  const players: KitPlayer[] = [];
  const heightRows: HeightRow[] = [];
  // 測るための器。画面の外に置くが、レイアウトはさせる（でないと高さが出ない）
  const stage = el('div', 'heightcheck__stage');
  stage.setAttribute('aria-hidden', 'true');

  const main = el('main', 'gallery');
  main.append(
    heightCheckSection(heightRows, stage),
    kitSection(players),
    kitHeightSection(),
    photoCheckSection(),
    typeLinksSection(),
    progressSection(),
    section(
      'ニュートラル',
      '4軸とも中間。質問画面の基準になるテーマ',
      allPreviews(buildNeutralTheme()),
    ),
  );

  for (const axis of AXES) {
    main.append(
      section(
        `${axis.label}：${axis.left.name} ⇄ ${axis.right.name}`,
        `この軸が担当する変数以外はニュートラルと同じ（${axis.label}の差だけが見えるはず）`,
        axisComparison(axis),
      ),
    );
  }

  main.append(
    resultSection({ density: 0, decoration: 0, tone: 0, font: 0 }, 'DFCG', '全問左を選んだ人の結果テーマ'),
    resultSection({ density: 6, decoration: 6, tone: 6, font: 6 }, 'ARPM', '全問右を選んだ人の結果テーマ'),
  );

  wrap.append(header, main);

  return {
    element: wrap,
    mounted() {
      measureHeights(heightRows, stage);
    },
    destroy() {
      for (const player of players) player.destroy();
    },
  };
}
