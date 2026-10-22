import { createKitDemo } from '../components/kit';
import type { KitAnswerValue, KitOption } from '../data/kitTypes';
import { buildNeutralTheme } from '../logic/theme';
import type { DiagnosisState } from '../state';
import { canGoBackKit, currentKitQuestion, kitChoicesInDisplayOrder, kitProgress } from '../state';
import { button, el } from './dom';
import type { View } from './dom';
import { createKitPlayer } from './kitPlayer';

export interface KitQuestionHandlers {
  onAnswer: (value: KitAnswerValue) => void;
  onBack: () => void;
}

/** 切り替えスイッチに付ける見出し（表示位置の順）。 */
const POSITION_LABEL = ['A', 'B'] as const;

/**
 * 第2部の質問画面（要件 §5）。
 *
 * 第1部との一番の違いは、**デモが触れること**。
 * そのため「カード全体がタップ領域」にはできず、選ぶためのボタンを枠の外に置く。
 * デモを触っただけで次の問題に進んでしまう、という事故を防ぐための作り。
 *
 * 並べ方は幅で変える（base.css）。
 *   PC（680px以上）：2つを左右に並べる
 *   スマホ         ：同じ場所で切り替える。縦に並べると、下を見ている間に
 *                    上の動きを忘れてしまい、見比べられないため
 *
 * どちらの幅でも、選ぶボタン2つと「どっちでもいい」は常に両方見えるようにする。
 *
 * デモはニュートラルのテーマで描く（要件 §4.2：
 * ここで測るのは部品の好みであって、色や余白の好みではない）。
 */
export function renderKitQuestion(state: DiagnosisState, handlers: KitQuestionHandlers): View {
  const question = currentKitQuestion(state);
  const { current, total } = kitProgress(state);
  const isFirst = current === 1;

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

  // 第2部は選び方が第1部と変わる。1問目だけ手順を大きく出し、
  // 2問目以降は一言に落とす（毎問出すとデモの邪魔になる）
  if (isFirst) {
    const steps = el('ol', 'kit__steps');
    steps.append(
      el('li', 'kit__step', '2つの動きを見比べる'),
      el('li', 'kit__step', '好きなほうを選ぶ'),
    );
    ask.append(steps);
  } else {
    ask.append(el('p', 'kit__note', '動きを見てから選んでください'));
  }

  // --- 切り替えスイッチ（スマホのみ表示） ---
  const order = kitChoicesInDisplayOrder(state, question);
  const switcher = el('div', 'kit__switch');
  switcher.setAttribute('role', 'tablist');
  switcher.setAttribute('aria-label', '見比べる部品の切り替え');

  const tabs = order.map((choice, i) => {
    const tab = el('button', 'kit__tab', `${POSITION_LABEL[i]} ${question[choice].name}`);
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    switcher.append(tab);
    return tab;
  });

  // --- デモ ---
  const stage = el('div', 'kit__options');
  const player = createKitPlayer(stage);
  const vars = buildNeutralTheme();

  // --- 選ぶボタン（表示中かどうかに関わらず、常に2つとも見える） ---
  const choices = el('div', 'kit__choices');

  for (const [i, choice] of order.entries()) {
    const option: KitOption = question[choice];
    const isSelected = state.kitAnswers[question.id] === choice;

    const card = el('div', 'kit__option');

    // 名前と説明。これを読んで名前を覚えて帰ってもらう（要件 §4.2）
    const caption = el('div', 'kit__caption');
    caption.append(
      el('p', 'kit__name', `${POSITION_LABEL[i]}　${option.name}`),
      el('p', 'kit__desc', option.description),
    );

    const demo = createKitDemo(option.id, vars);
    const playButton = player.add(demo, tabs[i]);
    playButton.setAttribute('aria-label', `${option.name}の動きを見る`);

    // どこを押せば動くかを、ボタン名のまま伝える（文章にベタ書きしない）
    const touchHint = el(
      'p',
      'kit__touch',
      `枠の中の「${demo.triggerLabel}」を押しても動きます`,
    );

    card.append(caption, demo.element, playButton, touchHint);
    stage.append(card);

    const choose = button(
      `kit__choose${isSelected ? ' kit__choose--selected' : ''}`,
      isSelected ? `${option.name}にした` : `${option.name}にする`,
      () => handlers.onAnswer(choice),
    );
    if (isSelected) choose.setAttribute('aria-pressed', 'true');
    choices.append(choose);
  }

  screen.append(head, ask, switcher, stage, choices);

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

  return {
    element: screen,
    mounted() {
      void player.playAll();
    },
    destroy() {
      player.destroy();
    },
  };
}
