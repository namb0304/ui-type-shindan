import { AXES, SIDE_THRESHOLD } from '../data/axes';
import type { AxisScore } from '../data/types';

/**
 * お店の相性（要件定義書 §5）。
 *
 * 画面に依存しない純粋な関数。
 */

export interface Affinity {
  /** 気が合うお店：いちばん迷った軸だけを反転したタイプ */
  match: string;
  /** たぶん落ち着かないお店：4文字すべてを反転したタイプ */
  clash: string;
  /** 気が合うお店を決めるのに使った軸（画面で説明に使う） */
  flippedAxis: AxisScore['axis'];
}

/** その軸の文字を、反対側の文字に変える。 */
function flipLetterAt(code: string, index: number): string {
  const axis = AXES[index];
  const letter = code[index];
  const flipped = letter === axis.left.letter ? axis.right.letter : axis.left.letter;
  return code.slice(0, index) + flipped + code.slice(index + 1);
}

/** 4文字すべてを反対側に変える。 */
export function flipAll(code: string): string {
  return AXES.reduce((current, _axis, index) => flipLetterAt(current, index), code);
}

/**
 * 相性を求める。
 *
 * 気が合うお店は「いちばん迷った軸」＝割合が50%に最も近い軸を1つだけ反転する。
 * わずかな差で決まった軸なので、反対側のお店も気に入る可能性が高い、という考え方。
 * 同じ近さの軸が複数あるときは、軸の順（情報量 → 装飾 → トーン → 文字）で先のものを選ぶ。
 */
export function calcAffinity(code: string, scores: readonly AxisScore[]): Affinity {
  let closestIndex = 0;
  let smallestDistance = Number.POSITIVE_INFINITY;

  AXES.forEach((axis, index) => {
    const score = scores.find((candidate) => candidate.axis === axis.id);
    if (!score) {
      throw new Error(`軸 ${axis.id} のスコアがありません`);
    }
    const distance = Math.abs(score.rightRatio - SIDE_THRESHOLD);
    // 同じ近さなら先の軸を優先するので、より小さいときだけ更新する
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestIndex = index;
    }
  });

  return {
    match: flipLetterAt(code, closestIndex),
    clash: flipAll(code),
    flippedAxis: AXES[closestIndex].id,
  };
}
