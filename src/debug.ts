/**
 * 確認用の表示かどうか（?debug=1）。
 *
 * 開発用のメモは本番の画面に出さず、ここが true のときだけ出す。
 */
export function isDebugMode(): boolean {
  return new URLSearchParams(window.location.search).get('debug') === '1';
}
