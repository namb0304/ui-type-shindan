import { createPreview, PREVIEWS } from '../components/previews';
import { FALLBACK_SUBJECT, missingSubjects } from '../components/previews/fallback';
import { AXES } from '../data/axes';
import type { AxisDefinition } from '../data/axes';
import { QUESTIONS } from '../data/questions';
import type { ThemeVars } from '../data/tokens';
import type { AxisId, AxisSide, RightCounts } from '../data/types';
import { toAxisScores } from '../logic/score';
import { buildAxisVariantTheme, buildNeutralTheme, buildResultTheme } from '../logic/theme';
import { el } from './dom';

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
  font: 'cafe-menu',
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

function resultSection(counts: RightCounts, code: string, label: string): HTMLElement {
  const vars = buildResultTheme(toAxisScores(counts));
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

export function renderDebug(): HTMLElement {
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

  const main = el('main', 'gallery');
  main.append(
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
    resultSection({ density: 3, decoration: 3, tone: 3, font: 3 }, 'ARPM', '全問右を選んだ人の結果テーマ'),
  );

  wrap.append(header, main);
  return wrap;
}
