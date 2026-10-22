import { AXES } from '../data/axes';
import { getSummaryPart } from '../data/traits';
import type { AxisScore } from '../data/types';
import { sideOf } from './score';

/**
 * タイプの説明文（結果ページで大きく出す1文）。
 *
 * 4軸の結果をつないで作る。例：
 *   情報はぎっしり、飾りはシンプル、色は元気に、文字はすっきり。
 *
 * 画面に依存しない純粋な関数。
 */
export function buildTypeSummary(scores: readonly AxisScore[]): string {
  const parts = AXES.map((axis) => {
    const score = scores.find((candidate) => candidate.axis === axis.id);
    if (!score) {
      throw new Error(`軸 ${axis.id} のスコアがありません`);
    }
    return getSummaryPart(axis.id, sideOf(score));
  });

  return `${parts.join('、')}。`;
}
