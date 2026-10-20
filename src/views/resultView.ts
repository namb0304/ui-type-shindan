import { createPreview, PREVIEWS } from '../components/previews';
import { AXES } from '../data/axes';
import type { DiagnosisResult } from '../data/types';
import { toPercent } from '../logic/score';
import { applyTheme, buildResultTheme } from '../logic/theme';
import { button, el } from './dom';

export interface ResultHandlers {
  onRestart: () => void;
  onBack: () => void;
}

/**
 * 結果画面（要件 §5-3）。
 *
 * この画面の見せ場は、ページ全体がそのタイプのテーマに変わること。
 * CSS変数は画面のルート要素に適用する。画面を作り直せば消えるので、
 * 他の画面にテーマが残らない。
 *
 * 解説文とAIプロンプトはステップ7で追加する。
 */
export function renderResult(result: DiagnosisResult, handlers: ResultHandlers): HTMLElement {
  const screen = el('main', 'screen screen--result');
  applyTheme(screen, buildResultTheme(result.scores));

  // --- タイプコード ---
  const head = el('div', 'result__head');
  head.append(
    el('p', 'result__eyebrow', 'あなたのUIタイプ'),
    el('p', 'result__code', result.code),
    el('p', 'result__note', '呼び名と解説文はこれから用意します（ステップ7）'),
  );

  // --- 4軸の割合バー ---
  const axesBlock = el('section', 'result__block');
  axesBlock.append(el('h2', 'result__heading', '4つの軸'));

  const list = el('ul', 'axes');
  for (const axis of AXES) {
    const score = result.scores.find((candidate) => candidate.axis === axis.id);
    if (!score) continue;

    const rightPercent = toPercent(score.rightRatio);
    const leftPercent = 100 - rightPercent;
    const isRight = rightPercent >= 50;

    const row = el('li', 'axis');
    const labels = el('div', 'axis__labels');
    labels.append(
      el('span', `axis__side${isRight ? '' : ' axis__side--on'}`, `${axis.left.name}（${leftPercent}%）`),
      el('span', 'axis__name', axis.label),
      el('span', `axis__side${isRight ? ' axis__side--on' : ''}`, `${axis.right.name}（${rightPercent}%）`),
    );

    const track = el('div', 'axis__track');
    const fill = el('span', 'axis__fill');
    fill.style.width = `${isRight ? rightPercent : leftPercent}%`;
    if (!isRight) fill.classList.add('axis__fill--left');
    track.append(fill);

    row.append(labels, track);
    list.append(row);
  }
  axesBlock.append(list);

  // --- あなた専用UIのプレビュー ---
  const previewBlock = el('section', 'result__block');
  previewBlock.append(
    el('h2', 'result__heading', 'あなた好みのUI'),
    el('p', 'result__sub', '同じ部品を、あなたの回答から作ったデザインで描き直しました。'),
  );

  const grid = el('div', 'result__previews');
  const vars = buildResultTheme(result.scores);
  for (const preview of PREVIEWS) {
    grid.append(createPreview(preview.subject, vars));
  }
  previewBlock.append(grid);

  // --- 操作 ---
  const actions = el('div', 'result__actions');
  actions.append(
    button('btn btn--primary', 'もう一度診断する', handlers.onRestart),
    button('btn btn--ghost', '← 最後の問題にもどる', handlers.onBack),
  );

  screen.append(head, axesBlock, previewBlock, actions);
  return screen;
}
