/** 診断で測る4つの軸。タイプコードの文字の並び順もこの順。 */
export type AxisId = 'density' | 'decoration' | 'tone' | 'font';

/**
 * 回答の値。
 *
 * ここでいう 'left' / 'right' は **軸の左側・右側** を意味する。
 * - 'left'  = 軸の左側（情報量: D 詰め込み / 装飾: F フラット / トーン: C クール / 文字: G ゴシック）
 * - 'right' = 軸の右側（情報量: A ゆったり / 装飾: R リッチ   / トーン: P ポップ   / 文字: M 明朝）
 *
 * 画面上でどちらが左に表示されたか（位置）とは無関係。
 * 質問画面では位置による偏りを防ぐため A/B の表示位置を問題ごとに入れ替えるが、
 * 保存する値は常に「どちら側を選んだか」という意味の値にする。
 * そのためロジック側は表示位置の入れ替えの影響を受けない。
 */
export type AxisSide = 'left' | 'right';

/** タイプコードに使う文字。左側・右側の順で D/A・F/R・C/P・G/M。 */
export type AxisLetter = 'D' | 'A' | 'F' | 'R' | 'C' | 'P' | 'G' | 'M';

/** 1つの軸で右側を選んだ数。1軸あたり3問なので0〜3。 */
export type RightCount = 0 | 1 | 2 | 3;

/** 軸ごとの「右側を選んだ数」。共有URL（?r=2302）はこの4つの数字を並べたもの。 */
export type RightCounts = Record<AxisId, RightCount>;

export interface Question {
  id: string; // 'q1'
  axis: AxisId;
  subject: string; // 'cafe-menu'（どの部品を描くか）
  label: string; // 'カフェのメニュー'
}

/** { q1: 'right', q2: 'left', ... } */
export type Answers = Record<string, AxisSide>;

export interface AxisScore {
  axis: AxisId;
  rightCount: RightCount;
  rightRatio: number; // 0〜1
}

export interface TypeInfo {
  code: string; // 'ARCG'
  name: string; // '静寂のミニマリスト'
  description: string;
}

/** 診断結果。回答からも、共有URLの4桁からも同じ形で作れる。 */
export interface DiagnosisResult {
  code: string; // 'ARCG'
  counts: RightCounts;
  scores: AxisScore[]; // 軸の順（density → decoration → tone → font）
}
