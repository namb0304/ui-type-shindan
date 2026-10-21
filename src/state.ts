import { QUESTIONS, TOTAL_QUESTIONS } from './data/questions';
import type { Answers, AnswerValue, AxisSide, Question } from './data/types';

/**
 * 診断の状態（要件定義書 §5：1枚のHTMLで画面を切り替えるSPA構成）。
 *
 * 画面に依存しない純粋な関数だけを置く。
 * 状態は書き換えずに、新しい状態を返す（戻るで回答を変えたときの追いやすさのため）。
 */

export type Screen = 'top' | 'question' | 'result';

export interface DiagnosisState {
  screen: Screen;
  /** 何問目か（0〜11） */
  index: number;
  answers: Answers;
  /**
   * 問題ごとの表示順。true なら「軸の右側」を画面の左に表示する。
   * 位置による偏りを防ぐため問題ごとにランダムに決める（要件 §4）。
   * 最初に一度だけ決めるので、戻ってきても並びは変わらない。
   */
  swapped: Readonly<Record<string, boolean>>;
}

/** テストしやすいよう乱数を差し替えられるようにしておく。 */
export type RandomFn = () => number;

function createSwapMap(random: RandomFn): Record<string, boolean> {
  return Object.fromEntries(QUESTIONS.map((question) => [question.id, random() < 0.5]));
}

export function createInitialState(random: RandomFn = Math.random): DiagnosisState {
  return { screen: 'top', index: 0, answers: {}, swapped: createSwapMap(random) };
}

/** 診断を開始する（回答は引き継がない）。 */
export function start(state: DiagnosisState): DiagnosisState {
  return { ...state, screen: 'question', index: 0, answers: {} };
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

  return {
    ...state,
    answers,
    screen: isLast ? 'result' : 'question',
    index: isLast ? state.index : state.index + 1,
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

/** 結果画面から最後の問題へ戻る。 */
export function backFromResult(state: DiagnosisState): DiagnosisState {
  if (state.screen !== 'result') return state;
  return { ...state, screen: 'question', index: TOTAL_QUESTIONS - 1 };
}

/** 進捗（1始まり）。進捗バーの表示に使う。 */
export function progress(state: DiagnosisState): { current: number; total: number } {
  return { current: state.index + 1, total: TOTAL_QUESTIONS };
}

export function isComplete(state: DiagnosisState): boolean {
  return QUESTIONS.every((question) => state.answers[question.id] !== undefined);
}
