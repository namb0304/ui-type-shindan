import { AXES, AXIS_IDS, QUESTIONS_PER_AXIS } from '../data/axes';
import { QUESTIONS } from '../data/questions';
import type {
  Answers,
  AxisId,
  AxisScore,
  DiagnosisResult,
  Question,
  RightCount,
  RightCounts,
} from '../data/types';

/**
 * 判定ロジック（要件定義書 §4）。
 * 画面には依存しない純粋な関数だけを置く。
 *
 * 処理は2段に分かれている。
 *   1. 回答 → 軸ごとの rightCount          … countRightAnswers()
 *   2. rightCount → 割合・タイプコード・結果 … toAxisScores() / toTypeCode() / resultFromCounts()
 *
 * 共有URL（?r=2302）から結果を復元するときは 1 を飛ばして 2 から始める。
 */

/** 0〜3の整数か（共有URLなど外部から来た値のチェック用）。 */
export function isRightCount(value: unknown): value is RightCount {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/**
 * 回答から、軸ごとの「右側を選んだ数」を数える。
 * 1問でも未回答があればエラーにする（中途半端なタイプコードを返さないため）。
 */
export function countRightAnswers(
  answers: Answers,
  questions: readonly Question[] = QUESTIONS,
): RightCounts {
  const missing = questions.filter((question) => answers[question.id] === undefined);
  if (missing.length > 0) {
    throw new Error(`未回答の問題があります: ${missing.map((q) => q.id).join(', ')}`);
  }

  const counts = Object.fromEntries(AXIS_IDS.map((axis) => [axis, 0])) as Record<AxisId, number>;

  for (const question of questions) {
    if (answers[question.id] === 'right') {
      counts[question.axis] += 1;
    }
  }

  for (const axis of AXIS_IDS) {
    if (!isRightCount(counts[axis])) {
      throw new Error(`軸 ${axis} の回答数が0〜3の範囲外です: ${counts[axis]}`);
    }
  }

  return counts as RightCounts;
}

/** rightCount から割合（0〜1）を求める。 */
export function toRightRatio(rightCount: RightCount): number {
  return rightCount / QUESTIONS_PER_AXIS;
}

/** 割合（0〜1）を表示用のパーセント（0 / 33 / 67 / 100）にする。 */
export function toPercent(ratio: number): number {
  return Math.round(ratio * 100);
}

/** rightCount から各軸のスコアを作る。並び順は軸の順（タイプコードの順）。 */
export function toAxisScores(counts: RightCounts): AxisScore[] {
  return AXIS_IDS.map((axis) => {
    const rightCount = counts[axis];
    if (!isRightCount(rightCount)) {
      throw new Error(`軸 ${axis} の値が0〜3ではありません: ${rightCount}`);
    }
    return { axis, rightCount, rightRatio: toRightRatio(rightCount) };
  });
}

/**
 * rightCount からタイプコードを作る。
 * n >= 2 なら右側の文字、それ以外は左側の文字を使う。
 */
export function toTypeCode(counts: RightCounts): string {
  return AXES.map((axis) => {
    const rightCount = counts[axis.id];
    if (!isRightCount(rightCount)) {
      throw new Error(`軸 ${axis.id} の値が0〜3ではありません: ${rightCount}`);
    }
    return rightCount >= 2 ? axis.right.letter : axis.left.letter;
  }).join('');
}

/** rightCount から結果をまとめて作る（共有URLからの復元でも使う）。 */
export function resultFromCounts(counts: RightCounts): DiagnosisResult {
  return {
    code: toTypeCode(counts),
    counts,
    scores: toAxisScores(counts),
  };
}

/** 回答から結果をまとめて作る。 */
export function calcResult(
  answers: Answers,
  questions: readonly Question[] = QUESTIONS,
): DiagnosisResult {
  return resultFromCounts(countRightAnswers(answers, questions));
}
