import { describe, expect, it } from 'vitest';

import { AXES } from '../data/axes';
import { getSummaryPart, SUMMARY_PARTS } from '../data/traits';
import type { RightPoints } from '../data/types';
import { resultFromPoints } from './score';
import { buildTypeSummary, buildTypeSummaryParts } from './summary';

function summaryOf(points: RightPoints): string {
  return buildTypeSummary(resultFromPoints(points).scores);
}

describe('タイプの説明文', () => {
  it('全問左なら、左側の言い回しが並ぶ', () => {
    expect(summaryOf({ density: 0, decoration: 0, tone: 0, font: 0 })).toBe(
      '情報はぎっしり、飾りはシンプル、色は落ち着いて、見出しはすっきり。',
    );
  });

  it('全問右なら、右側の言い回しが並ぶ', () => {
    expect(summaryOf({ density: 6, decoration: 6, tone: 6, font: 6 })).toBe(
      '情報はゆったり、飾りは贅沢に、色は元気に、見出しは上品に。',
    );
  });

  it('ちょうど50%の軸は「どちらでも」になる', () => {
    expect(summaryOf({ density: 3, decoration: 3, tone: 3, font: 3 })).toBe(
      '情報量はどちらでも、飾りはどちらでも、色はどちらでも、見出しはどちらでも。',
    );
  });

  it('軸ごとに混ざってもつながる', () => {
    expect(summaryOf({ density: 0, decoration: 0, tone: 6, font: 0 })).toBe(
      '情報はぎっしり、飾りはシンプル、色は元気に、見出しはすっきり。',
    );
  });

  it('軸の順（情報量 → 装飾 → トーン → 見出し）で並ぶ', () => {
    const summary = summaryOf({ density: 6, decoration: 0, tone: 6, font: 0 });
    const parts = summary.replace('。', '').split('、');
    expect(parts).toHaveLength(AXES.length);
    expect(parts[0]).toContain('情報');
    expect(parts[1]).toContain('飾り');
    expect(parts[2]).toContain('色');
    expect(parts[3]).toContain('見出し');
  });

  it('句点で終わり、空の部分が混ざらない', () => {
    for (const points of [0, 1, 2, 3, 4, 5, 6] as const) {
      const summary = summaryOf({
        density: points,
        decoration: points,
        tone: points,
        font: points,
      });
      expect(summary.endsWith('。'), String(points)).toBe(true);
      expect(summary, String(points)).not.toContain('、、');
      expect(summary, String(points)).not.toContain('undefined');
    }
  });

  it('材料は4軸 × 3パターンの12個', () => {
    expect(SUMMARY_PARTS).toHaveLength(12);
    for (const axis of AXES) {
      for (const side of ['left', 'right', 'even'] as const) {
        expect(getSummaryPart(axis.id, side).length, `${axis.id}/${side}`).toBeGreaterThan(3);
      }
    }
  });

  it('スコアが足りなければエラーになる', () => {
    const scores = resultFromPoints({ density: 0, decoration: 0, tone: 0, font: 0 }).scores;
    expect(() => buildTypeSummary(scores.slice(0, 2))).toThrow();
  });
});

describe('説明文の区切り', () => {
  it('4つのまとまりに分かれ、句読点は前のまとまりに付く', () => {
    const scores = resultFromPoints({ density: 0, decoration: 0, tone: 0, font: 0 }).scores;
    expect(buildTypeSummaryParts(scores)).toEqual([
      '情報はぎっしり、',
      '飾りはシンプル、',
      '色は落ち着いて、',
      '見出しはすっきり。',
    ]);
  });

  it('つなげると1文になる', () => {
    for (const points of [0, 3, 6] as const) {
      const scores = resultFromPoints({
        density: points,
        decoration: points,
        tone: points,
        font: points,
      }).scores;
      expect(buildTypeSummaryParts(scores).join('')).toBe(buildTypeSummary(scores));
    }
  });

  it('まとまりの先頭に句読点が来ない', () => {
    const scores = resultFromPoints({ density: 6, decoration: 3, tone: 0, font: 6 }).scores;
    for (const part of buildTypeSummaryParts(scores)) {
      expect(part.startsWith('、'), part).toBe(false);
      expect(part.startsWith('。'), part).toBe(false);
    }
  });
});
