import type { PreviewComponent } from './types';

/**
 * 通知一覧（Q10・装飾）。
 *
 * 同じ3件が、フラットでは「線で区切られた3行」に、
 * リッチでは「3枚の浮いたカード」に見える。
 * 1件ずつを面にしてあるので、影とグラデの差が3回くり返されて分かりやすい。
 *
 * 施設名・催しは架空（湊見図書館・桜並ブックフェア）。
 */

const ITEMS = [
  { text: '注文した本が発送されました', time: '10分前', unread: true },
  { text: '返却期限は明日です', time: '湊見図書館　1時間前', unread: true },
  { text: '桜並ブックフェアがはじまりました', time: '昨日', unread: false },
] as const;

export const notificationList: PreviewComponent = {
  subject: 'notification-list',
  label: '通知一覧',
  render: () => {
    const items = ITEMS.map(
      (item) => `
      <li class="pv-notify__item">
        <span class="pv-notify__icon" aria-hidden="true"></span>
        <span class="pv-notify__body">
          <span class="pv-notify__text">${item.text}</span>
          <span class="pv-notify__time">${item.time}</span>
        </span>
        ${item.unread ? '<span class="pv-notify__dot" aria-hidden="true"></span>' : ''}
      </li>
    `,
    ).join('');

    return `
    <article class="pv pv-notify">
      <header class="pv-notify__head">
        <h3 class="pv-notify__title">お知らせ</h3>
        <span class="pv-notify__badge">3</span>
      </header>
      <div class="pv-notify__panel"><ul class="pv-notify__list">${items}</ul></div>
    </article>
  `;
  },
};
