import './styles/base.css';
import './styles/preview.css';
import './styles/kit.css';

import { isDebugMode } from './debug';
import { calcResult, isTypeCode, pointsFromCode, resultFromPoints } from './logic/score';
import type { DiagnosisState } from './state';
import {
  answer,
  answerKit,
  backFromResult,
  createInitialState,
  goBack,
  goBackKit,
  restart,
  start,
} from './state';
import { renderDebug } from './views/debugView';
import type { View } from './views/dom';
import { staticView } from './views/dom';
import { renderKitQuestion } from './views/kitQuestionView';
import { renderQuestion } from './views/questionView';
import { renderResult } from './views/resultView';
import { renderTop } from './views/topView';

/**
 * 起動と画面の切り替え（要件定義書 §9）。
 *
 * 状態は state.ts が持ち、ここは「状態 → 画面」を描き直すだけにする。
 * 画面の流れ：top → question（12問）→ kit（第2部）→ result
 *
 * 確認用の入口：
 *   ?debug=1            部品カタログと16タイプへのリンク
 *   ?debug=1&type=ARCM  そのタイプの結果ページ
 * 共有URL（?r=）の読み取りはステップ8で作る。
 */

const app = document.querySelector<HTMLDivElement>('#app');

let state: DiagnosisState = createInitialState();

/**
 * いま表示している画面。
 * 第2部のデモはタイマーを持つので、描き直す前に必ず destroy() する
 * （放っておくと、消えた要素を触ってエラーになる）。
 */
let view: View | undefined;

function update(next: DiagnosisState): void {
  state = next;
  render();
  window.scrollTo({ top: 0 });
}

function currentView(): View {
  switch (state.screen) {
    case 'top':
      return staticView(renderTop(() => update(start(state))));
    case 'question':
      return staticView(
        renderQuestion(state, {
          onAnswer: (value) => update(answer(state, value)),
          onBack: () => update(goBack(state)),
        }),
      );
    case 'kit':
      return renderKitQuestion(state, {
        onAnswer: (value) => update(answerKit(state, value)),
        onBack: () => update(goBackKit(state)),
      });
    case 'result':
      return renderResult(
        calcResult(state.answers),
        {
          onRestart: () => update(restart()),
          onBack: () => update(backFromResult(state)),
        },
        state.kitAnswers,
      );
  }
}

function mount(next: View): void {
  if (!app) return;
  view?.destroy?.();
  view = next;
  app.replaceChildren(next.element);
  next.mounted?.();
}

function render(): void {
  mount(currentView());
}

function params(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/** ?debug=1&type=ARCM で、そのタイプの結果ページを開く（確認用）。 */
function renderDebugType(code: string): void {
  const result = resultFromPoints(pointsFromCode(code));
  // 第2部の回答は無いので、全項目「どちらでも」として描く。
  // 16タイプの見た目を確かめるのが目的なので、これで足りる
  mount(
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
    mount(renderDebug());
  }
}
