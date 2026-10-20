import { describe, expect, it } from 'vitest';

import { AXIS_IDS } from '../data/axes';
import {
  AXIS_VARS,
  COOL_PALETTE,
  CSS_VAR,
  CSS_VAR_NAMES,
  GOTHIC_FONT,
  MINCHO_FONT,
  NEUTRAL_PALETTE,
  POP_PALETTE,
} from '../data/tokens';
import type { ColorPalette, CssVarName, ThemeVars } from '../data/tokens';
import type { AxisId, AxisScore, RightCount, RightCounts } from '../data/types';
import { toAxisScores } from './score';
import {
  applyTheme,
  buildAxisVariantTheme,
  buildNeutralTheme,
  buildResultTheme,
  formatValue,
  interpolate,
  varNamesOfAxis,
} from './theme';

/** 全軸同じ rightCount のスコアを作る。 */
function scoresOf(rightCount: RightCount): AxisScore[] {
  return toAxisScores({
    density: rightCount,
    decoration: rightCount,
    tone: rightCount,
    font: rightCount,
  });
}

// --- コントラスト比の計算（WCAG 2.1 の相対輝度の式） ---

function channelLuminance(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const body = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(body.slice(i, i + 2), 16));
  return (
    0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
  );
}

function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [lighter, darker] = a >= b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

describe('補間と書式', () => {
  it('interpolate は左右の値を割合で補間する', () => {
    expect(interpolate(6, 16, 0)).toBe(6);
    expect(interpolate(6, 16, 1)).toBe(16);
    expect(interpolate(6, 16, 0.5)).toBe(11);
    expect(interpolate(6, 16, 1 / 3)).toBeCloseTo(9.333, 3);
  });

  it('formatValue は指定桁に丸め、余分な0を付けない', () => {
    expect(formatValue(9.3333, 1, 'px')).toBe('9.3px');
    expect(formatValue(6, 1, 'px')).toBe('6px');
    expect(formatValue(1.6333, 2, '')).toBe('1.63');
    expect(formatValue(1.5, 2, '')).toBe('1.5');
  });
});

describe('buildResultTheme（結果用）', () => {
  it('全軸0なら左端の値になる', () => {
    const theme = buildResultTheme(scoresOf(0));
    expect(theme[CSS_VAR.spaceUnit]).toBe('6px');
    expect(theme[CSS_VAR.fontSizeBase]).toBe('14px');
    expect(theme[CSS_VAR.lineHeight]).toBe('1.5');
    expect(theme[CSS_VAR.radius]).toBe('4px');
    expect(theme[CSS_VAR.shadow]).toBe('none');
    expect(theme[CSS_VAR.surfaceGradient]).toBe('none');
    expect(theme[CSS_VAR.border]).toContain('1px solid');
    expect(theme[CSS_VAR.fontFamily]).toBe(GOTHIC_FONT);
    expect(theme[CSS_VAR.colorPrimary]).toBe(COOL_PALETTE.colorPrimary);
  });

  it('全軸3なら右端の値になる', () => {
    const theme = buildResultTheme(scoresOf(3));
    expect(theme[CSS_VAR.spaceUnit]).toBe('16px');
    expect(theme[CSS_VAR.fontSizeBase]).toBe('17px');
    expect(theme[CSS_VAR.lineHeight]).toBe('1.9');
    expect(theme[CSS_VAR.radius]).toBe('20px');
    expect(theme[CSS_VAR.shadow]).toContain('rgba');
    expect(theme[CSS_VAR.surfaceGradient]).toContain('linear-gradient');
    expect(theme[CSS_VAR.border]).toBe('none');
    expect(theme[CSS_VAR.fontFamily]).toBe(MINCHO_FONT);
    expect(theme[CSS_VAR.colorPrimary]).toBe(POP_PALETTE.colorPrimary);
  });

  it('数値は rightRatio で補間される', () => {
    const oneThird = buildResultTheme(scoresOf(1));
    expect(oneThird[CSS_VAR.spaceUnit]).toBe('9.3px'); // 6 + 10 * 1/3
    expect(oneThird[CSS_VAR.fontSizeBase]).toBe('15px'); // 14 + 1
    expect(oneThird[CSS_VAR.lineHeight]).toBe('1.63');
    expect(oneThird[CSS_VAR.radius]).toBe('9.3px');

    const twoThirds = buildResultTheme(scoresOf(2));
    expect(twoThirds[CSS_VAR.spaceUnit]).toBe('12.7px');
    expect(twoThirds[CSS_VAR.fontSizeBase]).toBe('16px');
    expect(twoThirds[CSS_VAR.lineHeight]).toBe('1.77');
    expect(twoThirds[CSS_VAR.radius]).toBe('14.7px'); // 4 + 16 * 2/3
  });

  it('プリセットは割合50%を境に切り替わる（33%は左、67%は右）', () => {
    const left = buildResultTheme(scoresOf(1));
    expect(left[CSS_VAR.shadow]).toBe('none');
    expect(left[CSS_VAR.fontFamily]).toBe(GOTHIC_FONT);
    expect(left[CSS_VAR.colorBg]).toBe(COOL_PALETTE.colorBg);

    const right = buildResultTheme(scoresOf(2));
    expect(right[CSS_VAR.shadow]).toContain('rgba');
    expect(right[CSS_VAR.fontFamily]).toBe(MINCHO_FONT);
    expect(right[CSS_VAR.colorBg]).toBe(POP_PALETTE.colorBg);
  });

  it('ちょうど50%なら右側のプリセットになる', () => {
    const scores: AxisScore[] = AXIS_IDS.map((axis) => ({ axis, rightCount: 2, rightRatio: 0.5 }));
    expect(buildResultTheme(scores)[CSS_VAR.fontFamily]).toBe(MINCHO_FONT);
  });

  it('軸ごとに独立して反映される（情報量だけ右、他は左）', () => {
    const counts: RightCounts = { density: 3, decoration: 0, tone: 0, font: 0 };
    const theme = buildResultTheme(toAxisScores(counts));
    expect(theme[CSS_VAR.spaceUnit]).toBe('16px');
    expect(theme[CSS_VAR.shadow]).toBe('none');
    expect(theme[CSS_VAR.colorBg]).toBe(COOL_PALETTE.colorBg);
    expect(theme[CSS_VAR.fontFamily]).toBe(GOTHIC_FONT);
  });

  it('スコアが足りなければエラーになる', () => {
    expect(() => buildResultTheme(scoresOf(0).slice(0, 3))).toThrow(/font/);
  });

  it('CSS変数がすべて揃っている', () => {
    for (const rightCount of [0, 1, 2, 3] as const) {
      const theme = buildResultTheme(scoresOf(rightCount));
      for (const name of CSS_VAR_NAMES) {
        expect(theme[name], name).toBeTruthy();
      }
      expect(Object.keys(theme).sort()).toEqual([...CSS_VAR_NAMES].sort());
    }
  });
});

describe('buildNeutralTheme（質問用・ニュートラル）', () => {
  const theme = buildNeutralTheme();

  it('数値は左右の中間値になる', () => {
    expect(theme[CSS_VAR.spaceUnit]).toBe('11px');
    expect(theme[CSS_VAR.fontSizeBase]).toBe('15.5px');
    expect(theme[CSS_VAR.lineHeight]).toBe('1.7');
    expect(theme[CSS_VAR.radius]).toBe('12px');
  });

  it('配色はニュートラル、フォントはゴシック、グラデーションなし', () => {
    expect(theme[CSS_VAR.colorBg]).toBe(NEUTRAL_PALETTE.colorBg);
    expect(theme[CSS_VAR.colorPrimary]).toBe(NEUTRAL_PALETTE.colorPrimary);
    expect(theme[CSS_VAR.fontFamily]).toBe(GOTHIC_FONT);
    expect(theme[CSS_VAR.surfaceGradient]).toBe('none');
    expect(theme[CSS_VAR.border]).toContain('1px solid');
  });

  it('クール・ポップのどちらのプリセットでもない（専用トークン）', () => {
    expect(theme[CSS_VAR.colorBg]).not.toBe(COOL_PALETTE.colorBg);
    expect(theme[CSS_VAR.colorBg]).not.toBe(POP_PALETTE.colorBg);
  });

  it('CSS変数がすべて揃っている', () => {
    expect(Object.keys(theme).sort()).toEqual([...CSS_VAR_NAMES].sort());
  });
});

describe('buildAxisVariantTheme（質問用・A/B比較）', () => {
  /** 2つのテーマで値が違うCSS変数名を列挙する。 */
  function diffNames(a: ThemeVars, b: ThemeVars): CssVarName[] {
    return CSS_VAR_NAMES.filter((name) => a[name] !== b[name]);
  }

  it('指定した軸の変数だけがニュートラルと違う（視力検査方式）', () => {
    const neutral = buildNeutralTheme();
    for (const axis of AXIS_IDS) {
      for (const side of ['left', 'right'] as const) {
        const variant = buildAxisVariantTheme(axis, side);
        const changed = diffNames(neutral, variant);
        const allowed = varNamesOfAxis(axis);
        for (const name of changed) {
          expect(allowed, `${axis}/${side} が ${name} を変えている`).toContain(name);
        }
      }
    }
  });

  it('左右で必ず見た目に差が出る', () => {
    for (const axis of AXIS_IDS) {
      const left = buildAxisVariantTheme(axis, 'left');
      const right = buildAxisVariantTheme(axis, 'right');
      expect(diffNames(left, right).length, axis).toBeGreaterThan(0);
    }
  });

  it('情報量の左右は余白・文字サイズ・行間の端の値になる', () => {
    const left = buildAxisVariantTheme('density', 'left');
    const right = buildAxisVariantTheme('density', 'right');
    expect([left[CSS_VAR.spaceUnit], right[CSS_VAR.spaceUnit]]).toEqual(['6px', '16px']);
    expect([left[CSS_VAR.fontSizeBase], right[CSS_VAR.fontSizeBase]]).toEqual(['14px', '17px']);
    expect([left[CSS_VAR.lineHeight], right[CSS_VAR.lineHeight]]).toEqual(['1.5', '1.9']);
    // 情報量以外はニュートラルのまま
    expect(left[CSS_VAR.radius]).toBe('12px');
    expect(right[CSS_VAR.colorBg]).toBe(NEUTRAL_PALETTE.colorBg);
  });

  it('装飾の左右はフラット／リッチになる', () => {
    expect(buildAxisVariantTheme('decoration', 'left')[CSS_VAR.shadow]).toBe('none');
    const right = buildAxisVariantTheme('decoration', 'right');
    expect(right[CSS_VAR.shadow]).toContain('rgba');
    expect(right[CSS_VAR.surfaceGradient]).toContain('linear-gradient');
    expect(right[CSS_VAR.border]).toBe('none');
  });

  it('トーンの左右はクール／ポップと角丸になる', () => {
    const left = buildAxisVariantTheme('tone', 'left');
    const right = buildAxisVariantTheme('tone', 'right');
    expect(left[CSS_VAR.colorPrimary]).toBe(COOL_PALETTE.colorPrimary);
    expect(right[CSS_VAR.colorPrimary]).toBe(POP_PALETTE.colorPrimary);
    expect([left[CSS_VAR.radius], right[CSS_VAR.radius]]).toEqual(['4px', '20px']);
    // トーン以外はニュートラルのまま
    expect(left[CSS_VAR.spaceUnit]).toBe('11px');
    expect(right[CSS_VAR.fontFamily]).toBe(GOTHIC_FONT);
  });

  it('文字の左右はゴシック／明朝になる', () => {
    expect(buildAxisVariantTheme('font', 'left')[CSS_VAR.fontFamily]).toBe(GOTHIC_FONT);
    expect(buildAxisVariantTheme('font', 'right')[CSS_VAR.fontFamily]).toBe(MINCHO_FONT);
  });
});

describe('配色のコントラスト比（4.5:1 以上）', () => {
  const palettes: Array<[string, ColorPalette]> = [
    ['クール', COOL_PALETTE],
    ['ポップ', POP_PALETTE],
    ['ニュートラル', NEUTRAL_PALETTE],
  ];

  const pairs: Array<[keyof ColorPalette, keyof ColorPalette]> = [
    ['colorText', 'colorBg'],
    ['colorText', 'colorSurface'],
    ['colorText', 'colorSurfaceAlt'],
    ['colorTextMuted', 'colorBg'],
    ['colorTextMuted', 'colorSurface'],
    ['colorTextMuted', 'colorSurfaceAlt'],
    ['colorOnPrimary', 'colorPrimary'],
    ['colorPrimaryText', 'colorBg'],
    ['colorPrimaryText', 'colorSurface'],
    ['colorPrimaryText', 'colorSurfaceAlt'],
  ];

  it.each(palettes)('%s のすべての文字と背景の組み合わせが 4.5:1 以上', (_name, palette) => {
    for (const [fg, bg] of pairs) {
      const ratio = contrastRatio(palette[fg], palette[bg]);
      expect(ratio, `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('計算式そのものの検算（白と黒は21:1、同色は1:1）', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#3B5B7A', '#3B5B7A')).toBeCloseTo(1, 5);
  });

  it('色の値は6桁の16進表記で書かれている', () => {
    for (const [, palette] of palettes) {
      for (const value of Object.values(palette)) {
        expect(value).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });
});

describe('applyTheme（DOMへの反映）', () => {
  /** jsdom を使わずに検証するための偽の要素。 */
  function createFakeTarget() {
    const applied = new Map<string, string>();
    return {
      applied,
      style: {
        setProperty(name: string, value: string | null) {
          applied.set(name, value ?? '');
        },
      } as unknown as CSSStyleDeclaration,
    };
  }

  it('すべてのCSS変数を setProperty で設定する', () => {
    const target = createFakeTarget();
    const theme = buildResultTheme(scoresOf(3));

    applyTheme(target, theme);

    expect(target.applied.size).toBe(CSS_VAR_NAMES.length);
    for (const name of CSS_VAR_NAMES) {
      expect(target.applied.get(name), name).toBe(theme[name]);
    }
  });

  it('あとから別のテーマを反映すると値が上書きされる', () => {
    const target = createFakeTarget();
    applyTheme(target, buildResultTheme(scoresOf(0)));
    applyTheme(target, buildResultTheme(scoresOf(3)));
    expect(target.applied.get(CSS_VAR.spaceUnit)).toBe('16px');
    expect(target.applied.get(CSS_VAR.fontFamily)).toBe(MINCHO_FONT);
  });
});

describe('トークン定義の整合性', () => {
  it('AXIS_VARS が全CSS変数をちょうど1回ずつ担当している', () => {
    const assigned = AXIS_IDS.flatMap((axis) => varNamesOfAxis(axis));
    expect(assigned.length).toBe(CSS_VAR_NAMES.length);
    expect([...assigned].sort()).toEqual([...CSS_VAR_NAMES].sort());
  });

  it('AXIS_VARS の担当と実際に生成される変数が一致する', () => {
    const neutral = buildNeutralTheme();
    for (const axis of AXIS_IDS) {
      const variant = buildAxisVariantTheme(axis, 'right');
      const changed = CSS_VAR_NAMES.filter((name) => neutral[name] !== variant[name]);
      const allowed = new Set<CssVarName>(varNamesOfAxis(axis));
      expect(changed.every((name) => allowed.has(name)), axis).toBe(true);
    }
  });

  it('CSS変数名は -- で始まるケバブケース', () => {
    for (const name of CSS_VAR_NAMES) {
      expect(name).toMatch(/^--[a-z]+(-[a-z]+)*$/);
    }
  });

  it('軸ごとの担当変数（参考値の固定）', () => {
    const counts: Record<AxisId, number> = {
      density: AXIS_VARS.density.length,
      decoration: AXIS_VARS.decoration.length,
      tone: AXIS_VARS.tone.length,
      font: AXIS_VARS.font.length,
    };
    expect(counts).toEqual({ density: 3, decoration: 3, tone: 10, font: 1 });
  });
});
