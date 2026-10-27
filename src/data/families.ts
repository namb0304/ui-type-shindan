import { AXES, sideOfLetter } from './axes';
import { TYPE_INFOS } from './typeInfos';
import type { TypeInfo } from './types';

/**
 * 16タイプを4つの系統に分ける（トップページの一覧）。
 *
 * 写真と名前だけ16個並べても、初めての人には何のタイプか分からない。
 * **情報量 × トーン**の2軸で4つに分け、系統ごとに見出し・一言・色を付ける。
 *
 * この2軸を選んだのは、見た目の差がいちばん大きく、言葉で説明しやすいため。
 * 残りの2軸（装飾・見出し）は、各カードに小さなタグで添える。
 *
 * 所属するタイプは**タイプコードから計算する**（一覧をベタ書きしない）。
 *   1文字目 … 情報量（D=ギッシリ / A=ユッタリ）
 *   3文字目 … トーン（C=クール / P=ポップ）
 * タイプを足しても、ここは直さなくてよい。
 */

export interface TypeFamily {
  /** 情報量の文字（D / A） */
  density: string;
  /** トーンの文字（C / P） */
  tone: string;
  /** 画面に出す系統の名前 */
  name: string;
  /** 系統の一言 */
  note: string;
  /**
   * 系統の色。
   *
   * 見出しの文字・左の縦線・カードの上辺にだけ使い、面は塗らない。
   * 面を塗ると、サイト全体の「白〜薄いグレー」が崩れて、
   * 結果ページでテーマが変わる落差が弱くなる。
   *
   * 白地で 4.5:1 以上あることを確認済み
   * （きっちり 7.1 / にぎやか 5.0 / しずか 6.0 / のんびり 6.0）。
   */
  color: string;
}

export const TYPE_FAMILIES: readonly TypeFamily[] = [
  {
    density: 'D',
    tone: 'C',
    name: 'きっちり派',
    note: '情報がそろっていて、落ち着いた色',
    color: '#3B5B7A',
  },
  {
    density: 'D',
    tone: 'P',
    name: 'にぎやか派',
    note: '情報が多くて、元気な色',
    color: '#B4541C',
  },
  {
    density: 'A',
    tone: 'C',
    name: 'しずか派',
    note: '余白が広くて、落ち着いた色',
    color: '#3C6B64',
  },
  {
    density: 'A',
    tone: 'P',
    name: 'のんびり派',
    note: '余白が広くて、あたたかい色',
    color: '#9C4572',
  },
];

/** その系統に入るタイプ（タイプコードから計算する）。 */
export function typesOfFamily(family: TypeFamily): readonly TypeInfo[] {
  return TYPE_INFOS.filter(
    (info) => info.code[0] === family.density && info.code[2] === family.tone,
  );
}

/**
 * タグに出す軸の位置。
 *
 * AXES の並び順は、そのままタイプコードの文字の並び順になっている
 * （情報量 → 装飾 → トーン → 見出し）ので、同じ添字で両方を引ける。
 * 系統分けに使った 0（情報量）と 2（トーン）以外の2つ。
 */
const TAG_AXIS_INDEXES = [1, 3] as const;

/**
 * カードに添えるタグ。残りの2軸を「軸の名前：短い言い方」の形で返す。
 *
 * 例：'DRCM' → ['装飾：贅沢', '見出し：上品']
 * 軸の名前も短い言い方も axes.ts から引く（画面にベタ書きしない）。
 */
export function tagsOfType(code: string): readonly string[] {
  return TAG_AXIS_INDEXES.map((index) => {
    const axis = AXES[index];
    return `${axis.label}：${sideOfLetter(axis.id, code[index]).shortName}`;
  });
}
