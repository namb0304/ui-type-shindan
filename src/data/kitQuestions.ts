import type { KitQuestion } from './kitTypes';

/**
 * 第2部「定番UIキット」の質問（要件定義書 §4.2）。
 *
 * 最終的に10問（K1〜K10）。いまは最初の3問だけで、残りは後の手順で足す。
 * 配列に足すだけで、質問画面・進捗バー・確認ページがすべて追従する
 * （問数をどこにもベタ書きしないこと）。
 *
 * id は要件 §4.2 の問番号に合わせてあるので、配列の順番とは一致しない。
 * 並び順は「出題する順」であって、問番号の順ではない。
 */
export const KIT_QUESTIONS = [
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
