import type { KitQuestion } from './kitTypes';

/**
 * 第2部「定番UIキット」の質問（要件定義書 §4.2）。
 *
 * 最終的に10問（K1〜K10）。いまは K1〜K6 で、残りは後の手順で足す。
 * 配列に足すだけで、質問画面・進捗バー・確認ページがすべて追従する
 * （問数をどこにもベタ書きしないこと）。
 *
 * 並び順は「出題する順」。分類ごとにまとめて出す（レイアウト →
 * コンポーネント → アニメーション）ので、要件 §4.2 の問番号の順と同じになる。
 * 画面が大きく変わる問題（メニュー・一覧）を先に出して、
 * 細かい部品の問題を後に置いたほうが、何を見ればいいか分かりやすい。
 */
export const KIT_QUESTIONS = [
  {
    id: 'k1',
    category: 'layout',
    label: 'メニューの出し方',
    a: {
      id: 'hamburger',
      name: 'ハンバーガーメニュー',
      description: '三本線を押すと、行き先が出てくる',
    },
    b: {
      id: 'bottom-nav',
      name: 'ボトムナビ',
      description: '画面の下に、行き先がいつも並んでいる',
    },
  },
  {
    id: 'k2',
    category: 'layout',
    label: '一覧の見せ方',
    a: {
      id: 'list',
      name: 'リスト',
      description: '1行ずつ並べる。一度にたくさん見える',
    },
    b: {
      id: 'card',
      name: 'カード',
      description: '1件ずつ四角い面で見せる。1件が目立つ',
    },
  },
  {
    id: 'k3',
    category: 'layout',
    label: '続きの見せ方',
    a: {
      id: 'infinite-scroll',
      name: '無限スクロール',
      description: '下まで行くと、次が勝手に出てくる',
    },
    b: {
      id: 'load-more',
      name: '「もっと見る」ボタン',
      description: '押したぶんだけ、続きが出てくる',
    },
  },
  {
    id: 'k4',
    category: 'component',
    label: 'お知らせの出し方',
    a: {
      id: 'toast',
      name: 'トースト',
      description: '数秒で自動的に消えるお知らせ',
    },
    b: {
      id: 'banner',
      name: 'バナー',
      description: '✕を押すまで画面の上に残るお知らせ',
    },
  },
  {
    id: 'k5',
    category: 'component',
    label: '確認の出し方',
    a: {
      id: 'modal',
      name: 'モーダル',
      description: '画面の真ん中に出てくる確認画面',
    },
    b: {
      id: 'bottom-sheet',
      name: 'ボトムシート',
      description: '画面の下からせり上がってくる確認画面',
    },
  },
  {
    id: 'k6',
    category: 'component',
    label: '読み込み中の見せ方',
    a: {
      id: 'skeleton',
      name: 'スケルトンスクリーン',
      description: '読み込み中に、出てくる中身の形を先に見せる',
    },
    b: {
      id: 'spinner',
      name: 'スピナー',
      description: '読み込み中に、くるくる回る印を見せる',
    },
  },
] as const satisfies readonly KitQuestion[];

/** 第2部の問題数。進捗バーの分母とひと休み画面の案内に使う。 */
export const TOTAL_KIT_QUESTIONS = KIT_QUESTIONS.length;
