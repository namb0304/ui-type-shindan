import './styles/base.css';
import './styles/preview.css';

import { isDebugMode } from './debug';
import { calcResult, isTypeCode, pointsFromCode, resultFromPoints } from './logic/score';
import type { DiagnosisState } from './state';
import { answer, backFromResult, createInitialState, goBack, restart, start } from './state';
import { renderDebug } from './views/debugView';
import { renderQuestion } from './views/questionView';
import { renderResult } from './views/resultView';
import { renderTop } from './views/topView';

/**
 * 起動と画面の切り替え（要件定義書 §9）。
 *
 * 状態は state.ts が持ち、ここは「状態 → 画面」を描き直すだけにする。
 *
 * 確認用の入口：
 *   ?debug=1            部品カタログと16タイプへのリンク
 *   ?debug=1&type=ARCM  そのタイプの結果ページ
 * 共有URL（?r=）の読み取りはステップ8で作る。
 */

const app = document.querySelector<HTMLDivElement>('#app');

let state: DiagnosisState = createInitialState();

function update(next: DiagnosisState): void {
  state = next;
  render();
  window.scrollTo({ top: 0 });
}

function currentView(): HTMLElement {
  switch (state.screen) {
    case 'top':
      return renderTop(() => update(start(state)));
    case 'question':
      return renderQuestion(state, {
        onAnswer: (value) => update(answer(state, value)),
        onBack: () => update(goBack(state)),
      });
    case 'result':
      return renderResult(calcResult(state.answers), {
        onRestart: () => update(restart()),
        onBack: () => update(backFromResult(state)),
      });
  }
}

function render(): void {
  if (!app) return;
  app.replaceChildren(currentView());
}

function params(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/** ?debug=1&type=ARCM で、そのタイプの結果ページを開く（確認用）。 */
function renderDebugType(code: string): void {
  if (!app) return;
  const result = resultFromPoints(pointsFromCode(code));
  app.replaceChildren(
    renderResult(result, {
      onRestart: () => {
        window.location.search = '?debug=1';
      },
      onBack: () => {
        window.location.search = '?debug=1';
      },
    }),
  );
}

if (app) {
  const debugType = params().get('type');

  if (!isDebugMode()) {
    render();
  } else if (debugType && isTypeCode(debugType)) {
    renderDebugType(debugType.toUpperCase());
  } else {
    app.replaceChildren(renderDebug());
  }
}
