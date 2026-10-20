import { TOTAL_QUESTIONS } from '../data/questions';
import { button, el } from './dom';

/** トップ画面（要件 §5-1）。 */
export function renderTop(onStart: () => void): HTMLElement {
  const screen = el('main', 'screen screen--top');

  const hero = el('div', 'top__hero');
  hero.append(
    el('p', 'top__eyebrow', 'UI TYPE'),
    el('h1', 'top__title', 'UIタイプ診断'),
    el(
      'p',
      'top__lead',
      '「どっちが好き？」に答えるだけ。あなたが心地よく感じるUIのタイプが分かります。',
    ),
  );

  const meta = el('ul', 'top__meta');
  for (const text of [`全${TOTAL_QUESTIONS}問`, '約2分', '登録なし']) {
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
