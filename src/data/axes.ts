import type { AxisId, AxisLetter } from './types';

/** 軸の片側の定義。 */
export interface AxisSideDefinition {
  /** タイプコードに使う文字 */
  letter: AxisLetter;
  /** 日本語の呼び名（例: 'ユッタリ'） */
  name: string;
  /** 英語の呼び名（例: 'Airy'） */
  englishName: string;
  /**
   * 短い言い方（例: 'ゆったり'）。
   *
   * トップページの16タイプ一覧で、小さなタグに出す
   * （「装飾：シンプル」「見出し：すっきり」）。
   * 呼び名（name）は診断の用語なので、初めての人には通じない。
   * タグは説明を読まずに意味が分かる言葉にする。
   */
  shortName: string;
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
 * （情報量 → 装飾 → トーン → 見出し）であり、共有URLの4桁の並び順でもある。
 */
export const AXES = [
  {
    id: 'density',
    label: '情報量',
    left: { letter: 'D', name: 'ギッシリ', englishName: 'Dense', shortName: 'ぎっしり' },
    right: { letter: 'A', name: 'ユッタリ', englishName: 'Airy', shortName: 'ゆったり' },
  },
  {
    id: 'decoration',
    label: '装飾',
    left: { letter: 'F', name: 'フラット', englishName: 'Flat', shortName: 'シンプル' },
    right: { letter: 'R', name: 'リッチ', englishName: 'Rich', shortName: '贅沢' },
  },
  {
    id: 'tone',
    label: 'トーン',
    left: { letter: 'C', name: 'クール', englishName: 'Cool', shortName: '落ち着き' },
    right: { letter: 'P', name: 'ポップ', englishName: 'Pop', shortName: '元気' },
  },
  {
    /**
     * id は 'font' のまま変えない。共有URLの並び順・保存済みの回答・
     * タイプコードの文字（G/M）がこのidに紐づいているため。
     * 画面に出す名前だけを「見出し」にする（要件 §4.1）。
     */
    id: 'font',
    label: '見出し',
    left: { letter: 'G', name: 'ゴシック', englishName: 'Gothic', shortName: 'すっきり' },
    right: { letter: 'M', name: '明朝', englishName: 'Mincho', shortName: '上品' },
  },
] as const satisfies readonly AxisDefinition[];

/** 軸のID一覧（タイプコードの順）。 */
export const AXIS_IDS = AXES.map((axis) => axis.id) as readonly AxisId[];

/**
 * タイプコードの1文字から、その軸のどちら側かを引く。
 *
 * 例：sideOfLetter('decoration', 'R') → リッチ側の定義。
 * トップページのタグ（「装飾：贅沢」）を、コードから組み立てるのに使う。
 */
export function sideOfLetter(id: AxisId, letter: string): AxisSideDefinition {
  const axis = getAxis(id);
  if (axis.left.letter === letter) return axis.left;
  if (axis.right.letter === letter) return axis.right;
  throw new Error(`軸 ${id} に文字 ${letter} はありません`);
}

/** IDから軸の定義を引く。 */
export function getAxis(id: AxisId): AxisDefinition {
  const axis = AXES.find((candidate) => candidate.id === id);
  if (!axis) {
    throw new Error(`不明な軸です: ${id}`);
  }
  return axis;
}
