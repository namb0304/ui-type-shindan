import { describe, expect, it } from 'vitest';

import { AXES, AXIS_IDS, QUESTIONS_PER_AXIS } from '../data/axes';
import { QUESTIONS, TOTAL_QUESTIONS } from '../data/questions';
import type { Answers, AxisId, AxisSide, RightCounts } from '../data/types';
import {
  calcResult,
  countRightAnswers,
  isRightCount,
  resultFromCounts,
  toAxisScores,
  toPercent,
  toRightRatio,
  toTypeCode,
} from './score';

/** 全問同じ側を選んだ回答を作る。 */
function answerAll(side: AxisSide): Answers {
  return Object.fromEntries(QUESTIONS.map((question) => [question.id, side]));
}

/** 軸ごとに「右側を選ぶ数」を指定して回答を作る。 */
function answersWithRightCounts(counts: RightCounts): Answers {
  const remaining: Record<AxisId, number> = { ...counts };
  return Object.fromEntries(
    QUESTIONS.map((question) => {
      const side: AxisSide = remaining[question.axis] > 0 ? 'right' : 'left';
      if (side === 'right') {
        remaining[question.axis] -= 1;
      }
      return [question.id, side];
    }),
  );
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

describe('countRightAnswers（回答 → 軸ごとのrightCount）', () => {
  it('全問左なら全軸0', () => {
    expect(countRightAnswers(answerAll('left'))).toEqual({
      density: 0,
      decoration: 0,
      tone: 0,
      font: 0,
    });
  });

  it('全問右なら全軸3', () => {
    expect(countRightAnswers(answerAll('right'))).toEqual({
      density: 3,
      decoration: 3,
      tone: 3,
      font: 3,
    });
  });

  it('軸ごとに正しく数える', () => {
    const counts: RightCounts = { density: 2, decoration: 3, tone: 0, font: 1 };
    expect(countRightAnswers(answersWithRightCounts(counts))).toEqual(counts);
  });

  it('未回答があればエラーになり、不足している問題IDを示す', () => {
    const answers = answerAll('left');
    delete answers.q3;
    delete answers.q7;
    expect(() => countRightAnswers(answers)).toThrow(/q3, q7/);
  });
});

describe('toAxisScores（rightCount → 割合）', () => {
  it.each([
    [0, 0, 0],
    [1, 1 / 3, 33],
    [2, 2 / 3, 67],
    [3, 1, 100],
  ] as const)('rightCount %i → 割合 %f → 表示 %i パーセント', (rightCount, ratio, percent) => {
    const counts = {
      density: rightCount,
      decoration: rightCount,
      tone: rightCount,
      font: rightCount,
    } as RightCounts;

    for (const score of toAxisScores(counts)) {
      expect(score.rightCount).toBe(rightCount);
      expect(score.rightRatio).toBeCloseTo(ratio, 10);
      expect(toPercent(score.rightRatio)).toBe(percent);
    }
  });

  it('軸の並び順はタイプコードの順（情報量 → 装飾 → トーン → 文字）', () => {
    const scores = toAxisScores({ density: 0, decoration: 1, tone: 2, font: 3 });
    expect(scores.map((score) => score.axis)).toEqual([
      'density',
      'decoration',
      'tone',
      'font',
    ]);
    expect(scores.map((score) => score.rightCount)).toEqual([0, 1, 2, 3]);
  });

  it('0〜3以外の値はエラーになる', () => {
    expect(() => toAxisScores({ density: 4, decoration: 0, tone: 0, font: 0 } as unknown as RightCounts)).toThrow();
  });
});

describe('toTypeCode（rightCount → タイプコード）', () => {
  it('全軸0なら DFCG', () => {
    expect(toTypeCode({ density: 0, decoration: 0, tone: 0, font: 0 })).toBe('DFCG');
  });

  it('全軸3なら ARPM', () => {
    expect(toTypeCode({ density: 3, decoration: 3, tone: 3, font: 3 })).toBe('ARPM');
  });

  it('n >= 2 で右側の文字、n <= 1 で左側の文字になる', () => {
    // 1 → 左側、2 → 右側 の境界
    expect(toTypeCode({ density: 1, decoration: 1, tone: 1, font: 1 })).toBe('DFCG');
    expect(toTypeCode({ density: 2, decoration: 2, tone: 2, font: 2 })).toBe('ARPM');
  });

  it('軸ごとに左右が混ざった場合も1文字ずつ決まる', () => {
    // 情報量=右(A) / 装飾=右(R) / トーン=左(C) / 文字=左(G)
    expect(toTypeCode({ density: 2, decoration: 3, tone: 1, font: 0 })).toBe('ARCG');
    expect(toTypeCode({ density: 0, decoration: 3, tone: 0, font: 3 })).toBe('DRCM');
  });

  it('全16タイプが一意に作られる', () => {
    const codes = new Set<string>();
    for (const density of [0, 3] as const) {
      for (const decoration of [0, 3] as const) {
        for (const tone of [0, 3] as const) {
          for (const font of [0, 3] as const) {
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
    expect(result.counts).toEqual({ density: 0, decoration: 0, tone: 0, font: 0 });
    for (const score of result.scores) {
      expect(toPercent(score.rightRatio)).toBe(0);
    }
  });

  it('全問右なら ARPM で、全軸の右側の割合が100%', () => {
    const result = calcResult(answerAll('right'));
    expect(result.code).toBe('ARPM');
    expect(result.counts).toEqual({ density: 3, decoration: 3, tone: 3, font: 3 });
    for (const score of result.scores) {
      expect(toPercent(score.rightRatio)).toBe(100);
    }
  });

  it('混在した回答から中間のタイプが出る', () => {
    const result = calcResult(answersWithRightCounts({ density: 2, decoration: 3, tone: 1, font: 0 }));
    expect(result.code).toBe('ARCG');
    expect(result.scores.map((score) => toPercent(score.rightRatio))).toEqual([67, 100, 33, 0]);
  });
});

describe('resultFromCounts（共有URL用の再利用）', () => {
  it('同じrightCountなら回答経由と同じ結果になる', () => {
    const counts: RightCounts = { density: 2, decoration: 3, tone: 0, font: 2 };
    expect(resultFromCounts(counts)).toEqual(calcResult(answersWithRightCounts(counts)));
  });

  it('0〜3の全組み合わせ（256通り）で回答経由と一致する', () => {
    for (const density of [0, 1, 2, 3] as const) {
      for (const decoration of [0, 1, 2, 3] as const) {
        for (const tone of [0, 1, 2, 3] as const) {
          for (const font of [0, 1, 2, 3] as const) {
            const counts: RightCounts = { density, decoration, tone, font };
            expect(resultFromCounts(counts)).toEqual(calcResult(answersWithRightCounts(counts)));
          }
        }
      }
    }
  });
});

describe('補助関数', () => {
  it('isRightCount は0〜3の整数だけを通す', () => {
    for (const value of [0, 1, 2, 3]) {
      expect(isRightCount(value)).toBe(true);
    }
    for (const value of [-1, 4, 1.5, '2', null, undefined, NaN]) {
      expect(isRightCount(value)).toBe(false);
    }
  });

  it('toRightRatio は rightCount を3で割る', () => {
    expect(toRightRatio(0)).toBe(0);
    expect(toRightRatio(3)).toBe(1);
    expect(toRightRatio(1)).toBeCloseTo(1 / 3, 10);
  });

  it('軸の定義が左右の文字を正しく持っている', () => {
    expect(AXES.map((axis) => axis.left.letter).join('')).toBe('DFCG');
    expect(AXES.map((axis) => axis.right.letter).join('')).toBe('ARPM');
  });
});
