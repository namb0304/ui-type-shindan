import { describe, expect, it } from 'vitest';

import { AXES, AXIS_IDS } from '../data/axes';
import { TYPE_INFOS } from '../data/typeInfos';
import type { RightPoints } from '../data/types';
import { calcAffinity, flipAll } from './affinity';
import { pointsFromCode, resultFromPoints } from './score';

/** 点数から結果と相性をまとめて作る。 */
function affinityOf(points: RightPoints) {
  const result = resultFromPoints(points);
  return { result, affinity: calcAffinity(result.code, result.scores) };
}

describe('flipAll', () => {
  it('4文字すべてが反対側になる', () => {
    expect(flipAll('DFCG')).toBe('ARPM');
    expect(flipAll('ARPM')).toBe('DFCG');
    expect(flipAll('ARCM')).toBe('DFPG');
  });

  it('2回かけると元に戻る', () => {
    for (const info of TYPE_INFOS) {
      expect(flipAll(flipAll(info.code))).toBe(info.code);
    }
  });

  it('16タイプすべてで、反転先も実在するタイプ', () => {
    const codes = new Set(TYPE_INFOS.map((info) => info.code));
    for (const info of TYPE_INFOS) {
      expect(codes, info.code).toContain(flipAll(info.code));
    }
  });
});

describe('calcAffinity', () => {
  it('気が合う場所は1文字だけ違う', () => {
    for (const info of TYPE_INFOS) {
      const { affinity } = affinityOf(pointsFromCode(info.code));
      const differences = [...info.code].filter(
        (letter, index) => letter !== affinity.match[index],
      );
      expect(differences, info.code).toHaveLength(1);
    }
  });

  it('落ち着かない場所は4文字すべて違う', () => {
    for (const info of TYPE_INFOS) {
      const { affinity } = affinityOf(pointsFromCode(info.code));
      const same = [...info.code].filter((letter, index) => letter === affinity.clash[index]);
      expect(same, info.code).toHaveLength(0);
    }
  });

  it('いちばん50%に近い軸が反転される', () => {
    // 情報量100% / 装飾67% / トーン0% / 文字100% → いちばん迷ったのは装飾
    const { result, affinity } = affinityOf({ density: 6, decoration: 4, tone: 0, font: 6 });
    expect(result.code).toBe('ARCM');
    expect(affinity.flippedAxis).toBe('decoration');
    expect(affinity.match).toBe('AFCM');
  });

  it('同じ近さなら軸の順（情報量 → 装飾 → トーン → 文字）で先のものを選ぶ', () => {
    // 情報量とトーンが同じ17%差 → 先の情報量を選ぶ
    const { result, affinity } = affinityOf({ density: 4, decoration: 6, tone: 2, font: 6 });
    expect(result.code).toBe('ARCM');
    expect(affinity.flippedAxis).toBe('density');
    expect(affinity.match).toBe('DRCM');
  });

  it('全軸が同じ割合なら、いちばん先の軸が選ばれる', () => {
    const { affinity } = affinityOf({ density: 6, decoration: 6, tone: 6, font: 6 });
    expect(affinity.flippedAxis).toBe(AXIS_IDS[0]);
    expect(affinity.match).toBe('DRPM');
  });

  it('全軸ちょうど50%でも結果が出る（全軸が同じ近さ）', () => {
    const { result, affinity } = affinityOf({ density: 3, decoration: 3, tone: 3, font: 3 });
    expect(result.code).toBe('DFCG');
    expect(affinity.flippedAxis).toBe('density');
    expect(affinity.match).toBe('AFCG');
    expect(affinity.clash).toBe('ARPM');
  });

  it('反転した文字は、その軸の反対側の文字になっている', () => {
    for (const info of TYPE_INFOS) {
      const { affinity } = affinityOf(pointsFromCode(info.code));
      const index = AXIS_IDS.indexOf(affinity.flippedAxis);
      const axis = AXES[index];
      const before = info.code[index];
      const after = affinity.match[index];
      expect([before, after].sort(), info.code).toEqual(
        [axis.left.letter, axis.right.letter].sort(),
      );
    }
  });

  it('スコアが足りなければエラーになる', () => {
    const result = resultFromPoints({ density: 0, decoration: 0, tone: 0, font: 0 });
    expect(() => calcAffinity(result.code, result.scores.slice(0, 2))).toThrow();
  });
});
