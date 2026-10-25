import { estimatedMinutes, TOTAL_ALL_QUESTIONS } from '../data/quiz';
import { button, el } from './dom';

/** トップ画面（要件 §5-1）。 */
export function renderTop(onStart: () => void): HTMLElement {
  const screen = el('main', 'screen screen--top');

  const hero = el('div', 'top__hero');
  hero.append(
    el('h1', 'top__title', 'デザインの好み、場所でいうと？'),
    el(
      'p',
      'top__lead',
      `同じ画面を2つ並べます。中身は同じなので、見た目が好きなほうを選んでください。${TOTAL_ALL_QUESTIONS}問で、あなたの好みのタイプが分かります。`,
    ),
  );

  const meta = el('ul', 'top__meta');
  // 問題数と所要時間は質問データから数える（増やしてもここは直さない）
  for (const text of [`全${TOTAL_ALL_QUESTIONS}問`, `約${estimatedMinutes()}分`, '登録なし']) {
    meta.append(el('li', 'top__meta-item', text));
  }

  const start = button('btn btn--primary', '診断をはじめる', onStart);

  const note = el(
    'p',
    'top__note',
    'この診断はエンタメです。科学的な根拠はありません。入力した内容がどこかに送られることもありません。',
  );

  screen.append(hero, meta, start, note);
  return screen;
}
