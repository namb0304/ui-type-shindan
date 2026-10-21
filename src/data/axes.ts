import type { AxisId, AxisLetter } from './types';

/** 軸の片側の定義。 */
export interface AxisSideDefinition {
  /** タイプコードに使う文字 */
  letter: AxisLetter;
  /** 日本語の呼び名（例: 'ゆったり'） */
  name: string;
  /** 英語の呼び名（例: 'Airy'） */
  englishName: string;
}

export interface AxisDefinition {
  id: AxisId;
  /** 軸の名前（例: '情報量'）。回答中は先入観を防ぐため画面に出さない */
  label: string;
  left: AxisSideDefinition;
  right: AxisSideDefinition;
}

/** 1つの軸を測る問題数。 */
export const QUESTIONS_PER_AXIS = 3;

/**
 * 1問の満点。左=0 / どちらでもない=1 / 右=2 として数える。
 * 小数を避けるため、実際の点数（0 / 0.5 / 1）を2倍した整数で扱う。
 */
export const POINTS_PER_QUESTION = 2;

/** 1つの軸の満点（0〜6）。 */
export const MAX_POINTS = QUESTIONS_PER_AXIS * POINTS_PER_QUESTION;

/**
 * 右側と判定する境界。この割合「より大きい」なら右側。
 * ちょうど半分（50%）は左側になる。
 *
 * タイプコードの文字（score.ts）と、テーマのプリセット切り替え（theme.ts）は
 * 必ずこの同じ値・同じ比較を使うこと。片方だけ >= にすると、
 * ちょうど50%のときにタイプコードと見た目が食い違う。
 */
export const SIDE_THRESHOLD = 0.5;

/**
 * 4つの軸の定義。この配列の順序がタイプコードの文字の並び順
 * （情報量 → 装飾 → トーン → 文字）であり、共有URLの4桁の並び順でもある。
 */
export const AXES = [
  {
    id: 'density',
    label: '情報量',
    left: { letter: 'D', name: '詰め込み', englishName: 'Dense' },
    right: { letter: 'A', name: 'ゆったり', englishName: 'Airy' },
  },
  {
    id: 'decoration',
    label: '装飾',
    left: { letter: 'F', name: 'フラット', englishName: 'Flat' },
    right: { letter: 'R', name: 'リッチ', englishName: 'Rich' },
  },
  {
    id: 'tone',
    label: 'トーン',
    left: { letter: 'C', name: 'クール', englishName: 'Cool' },
    right: { letter: 'P', name: 'ポップ', englishName: 'Pop' },
  },
  {
    id: 'font',
    label: '文字',
    left: { letter: 'G', name: 'ゴシック', englishName: 'Gothic' },
    right: { letter: 'M', name: '明朝', englishName: 'Mincho' },
  },
] as const satisfies readonly AxisDefinition[];

/** 軸のID一覧（タイプコードの順）。 */
export const AXIS_IDS = AXES.map((axis) => axis.id) as readonly AxisId[];

/** IDから軸の定義を引く。 */
export function getAxis(id: AxisId): AxisDefinition {
  const axis = AXES.find((candidate) => candidate.id === id);
  if (!axis) {
    throw new Error(`不明な軸です: ${id}`);
  }
  return axis;
}
