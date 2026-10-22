import type { PreviewComponent } from './types';

/**
 * カフェのメニュー（Q1・情報量）。
 *
 * 情報量の差は、行の間隔・文字サイズ・行間に出る。
 *
 * 行数はぎりぎりまで削ってある。ユッタリ側は1行が32pxになるので、
 * 1行増やすと両側で50px以上効いてしまい、2つを並べて見比べられなくなる。
 * 診断の1問目で、案内の枠があるぶん使える高さが一番狭い画面でもある。
 * 残したのは、差が見える「品名と価格の行」と「行どうしの区切り」だけ。
 *
 * 地名は架空（湊見市）。
 */
export const cafeMenu: PreviewComponent = {
  subject: 'cafe-menu',
  label: 'カフェのメニュー',
  render: () => `
    <article class="pv pv-cafe">
      <h3 class="pv-cafe__title">コーヒー</h3>
      <ul class="pv-cafe__list">
        <li class="pv-cafe__item">
          <p class="pv-cafe__name">ハンドドリップ</p>
          <p class="pv-cafe__price">¥580</p>
        </li>
        <li class="pv-cafe__item">
          <p class="pv-cafe__name">カフェラテ</p>
          <p class="pv-cafe__price">¥620</p>
        </li>
        <li class="pv-cafe__item">
          <p class="pv-cafe__name">水出しアイスコーヒー</p>
          <p class="pv-cafe__price">¥600</p>
        </li>
      </ul>
    </article>
  `,
};
