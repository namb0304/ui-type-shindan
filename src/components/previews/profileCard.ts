import type { PreviewComponent } from './types';

/**
 * プロフィールカード（Q8・文字）。
 *
 * 主役は頭文字を1字だけ入れた丸いアイコン（画像は使わない）。
 * 1字を大きく出すと、ゴシックと明朝の骨格の差がいちばんはっきり見える。
 * 下の自己紹介3行で、本文としての読み心地の差も見せる。
 *
 * 地名・人名は架空。
 */
export const profileCard: PreviewComponent = {
  subject: 'profile-card',
  label: 'プロフィールカード',
  render: () => `
    <article class="pv pv-profile">
      <header class="pv-profile__head">
        <span class="pv-profile__mark" aria-hidden="true">柊</span>
        <div class="pv-profile__ident">
          <h3 class="pv-profile__name">野々村 柊</h3>
          <p class="pv-profile__role">木工作家　柚ノ木町</p>
        </div>
      </header>
      <p class="pv-profile__bio">暮らしの道具を、長く使える形で作っています。月に一度、工房で小さな市を開いています。</p>
      <ul class="pv-profile__facts">
        <li class="pv-profile__fact">
          <span class="pv-profile__fact-label">制作歴</span>
          <span class="pv-profile__fact-value">7年</span>
        </li>
        <li class="pv-profile__fact">
          <span class="pv-profile__fact-label">受注</span>
          <span class="pv-profile__fact-value">2か月待ち</span>
        </li>
      </ul>
    </article>
  `,
};
