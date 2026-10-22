import { AXES, AXIS_IDS, MAX_POINTS, POINTS_PER_QUESTION, SIDE_THRESHOLD } from '../data/axes';
import { QUESTIONS } from '../data/questions';
import type {
  Answers,
  AnswerValue,
  AxisId,
  AxisLean,
  AxisPoints,
  AxisScore,
  DiagnosisResult,
  Question,
  RightPoints,
} from '../data/types';

/**
 * 判定ロジック（要件定義書 §4）。
 * 画面には依存しない純粋な関数だけを置く。
 *
 * 処理は2段に分かれている。
 *   1. 回答 → 軸ごとの点数            … countRightPoints()
 *   2. 点数 → 割合・タイプコード・結果 … toAxisScores() / toTypeCode() / resultFromPoints()
 *
 * 共有URL（?r=4026）から結果を復元するときは 1 を飛ばして 2 から始める。
 */

/** 1問の回答が右側に寄せる点数。小数を避けるため2倍した整数で持つ。 */
const ANSWER_POINTS: Record<AnswerValue, number> = {
  left: 0,
  either: POINTS_PER_QUESTION / 2,
  right: POINTS_PER_QUESTION,
};

/** 0〜6の整数か（共有URLなど外部から来た値のチェック用）。 */
export function isAxisPoints(value: unknown): value is AxisPoints {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_POINTS;
}

/**
 * 回答から、軸ごとの点数を数える。
 * 1問でも未回答があればエラーにする（中途半端なタイプコードを返さないため）。
 */
export function countRightPoints(
  answers: Answers,
  questions: readonly Question[] = QUESTIONS,
): RightPoints {
  const missing = questions.filter((question) => answers[question.id] === undefined);
  if (missing.length > 0) {
    throw new Error(`未回答の問題があります: ${missing.map((q) => q.id).join(', ')}`);
  }

  const points = Object.fromEntries(AXIS_IDS.map((axis) => [axis, 0])) as Record<AxisId, number>;

  for (const question of questions) {
    const value = answers[question.id];
    const added = ANSWER_POINTS[value];
    if (added === undefined) {
      throw new Error(`${question.id} の回答が不正です: ${String(value)}`);
    }
    points[question.axis] += added;
  }

  for (const axis of AXIS_IDS) {
    if (!isAxisPoints(points[axis])) {
      throw new Error(`軸 ${axis} の点数が0〜${MAX_POINTS}の範囲外です: ${points[axis]}`);
    }
  }

  return points as RightPoints;
}

/** 点数から右側の割合（0〜1）を求める。 */
export function toRightRatio(rightPoints: AxisPoints): number {
  return rightPoints / MAX_POINTS;
}

/** 割合（0〜1）を表示用のパーセント（0 / 17 / 33 / 50 / 67 / 83 / 100）にする。 */
export function toPercent(ratio: number): number {
  return Math.round(ratio * 100);
}

/**
 * 右側と判定するか。割合が境界「より大きい」なら右側。
 * ちょうど半分は左側。テーマのプリセット切り替えも同じ判定を使う（theme.ts）。
 */
export function isRightSide(ratio: number): boolean {
  return ratio > SIDE_THRESHOLD;
}

/**
 * その軸がどちらに寄っているか。ちょうど半分なら 'even'。
 * あるある・説明文・プロンプトの文章を出し分けるのに使う。
 */
export function sideOf(score: AxisScore): AxisLean {
  if (toPercent(score.rightRatio) === 50) return 'even';
  return isRightSide(score.rightRatio) ? 'right' : 'left';
}

/** 点数から各軸のスコアを作る。並び順は軸の順（タイプコードの順）。 */
export function toAxisScores(points: RightPoints): AxisScore[] {
  return AXIS_IDS.map((axis) => {
    const rightPoints = points[axis];
    if (!isAxisPoints(rightPoints)) {
      throw new Error(`軸 ${axis} の値が0〜${MAX_POINTS}ではありません: ${rightPoints}`);
    }
    return { axis, rightPoints, rightRatio: toRightRatio(rightPoints) };
  });
}

/** 点数からタイプコードを作る。 */
export function toTypeCode(points: RightPoints): string {
  return AXES.map((axis) => {
    const rightPoints = points[axis.id];
    if (!isAxisPoints(rightPoints)) {
      throw new Error(`軸 ${axis.id} の値が0〜${MAX_POINTS}ではありません: ${rightPoints}`);
    }
    return isRightSide(toRightRatio(rightPoints)) ? axis.right.letter : axis.left.letter;
  }).join('');
}

/** 点数から結果をまとめて作る（共有URLからの復元でも使う）。 */
export function resultFromPoints(points: RightPoints): DiagnosisResult {
  return {
    code: toTypeCode(points),
    points,
    scores: toAxisScores(points),
  };
}

/** 回答から結果をまとめて作る。 */
export function calcResult(
  answers: Answers,
  questions: readonly Question[] = QUESTIONS,
): DiagnosisResult {
  return resultFromPoints(countRightPoints(answers, questions));
}

/**
 * タイプコードから点数を作る（左側の文字なら0点、右側なら満点）。
 * 共有URLではなく、コードから結果ページを開きたいとき（?debug=1&type=ARCM）に使う。
 */
export function pointsFromCode(code: string): RightPoints {
  const letters = code.toUpperCase().split('');
  if (letters.length !== AXES.length) {
    throw new Error(`タイプコードは${AXES.length}文字です: ${code}`);
  }

  const entries = AXES.map((axis, index) => {
    const letter = letters[index];
    if (letter === axis.left.letter) return [axis.id, 0] as const;
    if (letter === axis.right.letter) return [axis.id, MAX_POINTS] as const;
    throw new Error(`${index + 1}文字目が不正です: ${letter}`);
  });

  return Object.fromEntries(entries) as RightPoints;
}

/** タイプコードとして正しい形式か。 */
export function isTypeCode(value: string): boolean {
  try {
    pointsFromCode(value);
    return true;
  } catch {
    return false;
  }
}
