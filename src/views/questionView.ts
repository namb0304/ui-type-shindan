import { createPreview } from '../components/previews';
import { resolveSubject } from '../components/previews/fallback';
import type { AnswerValue } from '../data/types';
import { isDebugMode } from '../debug';
import { buildAxisVariantTheme } from '../logic/theme';
import type { DiagnosisState } from '../state';
import { canGoBack, currentQuestion, overallProgress, sidesInDisplayOrder } from '../state';
import { button, el, progressHead } from './dom';

export interface QuestionHandlers {
  onAnswer: (value: AnswerValue) => void;
  onBack: () => void;
}

/**
 * 質問画面（要件 §5-2）。
 *
 * 2つのプレビューは、測る軸だけが違い、他の3軸はニュートラルで同じ（視力検査方式）。
 * 軸の名前は先入観を与えるので画面には出さない。
 *
 * **スクロールなしで操作が完結する**ように組む（CLAUDE.md の作業ルール）。
 * 画面を縦のflexにして、プレビューの置き場だけを伸び縮みさせる。
 * 上下の要素を引いた残りが、そのまま2枚に使える高さになる。
 */
export function renderQuestion(
  state: DiagnosisState,
  handlers: QuestionHandlers,
): HTMLElement {
  const question = currentQuestion(state);
  const { current, total } = overallProgress(state);
  const resolved = resolveSubject(question.subject);

  const screen = el('main', 'screen screen--question');

  // --- 進捗 ---
  screen.append(progressHead(current, total));

  // --- 問い ---
  //
  // 題材と「どっちが好き？」を1行にまとめる。2行に分けると、
  // そのぶんプレビューに使える高さが減る。
  screen.append(el('h1', 'q__ask', `${question.label}、どっちが好き？`));

  // 初めての人は「何を比べる画面なのか」が分からず、中身を読んで迷ってしまう。
  // 案内は1問目だけに出す。2問目以降も出すと、毎回1行ぶん高さを食う
  if (current === 1) {
    screen.append(
      el('p', 'q__hint', '中身はどちらも同じです。見た目が好きなほうを選んでください。'),
    );
  }

  // 開発用のメモなので、本番の画面には出さない
  if (resolved.isFallback && isDebugMode()) {
    screen.append(el('p', 'q__fallback', '※ この題材の部品は仮です（ステップ6で差し替え）'));
  }

  // --- 選択肢 ---
  // ここだけが伸び縮みする。残った高さに2枚を収める
  const stage = el('div', 'q__stage');
  const [first, second] = sidesInDisplayOrder(state, question);

  for (const side of [first, second]) {
    const isSelected = state.answers[question.id] === side;
    const option = el('button', `q__option${isSelected ? ' q__option--selected' : ''}`);
    option.type = 'button';
    option.setAttribute('aria-label', `${side === first ? '1つめ' : '2つめ'}のデザインを選ぶ`);
    if (isSelected) option.setAttribute('aria-pressed', 'true');
    option.append(createPreview(resolved.subject, buildAxisVariantTheme(question.axis, side)));
    option.addEventListener('click', () => handlers.onAnswer(side));
    stage.append(option);
  }

  screen.append(stage);

  // --- 戻る と「どっちも同じに見える」 ---
  //
  // 1行にまとめて、縦を44pxで済ませる。左が「進むのをやめる操作」、
  // 右が「答えの選択肢」。役割が違うことを位置で分ける。
  //
  // 「どっちも同じに見える」は2択と同じ大きさにはしない。
  // 差が分かる人にはそちらを選んでほしいので、あくまで逃げ道として置く。
  const either = button('q__either', 'どっちも同じに見える', () => handlers.onAnswer('either'));
  if (state.answers[question.id] === 'either') {
    either.classList.add('q__either--selected');
    either.setAttribute('aria-pressed', 'true');
  }

  const back = button('q__back', '← もどる', handlers.onBack);
  back.disabled = !canGoBack(state);

  const utility = el('div', 'q__utility');
  utility.append(back, either);
  screen.append(utility);

  return screen;
}
