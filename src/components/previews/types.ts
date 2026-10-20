/**
 * プレビュー部品の共通インターフェース。
 *
 * 各部品はHTML文字列を返す純粋関数にして、DOMには触らない。
 * DOMを触るのは index.ts の createPreview() だけ。
 */
export interface PreviewComponent {
  /** questions.ts の subject と一致させる（'cafe-menu' など） */
  subject: string;
  /** 題材の表示名（'カフェのメニュー'） */
  label: string;
  /** 部品のHTML。class名は preview.css に対応する */
  render: () => string;
}
