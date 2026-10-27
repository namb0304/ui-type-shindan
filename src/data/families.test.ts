import { describe, expect, it } from 'vitest';

import { AXES } from './axes';
import { tagsOfType, TYPE_FAMILIES, typesOfFamily } from './families';
import { TYPE_INFOS } from './typeInfos';

describe('4つの系統（情報量 × トーン）', () => {
  it('4つある', () => {
    expect(TYPE_FAMILIES).toHaveLength(4);
  });

  it('16タイプが、どこか1つの系統にちょうど1回ずつ入る', () => {
    const codes = TYPE_FAMILIES.flatMap((family) =>
      typesOfFamily(family).map((info) => info.code),
    );
    expect(codes).toHaveLength(TYPE_INFOS.length);
    expect(new Set(codes).size).toBe(TYPE_INFOS.length);
  });

  it('どの系統も4タイプずつ', () => {
    for (const family of TYPE_FAMILIES) {
      expect(typesOfFamily(family), family.name).toHaveLength(4);
    }
  });

  it('系統の組み合わせが重複していない', () => {
    const keys = TYPE_FAMILIES.map((family) => family.density + family.tone);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('使っている文字は、情報量とトーンの軸にあるものだけ', () => {
    const density = [AXES[0].left.letter, AXES[0].right.letter];
    const tone = [AXES[2].left.letter, AXES[2].right.letter];
    for (const family of TYPE_FAMILIES) {
      expect(density, family.name).toContain(family.density);
      expect(tone, family.name).toContain(family.tone);
    }
  });

  it('名前と一言が空でない', () => {
    for (const family of TYPE_FAMILIES) {
      expect(family.name.length).toBeGreaterThan(0);
      expect(family.note.length).toBeGreaterThan(0);
    }
  });

  /**
   * 系統の色は白地の上に出す。読めない色を入れてしまう事故を止める。
   * 面は塗らないので、見るのは文字色としてのコントラストだけ。
   */
  it('系統の色が、白地で 4.5:1 以上ある', () => {
    for (const family of TYPE_FAMILIES) {
      expect(contrastOnWhite(family.color), `${family.name} ${family.color}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });
});

describe('カードに添えるタグ', () => {
  it('残りの2軸（装飾・見出し）の2つが出る', () => {
    for (const info of TYPE_INFOS) {
      const tags = tagsOfType(info.code);
      expect(tags, info.code).toHaveLength(2);
      expect(tags[0], info.code).toContain(AXES[1].label);
      expect(tags[1], info.code).toContain(AXES[3].label);
    }
  });

  it('軸の定義から組み立てている（画面にベタ書きしていない）', () => {
    // DRCM = 装飾がリッチ（R）、見出しが明朝（M）
    expect(tagsOfType('DRCM')).toEqual([
      `${AXES[1].label}：${AXES[1].right.shortName}`,
      `${AXES[3].label}：${AXES[3].right.shortName}`,
    ]);
    // DFCG = 装飾がフラット（F）、見出しがゴシック（G）
    expect(tagsOfType('DFCG')).toEqual([
      `${AXES[1].label}：${AXES[1].left.shortName}`,
      `${AXES[3].label}：${AXES[3].left.shortName}`,
    ]);
  });

  it('知らない文字が来たらエラーにする（打ち間違い対策）', () => {
    expect(() => tagsOfType('DXCG')).toThrow();
  });
});

/** 白（#FFFFFF）に対するコントラスト比。 */
function contrastOnWhite(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return (1 + 0.05) / (luminance + 0.05);
}
