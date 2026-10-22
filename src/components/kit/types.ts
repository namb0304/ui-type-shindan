/**
 * 第2部のデモ部品の共通インターフェース。
 *
 * 第1部のプレビュー（components/previews）とは作りが違う。
 *   第1部：HTML文字列を返す純粋関数。操作できる要素は置かない
 *   第2部：触ると動く。タイマーとイベントを持つので、後片付けが要る
 *
 * 画面を離れたあとにトーストのタイマーが発火すると、
 * 消えた要素を触ってエラーになる。必ず destroy() で止めること。
 */
export interface KitDemoInstance {
  /** 画面に挿す要素 */
  element: HTMLElement;
  /** 最初の状態に戻す。再生のたびに呼ぶので、何度でも同じものが見られる */
  reset: () => void;
  /**
   * 一連の流れを1回再生する。
   *
   * 「最初の状態に戻す → 流れを見せる → 最初の状態に戻る」で1周にする。
   * 出しっぱなしで終わると、2回目に押したときに何も起きず、差が分からなくなるため。
   * 動きが終わったら解決する（AとBを順番に動かすために待てるようにしている）。
   */
  play: () => Promise<void>;
  /** タイマーとイベントの後片付け。画面を描き直す前に必ず呼ぶ */
  destroy: () => void;
}

export interface KitDemo {
  /** kitQuestions.ts の KitOption.id と一致させる（'toast' など） */
  id: string;
  create: () => KitDemoInstance;
}
