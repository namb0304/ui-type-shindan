import { TOTAL_KIT_QUESTIONS } from '../data/kitQuestions';
import { TOTAL_QUESTIONS } from '../data/questions';
import { button, el } from './dom';

export interface BreakHandlers {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * ひと休み画面（要件 §5・§4.2）。
 *
 * 22問を続けて出すと途中で飽きるので、第1部と第2部の間に1枚挟む。
 * ここは休憩なので、読むものを増やさない。
 * 「どこまで来たか」と「次に何を聞かれるか」だけを伝える。
 *
 * 問数はどちらも配列の長さから出す。第2部の問題を足せばここも追従する。
 */
export function renderBreak(handlers: BreakHandlers): HTMLElement {
  const screen = el('main', 'screen screen--break');

  const card = el('div', 'brk');
  card.append(
    el('p', 'brk__done', `${TOTAL_QUESTIONS}問、おつかれさまでした`),
    el('h1', 'brk__title', '前半おわり！'),
    el(
      'p',
      'brk__lead',
      'ここまでは「どんな雰囲気が好きか」でした。' +
        'ここからは、よく見るUIの部品について、どっちをよく使いたいかを聞きます。',
    ),
    el('p', 'brk__next', `のこり ${TOTAL_KIT_QUESTIONS}問`),
  );

  const next = button('btn btn--primary', '後半にすすむ', handlers.onContinue);

  const foot = el('div', 'brk__foot');
  foot.append(button('btn btn--ghost', '← 前半の最後にもどる', handlers.onBack));

  screen.append(card, next, foot);
  return screen;
}
