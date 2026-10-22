import { createKitDemo } from '../components/kit';
import type { KitDemoInstance } from '../components/kit';
import { createScheduler } from '../components/kit/scheduler';
import type { KitAnswerValue, KitOption } from '../data/kitTypes';
import { buildNeutralTheme } from '../logic/theme';
import type { DiagnosisState } from '../state';
import { canGoBackKit, currentKitQuestion, kitChoicesInDisplayOrder, kitProgress } from '../state';
import { button, el } from './dom';
import type { View } from './dom';

export interface KitQuestionHandlers {
  onAnswer: (value: KitAnswerValue) => void;
  onBack: () => void;
}

/** 自動再生で、AとBの間に置く間。続けて動くと切れ目が分からない */
const GAP_BETWEEN_DEMOS_MS = 600;

/**
 * 第2部の質問画面（要件 §5）。
 *
 * 第1部との一番の違いは、**デモが触れること**。
 * そのため「カード全体がタップ領域」にはできず、選ぶためのボタンを枠の外に置く。
 * デモを触っただけで次の問題に進んでしまう、という事故を防ぐための作り。
 *
 * デモはニュートラルのテーマで描く（要件 §4.2：
 * ここで測るのは部品の好みであって、色や余白の好みではない）。
 */
export function renderKitQuestion(
  state: DiagnosisState,
  handlers: KitQuestionHandlers,
): View {
  const question = currentKitQuestion(state);
  const { current, total } = kitProgress(state);
  const scheduler = createScheduler();
  const demos: KitDemoInstance[] = [];

  const screen = el('main', 'screen screen--kit');

  // --- 進捗 ---
  const head = el('div', 'q__head');
  const bar = el('div', 'q__bar');
  const fill = el('span', 'q__bar-fill');
  fill.style.width = `${(current / total) * 100}%`;
  bar.append(fill);
  head.append(bar, el('p', 'q__count', `後半 ${current} / ${total}`));

  // --- 問い ---
  const ask = el('div', 'q__ask');
  ask.append(el('h1', 'q__title', 'どっちが好き？'), el('p', 'q__subject', question.label));

  // 第2部の1問目だけ、触れることを伝える。
  // 第1部とは選び方が変わるので、ここで必ず知らせる
  if (current === 1) {
    ask.append(
      el(
        'p',
        'q__hint',
        '下の画面は実際に動きます。触って試してから、好きなほうの「これにする」を押してください。',
      ),
    );
  }

  // --- 選択肢 ---
  const options = el('div', 'kit__options');
  const order = kitChoicesInDisplayOrder(state, question);
  const vars = buildNeutralTheme();
  const cards: HTMLElement[] = [];

  for (const choice of order) {
    const option: KitOption = question[choice];
    const isSelected = state.kitAnswers[question.id] === choice;

    const card = el('div', `kit__option${isSelected ? ' kit__option--selected' : ''}`);

    // 名前と説明。これを読んで名前を覚えて帰ってもらう（要件 §4.2）
    const caption = el('div', 'kit__caption');
    caption.append(
      el('p', 'kit__name', option.name),
      el('p', 'kit__desc', option.description),
    );

    const demo = createKitDemo(option.id, vars);
    demos.push(demo);

    // 選ぶボタンは枠の外。デモの中のボタン（保存・削除）と混ざらないようにする
    const choose = button('kit__choose', 'これにする', () => handlers.onAnswer(choice));
    if (isSelected) {
      choose.classList.add('kit__choose--selected');
      choose.setAttribute('aria-pressed', 'true');
      choose.textContent = 'これにした';
    }
    choose.setAttribute('aria-label', `${option.name}（${option.description}）にする`);

    card.append(caption, demo.element, choose);
    cards.push(card);
    options.append(card);
  }

  screen.append(head, ask, options);

  // --- どっちでもいい ---
  // 第1部の「どっちも同じに見える」と同じ扱い。2択と同じ大きさにはしない
  const either = button('q__either', 'どっちでもいい', () => handlers.onAnswer('either'));
  if (state.kitAnswers[question.id] === 'either') {
    either.classList.add('q__either--selected');
    either.setAttribute('aria-pressed', 'true');
  }
  screen.append(either);

  // --- 戻る ---
  const foot = el('div', 'q__foot');
  const back = button('btn btn--ghost', '← 1つ前にもどる', handlers.onBack);
  back.disabled = !canGoBackKit(state);
  foot.append(back);
  screen.append(foot);

  /**
   * 自動再生。1つめが終わってから2つめを動かす。
   * 同時に動かすと、どちらを見ればいいか分からなくなるため。
   * いま動いているほうには印を付ける。
   */
  async function playInOrder(): Promise<void> {
    for (const [i, demo] of demos.entries()) {
      if (scheduler.cancelled) return;

      cards[i].classList.add('kit__option--playing');
      await demo.play();
      cards[i].classList.remove('kit__option--playing');

      if (scheduler.cancelled) return;
      await scheduler.wait(GAP_BETWEEN_DEMOS_MS);
    }
  }

  return {
    element: screen,

    mounted() {
      void playInOrder();
    },

    destroy() {
      scheduler.cancel();
      for (const demo of demos) demo.destroy();
    },
  };
}
