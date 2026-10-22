import { KIT_QUESTIONS, TOTAL_KIT_QUESTIONS } from './data/kitQuestions';
import { TOTAL_ALL_QUESTIONS } from './data/quiz';
import type { KitAnswers, KitAnswerValue, KitChoice, KitQuestion } from './data/kitTypes';
import { QUESTIONS, TOTAL_QUESTIONS } from './data/questions';
import type { Answers, AnswerValue, AxisSide, Question } from './data/types';

/**
 * 診断の状態（要件定義書 §5：1枚のHTMLで画面を切り替えるSPA構成）。
 *
 * 画面に依存しない純粋な関数だけを置く。
 * 状態は書き換えずに、新しい状態を返す（戻るで回答を変えたときの追いやすさのため）。
 */

/**
 * 画面の流れ（要件 §5）。
 *   top → question（第1部12問）→ kit（第2部）→ result
 *
 * 第1部と第2部の間に切れ目は置かない。進捗バーが満了してから
 * 「まだ続きます」と出すと、ゴールが急に遠ざかってだまされた感じになる。
 * 進捗は最初から通しの1本で数える（overallProgress）。
 */
export type Screen = 'top' | 'question' | 'kit' | 'result';

export interface DiagnosisState {
  screen: Screen;
  /** 第1部が何問目か（0〜11） */
  index: number;
  answers: Answers;
  /**
   * 問題ごとの表示順。true なら「軸の右側」を画面の左に表示する。
   * 位置による偏りを防ぐため問題ごとにランダムに決める（要件 §4）。
   * 最初に一度だけ決めるので、戻ってきても並びは変わらない。
   */
  swapped: Readonly<Record<string, boolean>>;

  /** 第2部が何問目か */
  kitIndex: number;
  /**
   * 第2部の回答。**16タイプの判定には使わない**（要件 §4.2）。
   * 判定に混ざらないよう、第1部の answers とは別に持つ。
   */
  kitAnswers: KitAnswers;
  /** 第2部の表示順。true なら選択肢 b を画面の先に表示する */
  kitSwapped: Readonly<Record<string, boolean>>;
}

/** テストしやすいよう乱数を差し替えられるようにしておく。 */
export type RandomFn = () => number;

function createSwapMap(ids: readonly string[], random: RandomFn): Record<string, boolean> {
  return Object.fromEntries(ids.map((id) => [id, random() < 0.5]));
}

export function createInitialState(random: RandomFn = Math.random): DiagnosisState {
  return {
    screen: 'top',
    index: 0,
    answers: {},
    swapped: createSwapMap(
      QUESTIONS.map((question) => question.id),
      random,
    ),
    kitIndex: 0,
    kitAnswers: {},
    kitSwapped: createSwapMap(
      KIT_QUESTIONS.map((question) => question.id),
      random,
    ),
  };
}

/** 診断を開始する（回答は引き継がない）。 */
export function start(state: DiagnosisState): DiagnosisState {
  return { ...state, screen: 'question', index: 0, answers: {}, kitIndex: 0, kitAnswers: {} };
}

/** トップに戻ってやり直す。表示順も引き直す。 */
export function restart(random: RandomFn = Math.random): DiagnosisState {
  return createInitialState(random);
}

export function currentQuestion(state: DiagnosisState): Question {
  const question = QUESTIONS[state.index];
  if (!question) {
    throw new Error(`問題番号が範囲外です: ${state.index}`);
  }
  return question;
}

/** 表示順：画面の左右に、軸のどちら側を置くか。 */
export function sidesInDisplayOrder(
  state: DiagnosisState,
  question: Question,
): readonly [AxisSide, AxisSide] {
  return state.swapped[question.id] ? ['right', 'left'] : ['left', 'right'];
}

/**
 * いまの問題に回答して次へ進む。最後の問題なら結果画面へ。
 * すでに回答済みの問題でも上書きできる（戻って選び直せる）。
 *
 * value は「軸の左側」「軸の右側」「どちらでもない」のいずれか。
 */
export function answer(state: DiagnosisState, value: AnswerValue): DiagnosisState {
  const question = currentQuestion(state);
  const answers: Answers = { ...state.answers, [question.id]: value };
  const isLast = state.index >= TOTAL_QUESTIONS - 1;

  // 第1部の最後は、そのまま第2部の1問目へ（要件 §5）
  return {
    ...state,
    answers,
    screen: isLast ? 'kit' : 'question',
    index: isLast ? state.index : state.index + 1,
    kitIndex: isLast ? 0 : state.kitIndex,
  };
}

export function canGoBack(state: DiagnosisState): boolean {
  return state.screen === 'question' && state.index > 0;
}

/** 1つ前の問題へ戻る。1問目では何もしない。 */
export function goBack(state: DiagnosisState): DiagnosisState {
  if (!canGoBack(state)) return state;
  return { ...state, index: state.index - 1 };
}

/** 結果画面から、第2部の最後の問題へ戻る。 */
export function backFromResult(state: DiagnosisState): DiagnosisState {
  if (state.screen !== 'result') return state;
  return { ...state, screen: 'kit', kitIndex: TOTAL_KIT_QUESTIONS - 1 };
}

/** 進捗（1始まり）。進捗バーの表示に使う。 */
export function progress(state: DiagnosisState): { current: number; total: number } {
  return { current: state.index + 1, total: TOTAL_QUESTIONS };
}

export function isComplete(state: DiagnosisState): boolean {
  return QUESTIONS.every((question) => state.answers[question.id] !== undefined);
}

// ---------------------------------------------------------------------------
// 第2部（定番UIキット）
//
// 第1部と同じ形の関数をひと通り用意する。
// 混ざると判定が濁るので、関数も状態も最後まで分けておく（要件 §4.2）。
// ---------------------------------------------------------------------------

export function currentKitQuestion(state: DiagnosisState): KitQuestion {
  const question = KIT_QUESTIONS[state.kitIndex];
  if (!question) {
    throw new Error(`第2部の問題番号が範囲外です: ${state.kitIndex}`);
  }
  return question;
}

/** 表示順：画面の上下（PCでは左右）に、どちらの選択肢を置くか。 */
export function kitChoicesInDisplayOrder(
  state: DiagnosisState,
  question: KitQuestion,
): readonly [KitChoice, KitChoice] {
  return state.kitSwapped[question.id] ? ['b', 'a'] : ['a', 'b'];
}

/**
 * 第2部に回答して次へ進む。最後の問題なら結果画面へ。
 * すでに回答済みの問題でも上書きできる（戻って選び直せる）。
 */
export function answerKit(state: DiagnosisState, value: KitAnswerValue): DiagnosisState {
  const question = currentKitQuestion(state);
  const kitAnswers: KitAnswers = { ...state.kitAnswers, [question.id]: value };
  const isLast = state.kitIndex >= TOTAL_KIT_QUESTIONS - 1;

  return {
    ...state,
    kitAnswers,
    screen: isLast ? 'result' : 'kit',
    kitIndex: isLast ? state.kitIndex : state.kitIndex + 1,
  };
}

/** 第2部ではいつでも戻れる。1問目から戻ると第1部の最後の問題に出る。 */
export function canGoBackKit(state: DiagnosisState): boolean {
  return state.screen === 'kit';
}

export function goBackKit(state: DiagnosisState): DiagnosisState {
  if (!canGoBackKit(state)) return state;
  if (state.kitIndex === 0) {
    return { ...state, screen: 'question', index: TOTAL_QUESTIONS - 1 };
  }
  return { ...state, kitIndex: state.kitIndex - 1 };
}

export function kitProgress(state: DiagnosisState): { current: number; total: number } {
  return { current: state.kitIndex + 1, total: TOTAL_KIT_QUESTIONS };
}

export function isKitComplete(state: DiagnosisState): boolean {
  return KIT_QUESTIONS.every((question) => state.kitAnswers[question.id] !== undefined);
}

/**
 * 通しの進捗（1始まり）。第1部と第2部を1本に続けて数える。
 * 第1部の12問目が 12/15、第2部の1問目が 13/15 になる。
 */
export function overallProgress(state: DiagnosisState): { current: number; total: number } {
  const current =
    state.screen === 'kit' ? TOTAL_QUESTIONS + state.kitIndex + 1 : state.index + 1;
  return { current, total: TOTAL_ALL_QUESTIONS };
}
