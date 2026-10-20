import type { PreviewComponent } from './types';

/**
 * カフェのメニュー（Q1・情報量）。
 *
 * 情報量の差が最も出るのは「行の間隔・文字サイズ・行間」なので、
 * 品名／説明／価格の3段構えのリストにしている。
 */
export const cafeMenu: PreviewComponent = {
  subject: 'cafe-menu',
  label: 'カフェのメニュー',
  render: () => `
    <article class="pv pv-cafe">
      <header class="pv-cafe__head">
        <p class="pv-cafe__shop">KOKAGE COFFEE</p>
        <h3 class="pv-cafe__title">コーヒー</h3>
      </header>
      <ul class="pv-cafe__list">
        <li class="pv-cafe__item">
          <div class="pv-cafe__body">
            <p class="pv-cafe__name">ハンドドリップ</p>
            <p class="pv-cafe__note">エチオピア／浅煎り・柑橘の香り</p>
          </div>
          <p class="pv-cafe__price">¥580</p>
        </li>
        <li class="pv-cafe__item">
          <div class="pv-cafe__body">
            <p class="pv-cafe__name">カフェラテ</p>
            <p class="pv-cafe__note">ミルクは糸島産を使用</p>
          </div>
          <p class="pv-cafe__price">¥620</p>
        </li>
        <li class="pv-cafe__item">
          <div class="pv-cafe__body">
            <p class="pv-cafe__name">季節のラテ</p>
            <p class="pv-cafe__note">焼き芋とキャラメル（11月まで）</p>
          </div>
          <p class="pv-cafe__price">¥680</p>
        </li>
        <li class="pv-cafe__item">
          <div class="pv-cafe__body">
            <p class="pv-cafe__name">水出しアイスコーヒー</p>
            <p class="pv-cafe__note">18時間かけて抽出</p>
          </div>
          <p class="pv-cafe__price">¥600</p>
        </li>
      </ul>
      <p class="pv-cafe__foot">表示価格は税込　/　テイクアウトは50円引き</p>
    </article>
  `,
};
