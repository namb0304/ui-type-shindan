import { getAxis } from './axes';
import type { AxisId, AxisLean } from './types';

/**
 * 結果ページに出す文章（UIあるある）と、AI向けプロンプトに入れる指示。
 *
 * 軸の表示名（ギッシリなど）はここに直接書かない。
 * 名前が必要なときは {left} / {right} と書き、fillSideNames() で差し替える。
 * 呼び名を変えるときに axes.ts の1か所だけで済むようにするため。
 */

/** 左右どちらに寄っているか。'even' は割合がちょうど50%のとき。 */
export type TraitSide = AxisLean;

export interface AxisText {
  axis: AxisId;
  side: TraitSide;
  text: string;
}

/** 文章中の {left} / {right} を、その軸の表示名に置き換える。 */
export function fillSideNames(text: string, axis: AxisId): string {
  const definition = getAxis(axis);
  return text
    .replaceAll('{left}', definition.left.name)
    .replaceAll('{right}', definition.right.name);
}

function pick(list: readonly AxisText[], axis: AxisId, side: TraitSide): string {
  const found = list.find((item) => item.axis === axis && item.side === side);
  if (!found) {
    throw new Error(`文章がありません: ${axis} / ${side}`);
  }
  return fillSideNames(found.text, axis);
}

// ---------------------------------------------------------------------------
// UIあるある（結果ページ）
// ---------------------------------------------------------------------------

export const TRAITS: readonly AxisText[] = [
  { axis: 'density', side: 'left', text: '1画面に全部あると安心する。スクロールは負けた気がする' },
  { axis: 'density', side: 'right', text: '余白が広いだけで、なぜか「ちゃんとしてる」に見える' },
  { axis: 'density', side: 'even', text: '多くても少なくても、探しているものが見つかればいい' },

  { axis: 'decoration', side: 'left', text: '影もグラデもないほうが、かえって速そうに見える' },
  { axis: 'decoration', side: 'right', text: 'ボタンが少し浮いているだけで、つい押したくなる' },
  { axis: 'decoration', side: 'even', text: '影があってもなくても、押せると分かるなら文句はない' },

  { axis: 'tone', side: 'left', text: '彩度を1段下げると、急に仕事ができる人のUIに見える' },
  { axis: 'tone', side: 'right', text: 'アイコンがカラフルなアプリは、用がなくても開いてしまう' },
  { axis: 'tone', side: 'even', text: '色の好みは、その日の気分で変わる' },

  { axis: 'font', side: 'left', text: 'スライドを作るとき、フォント選びで3秒も迷わない' },
  { axis: 'font', side: 'right', text: '{right}が1行混ざるだけで、急に「作品」っぽくなる' },
  { axis: 'font', side: 'even', text: '書体の違いは、言われれば分かる。言われなければ気にしない' },
];

export function getTrait(axis: AxisId, side: TraitSide): string {
  return pick(TRAITS, axis, side);
}

// ---------------------------------------------------------------------------
// AI向けプロンプトに入れる指示（要件定義書 §7）
// ---------------------------------------------------------------------------

export const PROMPT_ADVICE: readonly AxisText[] = [
  {
    axis: 'density',
    side: 'left',
    text: '余白は詰めて、1画面に多くの情報を収める。行間も狭めにする',
  },
  {
    axis: 'density',
    side: 'right',
    text: '余白を広く取り、1画面の情報は少なめにする。行間もゆるめにする',
  },
  { axis: 'density', side: 'even', text: '余白は標準的に。詰めすぎず、空けすぎない' },

  {
    axis: 'decoration',
    side: 'left',
    text: '影やグラデーションは使わず、境界は余白と細い線で表現する',
  },
  {
    axis: 'decoration',
    side: 'right',
    text: 'やわらかい影とグラデーションで、面に立体感を出す。枠線には頼らない',
  },
  { axis: 'decoration', side: 'even', text: '影はごく控えめに1段だけ。装飾は足しすぎない' },

  { axis: 'tone', side: 'left', text: '彩度の低い寒色系でまとめる。角丸は控えめにする' },
  { axis: 'tone', side: 'right', text: '彩度の高い暖色系でまとめる。角丸は大きめにする' },
  { axis: 'tone', side: 'even', text: '色味は中間的に。彩度も角丸も極端にしない' },

  { axis: 'font', side: 'left', text: '{left}体（Noto Sans JP）を本文にも見出しにも使う' },
  { axis: 'font', side: 'right', text: '{right}体（Noto Serif JP）を使い、行間を少し広めに取る' },
  { axis: 'font', side: 'even', text: '書体は読みやすさ優先で選ぶ。本文は{left}体でよい' },
];

export function getPromptAdvice(axis: AxisId, side: TraitSide): string {
  return pick(PROMPT_ADVICE, axis, side);
}

// ---------------------------------------------------------------------------
// タイプの説明文（結果ページで大きく出す1文の材料）
//
// 4軸ぶんを「、」でつないで1文にする（logic/summary.ts）。
// 例：情報はぎっしり、飾りはシンプル、色は元気に、文字はすっきり。
// ---------------------------------------------------------------------------

export const SUMMARY_PARTS: readonly AxisText[] = [
  { axis: 'density', side: 'left', text: '情報はぎっしり' },
  { axis: 'density', side: 'right', text: '情報はゆったり' },
  { axis: 'density', side: 'even', text: '情報量はどちらでも' },

  { axis: 'decoration', side: 'left', text: '飾りはシンプル' },
  { axis: 'decoration', side: 'right', text: '飾りは贅沢に' },
  { axis: 'decoration', side: 'even', text: '飾りはどちらでも' },

  { axis: 'tone', side: 'left', text: '色は落ち着いて' },
  { axis: 'tone', side: 'right', text: '色は元気に' },
  { axis: 'tone', side: 'even', text: '色はどちらでも' },

  { axis: 'font', side: 'left', text: '文字はすっきり' },
  { axis: 'font', side: 'right', text: '文字は上品に' },
  { axis: 'font', side: 'even', text: '文字はどちらでも' },
];

export function getSummaryPart(axis: AxisId, side: TraitSide): string {
  return pick(SUMMARY_PARTS, axis, side);
}
