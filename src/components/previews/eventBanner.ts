import type { PreviewComponent } from './types';

/**
 * イベント告知（Q12・文字）。
 *
 * 行事名を2行で大きく出し、その下に日付を置く。
 * 書体の差は、大きい文字の骨格だけでなく数字の表情にも出る
 * （明朝の数字は縦線が細く、ゴシックの数字は幅がそろって見える）。
 *
 * 会場名・行事名は架空。
 */
export const eventBanner: PreviewComponent = {
  subject: 'event-banner',
  label: 'イベント告知',
  render: () => `
    <article class="pv pv-event">
      <!-- 行事名は2行に組む。自動で折り返させると「市」だけが2行目に落ちるため、
           どの文字サイズでも同じ位置で折れるよう <br> で指定する -->
      <h3 class="pv-event__title">秋の夜長<br>古本と朗読の市</h3>
      <p class="pv-event__date">11月8日（土）・9日（日）</p>
      <ul class="pv-event__details">
        <li class="pv-event__row">
          <span class="pv-event__row-label">会場</span>
          <span class="pv-event__row-value">湊見市立図書館 2階ホール</span>
        </li>
        <li class="pv-event__row">
          <span class="pv-event__row-label">時間</span>
          <span class="pv-event__row-value">10:00〜17:00（最終日は15:00）</span>
        </li>
        <li class="pv-event__row">
          <span class="pv-event__row-label">料金</span>
          <span class="pv-event__row-value">入場無料</span>
        </li>
      </ul>
      <p class="pv-event__text">古書と新刊が並びます。夕方からは朗読会。</p>
      <p class="pv-event__note">申込不要　雨天決行</p>
    </article>
  `,
};
