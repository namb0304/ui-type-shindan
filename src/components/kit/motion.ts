/**
 * 「動きを減らす」設定を見ているかどうか。
 *
 * 第2部のデモは動きで差を見せるので、この設定の扱いが要になる（要件 §4.2）。
 *   K1〜K8 … 動きを止めても、形と位置で差が残るように作ってある
 *   K9・K10 … 動きそのものが問題なので、差を出しようがない。
 *             質問画面で「この設定では違いが出ません」と伝える
 *
 * 純粋な関数ではない（ブラウザの設定を読む）が、同じ判定を
 * デモ側と画面側の2か所に書かないよう、ここ1か所にまとめている。
 */
export function prefersReducedMotion(): boolean {
  // テストはブラウザの外で動かすので、window が無い場合も通るようにしておく
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}
