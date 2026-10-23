import { createKitDemo, prefersReducedMotion } from '../components/kit';
import type { KitAnswerValue, KitOption } from '../data/kitTypes';
import { buildNeutralTheme } from '../logic/theme';
import type { DiagnosisState } from '../state';
import {
  canGoBackKit,
  currentKitQuestion,
  kitChoicesInDisplayOrder,
  kitProgress,
  overallProgress,
} from '../state';
import { button, el, progressHead } from './dom';
import type { View } from './dom';
import { createKitPlayer } from './kitPlayer';

export interface KitQuestionHandlers {
  onAnswer: (value: KitAnswerValue) => void;
  onBack: () => void;
}

/** 切り替えスイッチに付ける見出し（表示位置の順）。 */
const POSITION_LABEL = ['A', 'B'] as const;

/**
 * 動きを止めている人に、K9・K10 で出す案内（要件 §4.2）。
 *
 * この2問は動きそのものが問題なので、動きを止めると本当に差が出ない。
 * 黙って同じものを2つ並べると「壊れている」と思われるので、
 * 違いが出ないことを先に伝えて、「どっちでもいい」を既定として勧める。
 */
const NO_DIFFERENCE_NOTE =
  '端末の設定で動きが止まっているので、この問題は違いが出ません。「どっちでもいい」で進んでください。';

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
  const { current, total } = overallProgress(state);
  // 手順の案内を出すのは、第2部に入った最初の1問だけ
  const isFirst = kitProgress(state).current === 1;

  const screen = el('main', 'screen screen--kit');

  // --- 進捗 ---
  screen.append(progressHead(current, total));

  // --- 問い ---
  // 聞くことと「どっちが好き？」を1行にまとめる。
  // 2行に分けると、そのぶんデモに使える高さが減る
  screen.append(el('h1', 'q__ask', `${question.label}、どっちが好き？`));

  // 第2部は選び方が第1部と変わる。案内は1問目だけに出す
  if (isFirst) {
    screen.append(el('p', 'q__hint', '2つの動きを見比べてから、好きなほうを選んでください。'));
  }

  // 動きを止めているとき、アニメーションの2問（K9・K10）だけは差が出ない
  const noDifference = question.category === 'motion' && prefersReducedMotion();
  if (noDifference) {
    const note = el('p', 'kit__alert', NO_DIFFERENCE_NOTE);
    note.setAttribute('role', 'status');
    screen.append(note);
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
  screen.append(switcher);

  // --- デモ ---
  // ここだけが伸び縮みする。残った高さがそのままスマホの枠の高さになる
  const stage = el('div', 'kit__stage');
  const player = createKitPlayer(stage);
  const vars = buildNeutralTheme();

  // --- 選ぶボタン（表示中かどうかに関わらず、常に2つとも見える） ---
  const choices = el('div', 'kit__choices');

  for (const [i, choice] of order.entries()) {
    const option: KitOption = question[choice];
    const isSelected = state.kitAnswers[question.id] === choice;

    const cell = el('div', 'kit__option');

    // 名前と説明。これを読んで名前を覚えて帰ってもらう（要件 §4.2）。
    // 再生ボタンは名前と同じ行に置く。1行ぶん減らすため
    const caption = el('div', 'kit__caption');
    const name = el('span', 'kit__name', `${POSITION_LABEL[i]}　${option.name}`);

    const demo = createKitDemo(option.id, vars);
    const playButton = player.add(demo, tabs[i]);
    playButton.setAttribute('aria-label', `${option.name}の動きを見る`);

    caption.append(name, playButton);

    const stageBox = el('div', 'kit__demo');
    stageBox.append(demo.element);

    cell.append(caption, el('p', 'kit__desc', option.description), stageBox);
    stage.append(cell);

    // 文言は選んでも「〜にする」のまま（押すと何が起きるかを書く）。
    // 選択中かどうかは、✓と色で見せる
    const choose = button(
      `kit__choose${isSelected ? ' kit__choose--selected' : ''}`,
      `${option.name}にする`,
      () => handlers.onAnswer(choice),
    );
    if (isSelected) {
      choose.setAttribute('aria-pressed', 'true');
      const check = el('span', 'kit__check', '✓');
      check.setAttribute('aria-hidden', 'true');
      choose.prepend(check);
    }
    choices.append(choose);
  }

  screen.append(stage, choices);

  // --- 戻る と「どっちでもいい」 ---
  //
  // 1行にまとめて、縦を44pxで済ませる。
  // 差が出ない2問（K9・K10 を動きを止めて見たとき）では、
  // これが既定の答えになるので塗りつぶして目立たせる（要件 §4.2）。
  // 行を増やして大きくはしない。増やすとデモが縮んで、中の文字が読めなくなる。
  const either = button(
    `q__either${noDifference ? ' q__either--primary' : ''}`,
    'どっちでもいい',
    () => handlers.onAnswer('either'),
  );
  if (state.kitAnswers[question.id] === 'either') {
    either.classList.add('q__either--selected');
    either.setAttribute('aria-pressed', 'true');
  }

  const back = button('q__back', '← もどる', handlers.onBack);
  back.disabled = !canGoBackKit(state);

  const utility = el('div', 'q__utility');
  utility.append(back, either);
  screen.append(utility);

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
