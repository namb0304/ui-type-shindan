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
  /**
   * 自動再生。読み込み直後に1回だけ動かして、何を見ればいいかを示す。
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
