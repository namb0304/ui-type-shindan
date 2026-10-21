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
  // 色の付いた要素（ボタン・ジャケット・アイコンなど）の装飾
  accentSurface: '--accent-surface',
  accentShadow: '--accent-shadow',
  // 配色プリセット
  colorBg: '--color-bg',
  colorSurface: '--color-surface',
  colorSurfaceAlt: '--color-surface-alt',
  colorText: '--color-text',
  colorTextMuted: '--color-text-muted',
  colorPrimary: '--color-primary',
  colorPrimarySoft: '--color-primary-soft',
  colorPrimaryDeep: '--color-primary-deep',
  colorOnPrimary: '--color-on-primary',
  colorPrimaryText: '--color-primary-text',
  colorShadowTint: '--color-shadow-tint',
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
  decoration: ['shadow', 'surfaceGradient', 'border', 'accentSurface', 'accentShadow'],
  tone: [
    'radius',
    'colorBg',
    'colorSurface',
    'colorSurfaceAlt',
    'colorText',
    'colorTextMuted',
    'colorPrimary',
    'colorPrimarySoft',
    'colorPrimaryDeep',
    'colorOnPrimary',
    'colorPrimaryText',
    'colorShadowTint',
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
  /** グラデーションの明るい側。colorOnPrimary とのコントラストは 4.5:1 以上 */
  colorPrimarySoft: string;
  /** グラデーションの暗い側。colorOnPrimary とのコントラストは 4.5:1 以上 */
  colorPrimaryDeep: string;
  /** colorPrimary・Soft・Deep のどれに乗せても読める文字色 */
  colorOnPrimary: string;
  /** 背景の上で文字色として使う primary 系の色（リンク・強調テキスト） */
  colorPrimaryText: string;
  /** 色付きの影に使う半透明色（文字には使わない） */
  colorShadowTint: string;
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
  colorPrimarySoft: '#426180',
  colorPrimaryDeep: '#2C4660',
  colorOnPrimary: '#FFFFFF',
  colorPrimaryText: '#335072',
  colorShadowTint: 'rgba(32, 52, 72, 0.32)',
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
  colorPrimarySoft: '#FFA052',
  colorPrimaryDeep: '#E2630F',
  colorOnPrimary: '#2E1708',
  colorPrimaryText: '#B83C0A',
  colorShadowTint: 'rgba(167, 70, 10, 0.34)',
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
  colorPrimarySoft: '#565A64',
  colorPrimaryDeep: '#343740',
  colorOnPrimary: '#FFFFFF',
  colorPrimaryText: '#4A4D55',
  colorShadowTint: 'rgba(26, 28, 32, 0.26)',
  colorBorder: '#DCDDE1',
};

export const TONE_PALETTES = { left: COOL_PALETTE, right: POP_PALETTE } as const;

// ---------------------------------------------------------------------------
// 装飾プリセット（装飾軸）
// ---------------------------------------------------------------------------

export interface DecorationPreset {
  /** カード全体の影 */
  shadow: string;
  /** カード全体の地のグラデーション */
  surfaceGradient: string;
  /** カードの枠線 */
  border: string;
  /** 色の付いた要素（ボタン・ジャケット・アイコン）の塗り */
  accentSurface: string;
  /** 色の付いた要素の影・光沢 */
  accentShadow: string;
}

/**
 * 装飾は「見た目」だけを変え、要素の大きさや配置は変えない。
 * フラットとリッチで枠線の太さを同じにしてあるのはそのため
 * （リッチ側は透明にして、線だけを消している）。
 */
export const DECORATION_BORDER_WIDTH = '2px';

/** フラット：影もグラデーションもなく、色の面もベタ塗り。境界は線だけで表す。 */
export const FLAT_DECORATION: DecorationPreset = {
  shadow: 'none',
  surfaceGradient: 'none',
  border: `${DECORATION_BORDER_WIDTH} solid var(${CSS_VAR.colorBorder})`,
  accentSurface: `var(${CSS_VAR.colorPrimary})`,
  accentShadow: 'none',
};

/**
 * リッチ：多層の柔らかい影、光沢のふち、面に回り込むグラデーション。枠線は使わない。
 *
 * フラットとの差が弱いと質問で選びにくくなる（要件 §11 のリスク）ため、
 * 3つの変数すべてで差を付けている。
 *   影  ：内側のハイライト + 3層の落ち影で、面が浮いて見えるようにする
 *   地  ：放射状のグラデーションにして、光が当たっている面に見せる
 *   枠線：なし（境界は影とグラデーションが担う）
 * グラデーションの端の色は --color-surface / --color-surface-alt のままなので、
 * 文字とのコントラスト比（4.5:1以上）は検証済みの値から変わらない。
 */
export const RICH_DECORATION: DecorationPreset = {
  shadow: [
    'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
    '0 1px 2px rgba(17, 12, 8, 0.10)',
    '0 8px 20px rgba(17, 12, 8, 0.16)',
    '0 22px 48px rgba(17, 12, 8, 0.16)',
  ].join(', '),
  surfaceGradient: `radial-gradient(135% 95% at 12% -10%, var(${CSS_VAR.colorSurface}) 0%, var(${CSS_VAR.colorSurfaceAlt}) 100%)`,
  border: 'none',
  // 色の付いた要素の装飾は、RICH_CANDIDATES から案を選んでから確定する
  accentSurface: `var(${CSS_VAR.colorPrimary})`,
  accentShadow: 'none',
};

// ---------------------------------------------------------------------------
// リッチの案（?debug=1 で見比べて選ぶ）
//
// 装飾の差が分かりにくかったのは、白い面にだけ効かせていたため。
// 色の付いた要素（--accent-surface / --accent-shadow）にこそ効かせる。
// グラデーションの色は配色パレット（トーン軸）を var() で参照するので、
// トーンが変わればグラデーションの色も追従する。
// 選定後：選ばれた案を RICH_DECORATION に移し、この定義と
// buildDecorationSampleTheme() を削除する。
// ---------------------------------------------------------------------------

export type RichCandidateId = 'b' | 'b2';

export interface RichCandidate {
  id: RichCandidateId;
  label: string;
  note: string;
  preset: DecorationPreset;
}

const SOFT = `var(${CSS_VAR.colorPrimarySoft})`;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const DEEP = `var(${CSS_VAR.colorPrimaryDeep})`;
const TINT = `var(${CSS_VAR.colorShadowTint})`;

export const RICH_CANDIDATES: readonly RichCandidate[] = [
  {
    id: 'b',
    label: '案B（現状）',
    note: '斜めのグラデーション＋上辺の光と下辺の陰＋やわらかい影。色の濃淡だけに頼る',
    preset: {
      shadow: [
        'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        '0 10px 24px rgba(17, 12, 8, 0.14)',
        '0 26px 56px rgba(17, 12, 8, 0.16)',
      ].join(', '),
      surfaceGradient: `radial-gradient(135% 95% at 12% -10%, var(${CSS_VAR.colorSurface}) 0%, var(${CSS_VAR.colorSurfaceAlt}) 100%)`,
      border: 'none',
      accentSurface: `linear-gradient(135deg, ${SOFT} 0%, ${PRIMARY} 55%, ${DEEP} 100%)`,
      accentShadow: [
        'inset 0 2px 3px rgba(255, 255, 255, 0.5)',
        `inset 0 -3px 5px ${DEEP}`,
        `0 10px 22px ${TINT}`,
      ].join(', '),
    },
  },
  {
    id: 'b2',
    label: '調整版',
    note: '光源を1つにそろえる。上からの光・内側1pxの縁・3層の落ち影だけで、要素は何も足さない',
    preset: {
      shadow: [
        // 内側の縁が光を受ける
        'inset 0 0 0 1px rgba(255, 255, 255, 0.9)',
        // 下辺をわずかに締めて、面の終わりを示す
        'inset 0 -1px 0 rgba(17, 12, 8, 0.05)',
        // 落ち影は、接地 → 中距離 → 遠く の3層。光源が1つに見える構成
        '0 1px 1px rgba(17, 12, 8, 0.05)',
        '0 8px 18px rgba(17, 12, 8, 0.10)',
        '0 24px 48px rgba(17, 12, 8, 0.14)',
      ].join(', '),
      // 光は上から当たる。放射状のwashはやめ、上→下の穏やかな明暗にする
      surfaceGradient: `linear-gradient(180deg, var(${CSS_VAR.colorSurface}) 0%, var(${CSS_VAR.colorSurface}) 42%, var(${CSS_VAR.colorSurfaceAlt}) 100%)`,
      // 線は見せないが、太さはフラットと同じにして寸法をそろえる
      border: `${DECORATION_BORDER_WIDTH} solid transparent`,
      accentSurface: `linear-gradient(135deg, ${SOFT} 0%, ${PRIMARY} 55%, ${DEEP} 100%)`,
      accentShadow: [
        'inset 0 1px 1px rgba(255, 255, 255, 0.45)',
        `inset 0 -2px 4px ${DEEP}`,
        `0 8px 20px ${TINT}`,
      ].join(', '),
    },
  },
];

export function getRichCandidate(id: RichCandidateId): RichCandidate {
  const candidate = RICH_CANDIDATES.find((item) => item.id === id);
  if (!candidate) {
    throw new Error(`リッチの案がありません: ${id}`);
  }
  return candidate;
}

/** ニュートラル：なしとリッチの中間として、影は控えめな1層だけ。 */
export const NEUTRAL_DECORATION: DecorationPreset = {
  shadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  surfaceGradient: 'none',
  border: `1px solid var(${CSS_VAR.colorBorder})`,
  accentSurface: `var(${CSS_VAR.colorPrimary})`,
  accentShadow: 'none',
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
