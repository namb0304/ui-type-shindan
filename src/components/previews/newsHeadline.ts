import type { PreviewComponent } from './types';

/**
 * ニュース記事の見出し（Q4・文字）。
 *
 * 文字の軸は --font-family だけが変わるので、書体の差が出る要素を両方入れている。
 *   大きい見出し → 字面の骨格（ゴシックの直線／明朝のウロコと太さの強弱）
 *   本文3行     → 行の流れと読み心地
 *
 * 地名・路線名・人名はすべて架空。実在の地名と組み合わせると、
 * 本当にあった出来事と誤解されるため。
 */
export const newsHeadline: PreviewComponent = {
  subject: 'news-headline',
  label: 'ニュース記事の見出し',
  render: () => `
    <article class="pv pv-news">
      <p class="pv-news__meta">
        <span class="pv-news__section">市政</span>
        <span class="pv-news__time">10月22日 18:04</span>
      </p>
      <h3 class="pv-news__title">市電の延伸、2030年の開業で合意</h3>
      <p class="pv-news__lead">沿線3市の負担割合は年内に詰める</p>
      <div class="pv-news__body">
        <p class="pv-news__text">湊見市と県は21日、市電桜並線を北キャンパス前まで延ばす計画で合意した。総事業費は約410億円。</p>
      </div>
      <p class="pv-news__byline">文　田代 佳乃</p>
    </article>
  `,
};
