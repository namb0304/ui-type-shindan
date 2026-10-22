import { TOTAL_KIT_QUESTIONS } from './kitQuestions';
import { TOTAL_QUESTIONS } from './questions';

/**
 * 診断全体の分量（トップページの案内と、進捗バーの分母に使う）。
 *
 * 問題数はどこにもベタ書きしない。質問データの配列から数えるので、
 * 第2部の問題を増やしても、トップも進捗バーも自動で追従する。
 */

/** 第1部（雰囲気の4軸）＋ 第2部（定番UIキット）の合計。 */
export const TOTAL_ALL_QUESTIONS = TOTAL_QUESTIONS + TOTAL_KIT_QUESTIONS;

/**
 * 1問あたりの目安の秒数。
 *
 * 第1部（2つ見比べて選ぶ）と第2部（動きを見てから選ぶ）をならした値。
 * 実際に通して測ったら、この数字だけを直せばトップの表示が変わる。
 */
export const SECONDS_PER_QUESTION = 12;

/** 所要時間（分）。切り上げ。最低でも1分と出す。 */
export function estimatedMinutes(): number {
  const seconds = TOTAL_ALL_QUESTIONS * SECONDS_PER_QUESTION;
  return Math.max(1, Math.ceil(seconds / 60));
}
