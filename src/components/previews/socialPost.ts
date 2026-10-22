import type { PreviewComponent } from './types';

/**
 * SNSの投稿（Q11・トーン）。
 *
 * トーンは配色と角丸で差が出るので、色の付いた面を4つ置いている。
 *   丸アイコン・フォローボタン・タグ2つ
 * クールは落ち着いた寒色、ポップは鮮やかな暖色になり、
 * 同じ投稿でも受ける印象が大きく変わる。
 *
 * アカウント名・地名は架空（湊見・桜並）。
 */
export const socialPost: PreviewComponent = {
  subject: 'social-post',
  label: 'SNSの投稿',
  render: () => `
    <article class="pv pv-post">
      <header class="pv-post__head">
        <span class="pv-post__avatar" aria-hidden="true">湊</span>
        <span class="pv-post__who">
          <span class="pv-post__name">湊見さんぽ</span>
          <span class="pv-post__handle">@minatomi_walk・3時間</span>
        </span>
        <span class="pv-post__follow">フォロー</span>
      </header>
      <p class="pv-post__body">桜並の商店街、夕方の光がよかった。古本屋の軒先で猫が寝てた。</p>
      <p class="pv-post__tags">
        <span class="pv-post__tag">#湊見さんぽ</span>
        <span class="pv-post__tag">#商店街</span>
      </p>
      <div class="pv-post__actions">
        <span class="pv-post__action">いいね 128</span>
        <span class="pv-post__action">返信 12</span>
        <span class="pv-post__action">保存</span>
      </div>
    </article>
  `,
};
