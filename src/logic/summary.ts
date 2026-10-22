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
  return buildTypeSummaryParts(scores).join('');
}

/**
 * 説明文を、区切りごとのまとまりに分けて返す。
 *
 * 画面では、この1つずつを折り返さない単位として扱う。
 * 「色は落ち着い／て」のように言葉の途中で改行されるのを防ぐため。
 * 句読点は前のまとまりに含める（行頭に「、」が来ないようにする）。
 */
export function buildTypeSummaryParts(scores: readonly AxisScore[]): string[] {
  const parts = AXES.map((axis) => {
    const score = scores.find((candidate) => candidate.axis === axis.id);
    if (!score) {
      throw new Error(`軸 ${axis.id} のスコアがありません`);
    }
    return getSummaryPart(axis.id, sideOf(score));
  });

  return parts.map((part, index) => `${part}${index === parts.length - 1 ? '。' : '、'}`);
}
