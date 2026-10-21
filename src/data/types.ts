/** 診断で測る4つの軸。タイプコードの文字の並び順もこの順。 */
export type AxisId = 'density' | 'decoration' | 'tone' | 'font';

/**
 * 回答の値。
 *
 * ここでいう 'left' / 'right' は **軸の左側・右側** を意味する。
 * - 'left'  = 軸の左側（情報量: D ギッシリ / 装飾: F フラット / トーン: C クール / 文字: G ゴシック）
 * - 'right' = 軸の右側（情報量: A ユッタリ / 装飾: R リッチ   / トーン: P ポップ   / 文字: M 明朝）
 *
 * 画面上でどちらが左に表示されたか（位置）とは無関係。
 * 質問画面では位置による偏りを防ぐため A/B の表示位置を問題ごとに入れ替えるが、
 * 保存する値は常に「どちら側を選んだか」という意味の値にする。
 * そのためロジック側は表示位置の入れ替えの影響を受けない。
 */
export type AxisSide = 'left' | 'right';

/**
 * 回答の値。左右のどちらでもないときは 'either'。
 *
 * 2つのUIの差が分からない人に無理やり選ばせると、
 * 回答が実質ランダムになって判定が濁るため、逃げ道を用意している。
 */
export type AnswerValue = AxisSide | 'either';

/** タイプコードに使う文字。左側・右側の順で D/A・F/R・C/P・G/M。 */
export type AxisLetter = 'D' | 'A' | 'F' | 'R' | 'C' | 'P' | 'G' | 'M';

/**
 * 1つの軸で右側に傾いた量。
 *
 * 1問あたり 左=0 / どちらでもない=1 / 右=2 として合計する。
 * 「0.5問ぶん」のような小数を避けるため、実際の点数を2倍した整数で持つ。
 * 1軸3問なので 0〜6 の範囲になる。
 */
export type AxisPoints = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 軸ごとの点数。共有URL（?r=4026）はこの4つの数字を並べたもの。 */
export type RightPoints = Record<AxisId, AxisPoints>;

export interface Question {
  id: string; // 'q1'
  axis: AxisId;
  subject: string; // 'cafe-menu'（どの部品を描くか）
  label: string; // 'カフェのメニュー'
}

/** { q1: 'right', q2: 'left', q3: 'either', ... } */
export type Answers = Record<string, AnswerValue>;

export interface AxisScore {
  axis: AxisId;
  rightPoints: AxisPoints;
  /** 右側の割合（0〜1）。rightPoints ÷ 6 */
  rightRatio: number;
}

export interface TypeInfo {
  code: string; // 'ARCG'
  name: string; // '静寂のミニマリスト'
  description: string;
}

/** 診断結果。回答からも、共有URLの4桁からも同じ形で作れる。 */
export interface DiagnosisResult {
  code: string; // 'ARCG'
  points: RightPoints;
  scores: AxisScore[]; // 軸の順（density → decoration → tone → font）
}
