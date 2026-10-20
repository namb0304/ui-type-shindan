import type { AxisId } from './types';

/**
 * デザイントークンの定義（要件定義書 §6）。
 *
 * CSS変数の名前はこのファイルの CSS_VAR だけで管理する。
 * theme.ts も、後の prompt.ts も、必ずここを経由して参照すること
 * （変数名を直接書くと、名前を変えたときの変更漏れが起きる）。
 */

/** 論理名 → CSS変数名。 */
export const CSS_VAR = {
  // 数値（rightRatio で補間する）
  spaceUnit: '--space-unit',
  fontSizeBase: '--font-size-base',
  lineHeight: '--line-height',
  radius: '--radius',
  // プリセット（割合50%以上かどうかで切り替える）
  shadow: '--shadow',
  surfaceGradient: '--surface-gradient',
  border: '--border',
  fontFamily: '--font-family',
  // 配色プリセット
  colorBg: '--color-bg',
  colorSurface: '--color-surface',
  colorSurfaceAlt: '--color-surface-alt',
  colorText: '--color-text',
  colorTextMuted: '--color-text-muted',
  colorPrimary: '--color-primary',
  colorOnPrimary: '--color-on-primary',
  colorPrimaryText: '--color-primary-text',
  colorBorder: '--color-border',
} as const;

export type CssVarKey = keyof typeof CSS_VAR;
export type CssVarName = (typeof CSS_VAR)[CssVarKey];

/** CSS変数名 → 値。全変数が揃っている状態を表す。 */
export type ThemeVars = Record<CssVarName, string>;

/** CSS変数名の一覧。 */
export const CSS_VAR_NAMES = Object.values(CSS_VAR) as readonly CssVarName[];

/** プリセットを左右どちらに切り替えるかの境界（これ以上なら右側）。 */
export const PRESET_THRESHOLD = 0.5;

/** ニュートラル（4軸とも中間）を表す割合。 */
export const NEUTRAL_RATIO = 0.5;

/** どの軸がどのCSS変数を担当するか。軸バリアントの生成と、プロンプト生成で使う。 */
export const AXIS_VARS = {
  density: ['spaceUnit', 'fontSizeBase', 'lineHeight'],
  decoration: ['shadow', 'surfaceGradient', 'border'],
  tone: [
    'radius',
    'colorBg',
    'colorSurface',
    'colorSurfaceAlt',
    'colorText',
    'colorTextMuted',
    'colorPrimary',
    'colorOnPrimary',
    'colorPrimaryText',
    'colorBorder',
  ],
  font: ['fontFamily'],
} as const satisfies Record<AxisId, readonly CssVarKey[]>;

// ---------------------------------------------------------------------------
// 数値トークン（左右の値の間を rightRatio で補間する）
// ニュートラルは左右のちょうど中間（ratio 0.5）になるよう値を選んでいる。
// ---------------------------------------------------------------------------

export interface NumericToken {
  key: CssVarKey;
  axis: AxisId;
  left: number;
  right: number;
  /** 'px' か、単位なし（行間） */
  unit: string;
  /** 丸める小数点以下の桁数 */
  decimals: number;
}

export const NUMERIC_TOKENS = [
  { key: 'spaceUnit', axis: 'density', left: 6, right: 16, unit: 'px', decimals: 1 },
  { key: 'fontSizeBase', axis: 'density', left: 14, right: 17, unit: 'px', decimals: 1 },
  { key: 'lineHeight', axis: 'density', left: 1.5, right: 1.9, unit: '', decimals: 2 },
  { key: 'radius', axis: 'tone', left: 4, right: 20, unit: 'px', decimals: 1 },
] as const satisfies readonly NumericToken[];

// ---------------------------------------------------------------------------
// 配色プリセット（トーン軸）
// 文字と背景のコントラスト比はすべて 4.5:1 以上（theme.test.ts で検証）
// ---------------------------------------------------------------------------

export interface ColorPalette {
  colorBg: string;
  colorSurface: string;
  colorSurfaceAlt: string;
  colorText: string;
  colorTextMuted: string;
  /** 面の塗り（ボタンなど）に使う色 */
  colorPrimary: string;
  /** colorPrimary の上に乗せる文字色 */
  colorOnPrimary: string;
  /** 背景の上で文字色として使う primary 系の色（リンク・強調テキスト） */
  colorPrimaryText: string;
  colorBorder: string;
}

/** クール：低彩度の寒色。 */
export const COOL_PALETTE: ColorPalette = {
  colorBg: '#F2F5F8',
  colorSurface: '#FFFFFF',
  colorSurfaceAlt: '#E7EDF4',
  colorText: '#1B2733',
  colorTextMuted: '#55636F',
  colorPrimary: '#3B5B7A',
  colorOnPrimary: '#FFFFFF',
  colorPrimaryText: '#335072',
  colorBorder: '#D2DAE2',
};

/**
 * ポップ：高彩度の暖色。
 * 鮮やかなオレンジは白文字とのコントラストが足りないため、
 * 面の塗り（colorPrimary）は鮮やかに、その上の文字（colorOnPrimary）は濃い色にする。
 */
export const POP_PALETTE: ColorPalette = {
  colorBg: '#FFF7EF',
  colorSurface: '#FFFFFF',
  colorSurfaceAlt: '#FFEBDA',
  colorText: '#2E1708',
  colorTextMuted: '#7A4A22',
  colorPrimary: '#F97316',
  colorOnPrimary: '#2E1708',
  colorPrimaryText: '#B83C0A',
  colorBorder: '#F5DCC6',
};

/** ニュートラル：トップ・質問画面用の低彩度グレー（要件 §5 の「控えめなデザイン」）。 */
export const NEUTRAL_PALETTE: ColorPalette = {
  colorBg: '#F7F7F8',
  colorSurface: '#FFFFFF',
  colorSurfaceAlt: '#EFEFF1',
  colorText: '#1F2023',
  colorTextMuted: '#5C5F66',
  colorPrimary: '#4A4D55',
  colorOnPrimary: '#FFFFFF',
  colorPrimaryText: '#4A4D55',
  colorBorder: '#DCDDE1',
};

export const TONE_PALETTES = { left: COOL_PALETTE, right: POP_PALETTE } as const;

// ---------------------------------------------------------------------------
// 装飾プリセット（装飾軸）
// ---------------------------------------------------------------------------

export interface DecorationPreset {
  shadow: string;
  surfaceGradient: string;
  border: string;
}

/** フラット：影もグラデーションもなく、境界は細い線で表す。 */
export const FLAT_DECORATION: DecorationPreset = {
  shadow: 'none',
  surfaceGradient: 'none',
  border: `1px solid var(${CSS_VAR.colorBorder})`,
};

/** リッチ：多層の柔らかい影と2色のグラデーション。枠線は使わない。 */
export const RICH_DECORATION: DecorationPreset = {
  shadow: [
    '0 1px 2px rgba(17, 12, 8, 0.08)',
    '0 6px 16px rgba(17, 12, 8, 0.14)',
    '0 16px 36px rgba(17, 12, 8, 0.12)',
  ].join(', '),
  surfaceGradient: `linear-gradient(160deg, var(${CSS_VAR.colorSurface}), var(${CSS_VAR.colorSurfaceAlt}))`,
  border: 'none',
};

/** ニュートラル：なしとリッチの中間として、影は控えめな1層だけ。 */
export const NEUTRAL_DECORATION: DecorationPreset = {
  shadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  surfaceGradient: 'none',
  border: `1px solid var(${CSS_VAR.colorBorder})`,
};

export const DECORATION_PRESETS = { left: FLAT_DECORATION, right: RICH_DECORATION } as const;

// ---------------------------------------------------------------------------
// フォントプリセット（文字軸）
// ---------------------------------------------------------------------------

export const GOTHIC_FONT = "'Noto Sans JP', system-ui, sans-serif";
export const MINCHO_FONT = "'Noto Serif JP', serif";

export const FONT_PRESETS = { left: GOTHIC_FONT, right: MINCHO_FONT } as const;

/** ニュートラルはゴシック（要件 §5：トップと質問画面はゴシック体）。 */
export const NEUTRAL_FONT = GOTHIC_FONT;
