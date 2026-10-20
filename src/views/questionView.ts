import { createPreview } from '../components/previews';
import { resolveSubject } from '../components/previews/fallback';
import type { AxisSide } from '../data/types';
import { buildAxisVariantTheme } from '../logic/theme';
import type { DiagnosisState } from '../state';
import { canGoBack, currentQuestion, progress, sidesInDisplayOrder } from '../state';
import { button, el } from './dom';

export interface QuestionHandlers {
  onAnswer: (side: AxisSide) => void;
  onBack: () => void;
}

/**
 * 質問画面（要件 §5-2）。
 *
 * 2つのプレビューは、測る軸だけが違い、他の3軸はニュートラルで同じ（視力検査方式）。
 * 軸の名前は先入観を与えるので画面には出さない。
 */
export function renderQuestion(
  state: DiagnosisState,
  handlers: QuestionHandlers,
): HTMLElement {
  const question = currentQuestion(state);
  const { current, total } = progress(state);
  const resolved = resolveSubject(question.subject);

  const screen = el('main', 'screen screen--question');

  // --- 進捗 ---
  const head = el('div', 'q__head');
  const bar = el('div', 'q__bar');
  const fill = el('span', 'q__bar-fill');
  fill.style.width = `${(current / total) * 100}%`;
  bar.append(fill);
  head.append(bar, el('p', 'q__count', `${current} / ${total}`));

  // --- 問い ---
  const ask = el('div', 'q__ask');
  ask.append(el('h1', 'q__title', 'どっちが好き？'), el('p', 'q__subject', question.label));
  if (resolved.isFallback) {
    ask.append(el('p', 'q__fallback', '※ この題材の部品は仮です（ステップ6で差し替え）'));
  }

  // --- 選択肢 ---
  const options = el('div', 'q__options');
  const [first, second] = sidesInDisplayOrder(state, question);

  for (const side of [first, second]) {
    const isSelected = state.answers[question.id] === side;
    const option = el('button', `q__option${isSelected ? ' q__option--selected' : ''}`);
    option.type = 'button';
    option.setAttribute('aria-label', `${side === first ? 'A' : 'B'}のデザインを選ぶ`);
    if (isSelected) option.setAttribute('aria-pressed', 'true');
    option.append(createPreview(resolved.subject, buildAxisVariantTheme(question.axis, side)));
    option.addEventListener('click', () => handlers.onAnswer(side));
    options.append(option);
  }

  screen.append(head, ask, options);

  // --- 戻る ---
  const foot = el('div', 'q__foot');
  const back = button('btn btn--ghost', '← 1つ前にもどる', handlers.onBack);
  back.disabled = !canGoBack(state);
  foot.append(back);
  screen.append(foot);

  return screen;
}
