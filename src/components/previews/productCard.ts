import type { PreviewComponent } from './types';

/**
 * ECの商品カード（Q5・情報量）。
 *
 * 情報量の差は「細かい行の詰まり具合」で見せる。
 * 価格・送料・在庫のように、短い行がいくつも並ぶのがECらしさなので、
 * そこに差が出るよう3段に分けている。
 *
 * 写真の場所は横に置く（縦に積まない）。縦に積むと、ユッタリ側だけが
 * 極端に伸びて、2つを並べて見比べられなくなるため。
 *
 * ブランド名・地名は架空。
 */
export const productCard: PreviewComponent = {
  subject: 'product-card',
  label: 'ECの商品カード',
  render: () => `
    <article class="pv pv-product">
      <div class="pv-product__head">
        <span class="pv-product__media" aria-hidden="true">
          <span class="pv-product__bottle"></span>
        </span>
        <div class="pv-product__info">
          <p class="pv-product__brand">KOKAGE COFFEE</p>
          <h3 class="pv-product__name">水出しコーヒー ボトル 1L（2本セット）</h3>
          <p class="pv-product__rating">★★★★☆ 4.6（128件）</p>
        </div>
      </div>
      <p class="pv-product__price">
        <span class="pv-product__now">¥2,780</span>
        <span class="pv-product__was">¥3,480</span>
        <span class="pv-product__off">20%OFF</span>
      </p>
      <p class="pv-product__note">送料無料／あすお届け　残り3点</p>
      <span class="pv-product__cart">カートに入れる</span>
    </article>
  `,
};
