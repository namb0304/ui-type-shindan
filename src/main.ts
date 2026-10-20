import './styles/base.css';
import './styles/preview.css';

import { createPreview, PREVIEWS } from './components/previews';
import { AXES } from './data/axes';
import type { AxisDefinition } from './data/axes';
import type { ThemeVars } from './data/tokens';
import type { AxisSide, RightCounts } from './data/types';
import { toAxisScores } from './logic/score';
import { buildAxisVariantTheme, buildNeutralTheme, buildResultTheme } from './logic/theme';

/**
 * ステップ4の動作確認用の仮ページ。
 *
 * 「同じHTMLでも、CSS変数を差し替えると見た目が変わる」ことを目で確認するためのもの。
 * ステップ5（トップ → 質問 → 結果）で丸ごと置き換える前提の使い捨てコード。
 */

/** 軸の左右の比較で使う題材（質問の割り当てに合わせる） */
const AXIS_SUBJECT: Record<string, string> = {
  density: 'cafe-menu',
  decoration: 'music-player',
  tone: 'weather-app',
  font: 'cafe-menu', // Q4の題材（ニュース見出し）はステップ6で作るため代用
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** 部品の下に、確認したいCSS変数の値を表示する */
function caption(vars: ThemeVars, extra?: string): HTMLElement {
  const parts = [
    `余白 ${vars['--space-unit']}`,
    `文字 ${vars['--font-size-base']}`,
    `行間 ${vars['--line-height']}`,
    `角丸 ${vars['--radius']}`,
  ];
  if (extra) parts.unshift(extra);
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

/** 3部品を1つのテーマで並べる */
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

function render(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  const header = el('header', 'gallery__header');
  header.append(
    el('p', 'gallery__eyebrow', 'STEP 4 / PREVIEW PARTS'),
    el('h1', 'gallery__title', 'プレビュー部品の確認'),
    el(
      'p',
      'gallery__lead',
      'HTMLはどのカードも同じ。囲む要素のCSS変数だけを差し替えて描いています。' +
        'この画面はステップ5で診断画面に置き換えます。',
    ),
  );

  const main = el('main', 'gallery');
  main.append(
    section(
      'ニュートラル',
      '4軸とも中間。質問画面の基準になるテーマ（トップ・質問画面はこの控えめな見た目）',
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

  app.replaceChildren(header, main);
}

render();
