import './styles/base.css';
import './styles/preview.css';

import { calcResult } from './logic/score';
import type { DiagnosisState } from './state';
import { answer, backFromResult, createInitialState, goBack, restart, start } from './state';
import { renderDebug } from './views/debugView';
import { renderQuestion } from './views/questionView';
import { renderResult } from './views/resultView';
import { renderTop } from './views/topView';

/**
 * 起動と画面の切り替え（要件 §9）。
 *
 * 状態は state.ts が持ち、ここは「状態 → 画面」を描き直すだけにする。
 * ?debug=1 を付けると部品カタログを表示する（ステップ6で使う）。
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
        onAnswer: (side) => update(answer(state, side)),
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

function isDebug(): boolean {
  return new URLSearchParams(window.location.search).get('debug') === '1';
}

if (app) {
  if (isDebug()) {
    app.replaceChildren(renderDebug());
  } else {
    render();
  }
}
