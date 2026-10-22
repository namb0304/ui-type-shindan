import { describe, expect, it } from 'vitest';

import { AXES } from './axes';
import { getTrait, getPromptAdvice, PROMPT_ADVICE, TRAITS } from './traits';
import type { TraitSide } from './traits';
import { getTypeInfo, TYPE_INFOS } from './typeInfos';

const SIDES: readonly TraitSide[] = ['left', 'right', 'even'];

describe('16タイプの呼び名', () => {
  it('16タイプある', () => {
    expect(TYPE_INFOS).toHaveLength(16);
  });

  it('コードが重複していない', () => {
    expect(new Set(TYPE_INFOS.map((info) => info.code)).size).toBe(16);
  });

  it('4軸の全組み合わせが過不足なく揃っている', () => {
    const expected = new Set<string>();
    for (const density of [AXES[0].left.letter, AXES[0].right.letter]) {
      for (const decoration of [AXES[1].left.letter, AXES[1].right.letter]) {
        for (const tone of [AXES[2].left.letter, AXES[2].right.letter]) {
          for (const font of [AXES[3].left.letter, AXES[3].right.letter]) {
            expected.add(`${density}${decoration}${tone}${font}`);
          }
        }
      }
    }
    expect(new Set(TYPE_INFOS.map((info) => info.code))).toEqual(expected);
  });

  it('お店の名前とひとことが空でない', () => {
    for (const info of TYPE_INFOS) {
      expect(info.shop.length, info.code).toBeGreaterThan(0);
      expect(info.quip.length, info.code).toBeGreaterThan(0);
    }
  });

  it('お店の名前が重複していない', () => {
    expect(new Set(TYPE_INFOS.map((info) => info.shop)).size).toBe(16);
  });

  it('getTypeInfo で引ける。知らないコードはエラー', () => {
    expect(getTypeInfo('ARPM').shop).toBe('老舗旅館');
    expect(() => getTypeInfo('XXXX')).toThrow(/XXXX/);
  });
});

describe('UIあるあると、プロンプトの指示文', () => {
  it('4軸 × 3パターン（左・右・どちらでもない）が揃っている', () => {
    for (const list of [TRAITS, PROMPT_ADVICE]) {
      expect(list).toHaveLength(12);
      for (const axis of AXES) {
        for (const side of SIDES) {
          const found = list.filter((item) => item.axis === axis.id && item.side === side);
          expect(found, `${axis.id}/${side}`).toHaveLength(1);
        }
      }
    }
  });

  it('文章が空でなく、プレースホルダが残らない', () => {
    for (const axis of AXES) {
      for (const side of SIDES) {
        for (const text of [getTrait(axis.id, side), getPromptAdvice(axis.id, side)]) {
          expect(text.length, `${axis.id}/${side}`).toBeGreaterThan(5);
          expect(text, `${axis.id}/${side}`).not.toContain('{left}');
          expect(text, `${axis.id}/${side}`).not.toContain('{right}');
        }
      }
    }
  });

  it('プレースホルダは軸の表示名に置き換わる', () => {
    // 文字軸の右側は、プロンプトの指示文で表示名を使っている
    expect(getPromptAdvice('font', 'right')).toContain(AXES[3].right.name);
    expect(getTrait('font', 'right')).toContain(AXES[3].right.name);
  });

  it('知らない組み合わせはエラーになる', () => {
    expect(() => getTrait('density', 'middle' as TraitSide)).toThrow();
  });
});
