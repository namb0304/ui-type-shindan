import { AXIS_IDS } from '../data/axes';
import {
  AXIS_VARS,
  CSS_VAR,
  CSS_VAR_NAMES,
  DECORATION_PRESETS,
  FONT_PRESETS,
  NEUTRAL_DECORATION,
  NEUTRAL_FONT,
  NEUTRAL_PALETTE,
  NEUTRAL_RATIO,
  NUMERIC_TOKENS,
  PRESET_THRESHOLD,
  TONE_PALETTES,
} from '../data/tokens';
import type { ColorPalette, CssVarName, DecorationPreset, ThemeVars } from '../data/tokens';
import type { AxisId, AxisScore, AxisSide } from '../data/types';

/**
 * 軸スコア → CSS変数（要件定義書 §6）。
 *
 * build系の関数は純粋関数で、「CSS変数名 → 値」のオブジェクトを返すだけ。
 * DOMへの反映は applyTheme() だけが行う。
 */

export type PartialThemeVars = Partial<Record<CssVarName, string>>;

/** 左右の値を割合（0〜1）で補間する。 */
export function interpolate(left: number, right: number, ratio: number): number {
  return left + (right - left) * ratio;
}

/** 数値を指定桁で丸め、余分な0を落として単位を付ける（9.333 → '9.3px'）。 */
export function formatValue(value: number, decimals: number, unit: string): string {
  return `${Number(value.toFixed(decimals))}${unit}`;
}

/**
 * 割合からプリセットの左右を選ぶ。境界より大きければ右側（ちょうど半分は左側）。
 * タイプコードの判定（score.ts の isRightSide）と同じ比較にそろえている。
 */
function pickSide(ratio: number): 'left' | 'right' {
  return ratio > PRESET_THRESHOLD ? 'right' : 'left';
}

function paletteToVars(palette: ColorPalette): PartialThemeVars {
  return {
    [CSS_VAR.colorBg]: palette.colorBg,
    [CSS_VAR.colorSurface]: palette.colorSurface,
    [CSS_VAR.colorSurfaceAlt]: palette.colorSurfaceAlt,
    [CSS_VAR.colorText]: palette.colorText,
    [CSS_VAR.colorTextMuted]: palette.colorTextMuted,
    [CSS_VAR.colorPrimary]: palette.colorPrimary,
    [CSS_VAR.colorPrimarySoft]: palette.colorPrimarySoft,
    [CSS_VAR.colorPrimaryDeep]: palette.colorPrimaryDeep,
    [CSS_VAR.colorOnPrimary]: palette.colorOnPrimary,
    [CSS_VAR.colorPrimaryText]: palette.colorPrimaryText,
    [CSS_VAR.colorShadowTint]: palette.colorShadowTint,
    [CSS_VAR.colorBorder]: palette.colorBorder,
  };
}

function decorationToVars(preset: DecorationPreset): PartialThemeVars {
  return {
    [CSS_VAR.shadow]: preset.shadow,
    [CSS_VAR.surfaceGradient]: preset.surfaceGradient,
    [CSS_VAR.border]: preset.border,
    [CSS_VAR.accentSurface]: preset.accentSurface,
    [CSS_VAR.accentShadow]: preset.accentShadow,
  };
}

/** 1つの軸が担当する数値トークンを、割合で補間して返す。 */
function numericVarsOf(axis: AxisId, ratio: number): PartialThemeVars {
  const vars: PartialThemeVars = {};
  for (const token of NUMERIC_TOKENS) {
    if (token.axis !== axis) continue;
    const value = interpolate(token.left, token.right, ratio);
    vars[CSS_VAR[token.key]] = formatValue(value, token.decimals, token.unit);
  }
  return vars;
}

/**
 * 1つの軸が担当するCSS変数を、その軸の割合から作る。
 * 数値は補間し、色・影・グラデーション・枠線・フォントは50%で切り替える。
 */
function axisVars(axis: AxisId, ratio: number): PartialThemeVars {
  const side = pickSide(ratio);
  switch (axis) {
    case 'density':
      return numericVarsOf(axis, ratio);
    case 'decoration':
      return decorationToVars(DECORATION_PRESETS[side]);
    case 'tone':
      return { ...numericVarsOf(axis, ratio), ...paletteToVars(TONE_PALETTES[side]) };
    case 'font':
      return { [CSS_VAR.fontFamily]: FONT_PRESETS[side] };
  }
}

/** 1つの軸が担当するCSS変数のニュートラル値。 */
function neutralAxisVars(axis: AxisId): PartialThemeVars {
  switch (axis) {
    case 'density':
      return numericVarsOf(axis, NEUTRAL_RATIO);
    case 'decoration':
      return decorationToVars(NEUTRAL_DECORATION);
    case 'tone':
      return { ...numericVarsOf(axis, NEUTRAL_RATIO), ...paletteToVars(NEUTRAL_PALETTE) };
    case 'font':
      return { [CSS_VAR.fontFamily]: NEUTRAL_FONT };
  }
}

/** 全変数が揃っているか確かめて ThemeVars にする（定義漏れの早期発見）。 */
function toThemeVars(vars: PartialThemeVars): ThemeVars {
  const missing = CSS_VAR_NAMES.filter((name) => vars[name] === undefined);
  if (missing.length > 0) {
    throw new Error(`CSS変数が不足しています: ${missing.join(', ')}`);
  }
  return vars as ThemeVars;
}

/** 結果用：4軸の AxisScore からテーマ全体のCSS変数を作る。 */
export function buildResultTheme(scores: readonly AxisScore[]): ThemeVars {
  const ratios = new Map(scores.map((score) => [score.axis, score.rightRatio]));
  const vars: PartialThemeVars = {};

  for (const axis of AXIS_IDS) {
    const ratio = ratios.get(axis);
    if (ratio === undefined) {
      throw new Error(`軸 ${axis} のスコアがありません`);
    }
    Object.assign(vars, axisVars(axis, ratio));
  }

  return toThemeVars(vars);
}

/** 質問用：4軸とも中間のCSS変数。 */
export function buildNeutralTheme(): ThemeVars {
  const vars: PartialThemeVars = {};
  for (const axis of AXIS_IDS) {
    Object.assign(vars, neutralAxisVars(axis));
  }
  return toThemeVars(vars);
}

/**
 * 質問用：ニュートラルをベースに、指定した1つの軸だけを左側／右側に振ったCSS変数。
 * その軸が担当する変数以外はニュートラルと完全に同じになる（要件 §4 の視力検査方式）。
 */
export function buildAxisVariantTheme(axis: AxisId, side: AxisSide): ThemeVars {
  const ratio = side === 'right' ? 1 : 0;
  return toThemeVars({ ...buildNeutralTheme(), ...axisVars(axis, ratio) });
}

/** applyTheme の対象。HTMLElement でも、テスト用の偽オブジェクトでも受け取れる。 */
export interface ThemeTarget {
  style: Pick<CSSStyleDeclaration, 'setProperty'>;
}

/** CSS変数を要素に反映する（このファイルで唯一副作用を持つ関数）。 */
export function applyTheme(target: ThemeTarget, vars: ThemeVars): void {
  for (const name of CSS_VAR_NAMES) {
    target.style.setProperty(name, vars[name]);
  }
}

/** その軸が担当するCSS変数名の一覧（プロンプト生成やテストで使う）。 */
export function varNamesOfAxis(axis: AxisId): readonly CssVarName[] {
  return AXIS_VARS[axis].map((key) => CSS_VAR[key]);
}
