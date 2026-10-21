import { describe, expect, it } from 'vitest';

import { AXES, AXIS_IDS, MAX_POINTS, QUESTIONS_PER_AXIS, SIDE_THRESHOLD } from '../data/axes';
import { QUESTIONS, TOTAL_QUESTIONS } from '../data/questions';
import { PRESET_THRESHOLD } from '../data/tokens';
import type { AnswerValue, Answers, AxisId, AxisPoints, RightPoints } from '../data/types';
import {
  calcResult,
  countRightPoints,
  isAxisPoints,
  isRightSide,
  resultFromPoints,
  toAxisScores,
  toPercent,
  toRightRatio,
  toTypeCode,
} from './score';

const ALL_POINTS = [0, 1, 2, 3, 4, 5, 6] as const;

/** 全問同じ回答にする。 */
function answerAll(value: AnswerValue): Answers {
  return Object.fromEntries(QUESTIONS.map((question) => [question.id, value]));
}

/** 軸ごとに点数を指定して回答を作る（0〜6）。 */
function answersWithPoints(points: RightPoints): Answers {
  const remaining: Record<AxisId, number> = { ...points };
  return Object.fromEntries(
    QUESTIONS.map((question) => {
      const left = remaining[question.axis];
      // 残り点数を、1問あたり最大2点で割り当てていく
      let value: AnswerValue = 'left';
      if (left >= 2) {
        value = 'right';
        remaining[question.axis] -= 2;
      } else if (left === 1) {
        value = 'either';
        remaining[question.axis] -= 1;
      }
      return [question.id, value];
    }),
  );
}

/** 全点数の組み合わせ（7^4 = 2401通り）。 */
function allPointCombinations(): RightPoints[] {
  const list: RightPoints[] = [];
  for (const density of ALL_POINTS) {
    for (const decoration of ALL_POINTS) {
      for (const tone of ALL_POINTS) {
        for (const font of ALL_POINTS) {
          list.push({ density, decoration, tone, font });
        }
      }
    }
  }
  return list;
}

describe('質問データ', () => {
  it('12問ある', () => {
    expect(TOTAL_QUESTIONS).toBe(12);
  });

  it('各軸が3問ずつある', () => {
    for (const axis of AXIS_IDS) {
      expect(QUESTIONS.filter((question) => question.axis === axis)).toHaveLength(
        QUESTIONS_PER_AXIS,
      );
    }
  });

  it('同じ軸の問題が連続しない', () => {
    for (let i = 1; i < QUESTIONS.length; i += 1) {
      expect(QUESTIONS[i].axis).not.toBe(QUESTIONS[i - 1].axis);
    }
  });

  it('IDと題材が重複していない', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(TOTAL_QUESTIONS);
    expect(new Set(QUESTIONS.map((q) => q.subject)).size).toBe(TOTAL_QUESTIONS);
  });
});

describe('countRightPoints（回答 → 軸ごとの点数）', () => {
  it('全問左なら全軸0', () => {
    expect(countRightPoints(answerAll('left'))).toEqual({
      density: 0,
      decoration: 0,
      tone: 0,
      font: 0,
    });
  });

  it('全問右なら全軸6（満点）', () => {
    expect(countRightPoints(answerAll('right'))).toEqual({
      density: MAX_POINTS,
      decoration: MAX_POINTS,
      tone: MAX_POINTS,
      font: MAX_POINTS,
    });
  });

  it('全問「どっちも同じ」なら全軸3（ちょうど半分）', () => {
    expect(countRightPoints(answerAll('either'))).toEqual({
      density: 3,
      decoration: 3,
      tone: 3,
      font: 3,
    });
  });

  it('左・どちらでもない・右 が混ざっても正しく数える', () => {
    const points: RightPoints = { density: 5, decoration: 6, tone: 0, font: 1 };
    expect(countRightPoints(answersWithPoints(points))).toEqual(points);
  });

  it('未回答があればエラーになり、不足している問題IDを示す', () => {
    const answers = answerAll('left');
    delete answers.q3;
    delete answers.q7;
    expect(() => countRightPoints(answers)).toThrow(/q3, q7/);
  });

  it('知らない回答値はエラーになる', () => {
    const answers = { ...answerAll('left'), q1: 'maybe' } as unknown as Answers;
    expect(() => countRightPoints(answers)).toThrow(/q1/);
  });
});

describe('toAxisScores（点数 → 割合）', () => {
  it.each([
    [0, 0],
    [1, 17],
    [2, 33],
    [3, 50],
    [4, 67],
    [5, 83],
    [6, 100],
  ] as const)('点数 %i → 右側 %i パーセント', (rightPoints, percent) => {
    const points = {
      density: rightPoints,
      decoration: rightPoints,
      tone: rightPoints,
      font: rightPoints,
    } as RightPoints;

    for (const score of toAxisScores(points)) {
      expect(score.rightPoints).toBe(rightPoints);
      expect(score.rightRatio).toBeCloseTo(rightPoints / MAX_POINTS, 10);
      expect(toPercent(score.rightRatio)).toBe(percent);
    }
  });

  it('軸の並び順はタイプコードの順（情報量 → 装飾 → トーン → 文字）', () => {
    const scores = toAxisScores({ density: 0, decoration: 2, tone: 4, font: 6 });
    expect(scores.map((score) => score.axis)).toEqual(['density', 'decoration', 'tone', 'font']);
    expect(scores.map((score) => score.rightPoints)).toEqual([0, 2, 4, 6]);
  });

  it('0〜6以外の値はエラーになる', () => {
    for (const bad of [7, -1, 2.5]) {
      const points = { density: bad, decoration: 0, tone: 0, font: 0 } as unknown as RightPoints;
      expect(() => toAxisScores(points), String(bad)).toThrow();
    }
  });
});

describe('toTypeCode（点数 → タイプコード）', () => {
  it('全軸0なら DFCG', () => {
    expect(toTypeCode({ density: 0, decoration: 0, tone: 0, font: 0 })).toBe('DFCG');
  });

  it('全軸6なら ARPM', () => {
    expect(toTypeCode({ density: 6, decoration: 6, tone: 6, font: 6 })).toBe('ARPM');
  });

  it('ちょうど50%（3点）は左側の文字になる', () => {
    expect(toTypeCode({ density: 3, decoration: 3, tone: 3, font: 3 })).toBe('DFCG');
  });

  it('50%を超えた時点（4点）で右側の文字に変わる', () => {
    expect(toTypeCode({ density: 3, decoration: 3, tone: 3, font: 4 })).toBe('DFCM');
    expect(toTypeCode({ density: 4, decoration: 4, tone: 4, font: 4 })).toBe('ARPM');
  });

  it('軸ごとに左右が混ざった場合も1文字ずつ決まる', () => {
    expect(toTypeCode({ density: 4, decoration: 6, tone: 2, font: 0 })).toBe('ARCG');
    expect(toTypeCode({ density: 0, decoration: 5, tone: 1, font: 6 })).toBe('DRCM');
  });

  it('全16タイプが一意に作られる', () => {
    const codes = new Set<string>();
    for (const density of [0, 6] as const) {
      for (const decoration of [0, 6] as const) {
        for (const tone of [0, 6] as const) {
          for (const font of [0, 6] as const) {
            codes.add(toTypeCode({ density, decoration, tone, font }));
          }
        }
      }
    }
    expect(codes.size).toBe(16);
    for (const code of codes) {
      expect(code).toMatch(/^[DA][FR][CP][GM]$/);
    }
  });
});

describe('calcResult（回答 → 結果）', () => {
  it('全問左なら DFCG で、全軸の右側の割合が0%', () => {
    const result = calcResult(answerAll('left'));
    expect(result.code).toBe('DFCG');
    expect(result.points).toEqual({ density: 0, decoration: 0, tone: 0, font: 0 });
    for (const score of result.scores) {
      expect(toPercent(score.rightRatio)).toBe(0);
    }
  });

  it('全問右なら ARPM で、全軸の右側の割合が100%', () => {
    const result = calcResult(answerAll('right'));
    expect(result.code).toBe('ARPM');
    for (const score of result.scores) {
      expect(toPercent(score.rightRatio)).toBe(100);
    }
  });

  it('全問「どっちも同じ」なら DFCG で、全軸がちょうど50%', () => {
    const result = calcResult(answerAll('either'));
    expect(result.code).toBe('DFCG');
    for (const score of result.scores) {
      expect(toPercent(score.rightRatio)).toBe(50);
    }
  });

  it('「どっちも同じ」は左右のちょうど中間として効く', () => {
    // 文字軸（q4・q8・q12）だけ 右・右・どちらでもない → 5点 = 83%
    const answers = answerAll('left');
    answers.q4 = 'right';
    answers.q8 = 'right';
    answers.q12 = 'either';

    const result = calcResult(answers);
    expect(result.points.font).toBe(5);
    expect(toPercent(result.scores[3].rightRatio)).toBe(83);
    expect(result.code).toBe('DFCM');
  });

  it('混在した回答から中間のタイプが出る', () => {
    const result = calcResult(answersWithPoints({ density: 4, decoration: 6, tone: 2, font: 0 }));
    expect(result.code).toBe('ARCG');
    expect(result.scores.map((score) => toPercent(score.rightRatio))).toEqual([67, 100, 33, 0]);
  });
});

describe('resultFromPoints（共有URL用の再利用）', () => {
  it('同じ点数なら回答経由と同じ結果になる', () => {
    const points: RightPoints = { density: 4, decoration: 6, tone: 0, font: 3 };
    expect(resultFromPoints(points)).toEqual(calcResult(answersWithPoints(points)));
  });

  it('0〜6の全組み合わせ（7^4 = 2401通り）で回答経由と一致する', () => {
    const combinations = allPointCombinations();
    expect(combinations).toHaveLength(2401);

    for (const points of combinations) {
      expect(resultFromPoints(points), JSON.stringify(points)).toEqual(
        calcResult(answersWithPoints(points)),
      );
    }
  });

  it('共有URLの4桁に相当する値はすべて0〜6', () => {
    for (const points of allPointCombinations()) {
      const digits = AXIS_IDS.map((axis) => points[axis]);
      expect(digits.join('')).toMatch(/^[0-6]{4}$/);
    }
  });
});

describe('左右の判定の境界', () => {
  it('タイプコードとテーマのプリセットが同じ境界を使っている', () => {
    expect(PRESET_THRESHOLD).toBe(SIDE_THRESHOLD);
  });

  it('ちょうど境界なら左側、超えたら右側', () => {
    expect(isRightSide(SIDE_THRESHOLD)).toBe(false);
    expect(isRightSide(SIDE_THRESHOLD + 0.0001)).toBe(true);
    expect(isRightSide(SIDE_THRESHOLD - 0.0001)).toBe(false);
  });

  it('点数3（50%）だけが境界ちょうどになる', () => {
    for (const points of ALL_POINTS) {
      const ratio = toRightRatio(points as AxisPoints);
      expect(ratio === SIDE_THRESHOLD, `点数 ${points}`).toBe(points === 3);
    }
  });
});

describe('補助関数', () => {
  it('isAxisPoints は0〜6の整数だけを通す', () => {
    for (const value of ALL_POINTS) {
      expect(isAxisPoints(value)).toBe(true);
    }
    for (const value of [-1, 7, 1.5, '2', null, undefined, NaN]) {
      expect(isAxisPoints(value), String(value)).toBe(false);
    }
  });

  it('toRightRatio は点数を6で割る', () => {
    expect(toRightRatio(0)).toBe(0);
    expect(toRightRatio(3)).toBe(0.5);
    expect(toRightRatio(6)).toBe(1);
  });

  it('軸の定義が左右の文字を正しく持っている', () => {
    expect(AXES.map((axis) => axis.left.letter).join('')).toBe('DFCG');
    expect(AXES.map((axis) => axis.right.letter).join('')).toBe('ARPM');
  });
});
