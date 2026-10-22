/**
 * 第2部「定番UIキット」の型定義（要件定義書 §6）。
 *
 * 第1部（雰囲気の4軸）とは型から分けてある。
 * 第2部の回答は16タイプの判定に使わないので、
 * 混ざらないよう AnswerValue / Answers とは別の型にしている（要件 §4.2）。
 */

/** 質問の分類。結果ページで、この単位にまとめて並べる。 */
export type KitCategory = 'layout' | 'component' | 'motion';

/**
 * 選択肢の識別子。'a' / 'b' は**選択肢の名前**であって、画面上の位置ではない。
 * 第1部と同じく表示位置は問題ごとに入れ替えるが、保存する値は入れ替えの影響を受けない。
 */
export type KitChoice = 'a' | 'b';

/** 差が分からない・こだわりがないときは 'either'。 */
export type KitAnswerValue = KitChoice | 'either';

/** { k4: 'a', k5: 'either', ... } */
export type KitAnswers = Record<string, KitAnswerValue>;

/**
 * 選択肢ひとつ。
 *
 * name と description は、質問画面・結果ページ・AIに渡せる設計図の
 * すべてで使う。文章にベタ書きせず、必ずここを参照すること（要件 §4.2）。
 * 「UIの名前を知らない人が、名前を覚えて帰れる」ことが第2部の価値のひとつなので、
 * 名前と説明は必ずセットで出す。
 */
export interface KitOption {
  /** デモ部品の id と一致させる（'toast' など） */
  id: string;
  /** 部品の名前（'トースト'） */
  name: string;
  /** 一言の説明（'画面の端に一瞬出て、自分で消える'） */
  description: string;
}

export interface KitQuestion {
  /** 'k4'。要件 §4.2 の問番号に合わせる */
  id: string;
  category: KitCategory;
  /** 画面に出す問い（'お知らせの出し方'） */
  label: string;
  a: KitOption;
  b: KitOption;
}

/** 分類の表示名。 */
export const KIT_CATEGORY_LABEL: Readonly<Record<KitCategory, string>> = {
  layout: 'レイアウト',
  component: 'コンポーネント',
  motion: 'アニメーション',
};
