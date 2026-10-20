import type { PreviewComponent } from './types';

/**
 * 音楽プレイヤー（Q2・装飾）。
 *
 * 装飾の差（影・グラデーション・枠線）が出るよう、
 * 面を持つ要素（ジャケット・再生ボタン・シークバー）を中心に組んでいる。
 * 画像は使わず、レコード盤は CSS の円だけで描く。
 *
 * ボタン風の要素は <button> ではなく span にしている。
 * 質問画面ではカード全体がタップ領域になるため、
 * 内側に操作できる要素を置くとタップを奪ってしまう。
 */
export const musicPlayer: PreviewComponent = {
  subject: 'music-player',
  label: '音楽プレイヤー',
  render: () => `
    <article class="pv pv-player">
      <div class="pv-player__art" aria-hidden="true">
        <span class="pv-player__disc"></span>
      </div>
      <p class="pv-player__album">NIGHT TAPE ／ 2024</p>
      <h3 class="pv-player__track">夜明けのバス停</h3>
      <p class="pv-player__artist">海岸線スケッチ</p>
      <div class="pv-player__bar" aria-hidden="true">
        <span class="pv-player__fill"></span>
      </div>
      <div class="pv-player__times">
        <span>1:24</span>
        <span>3:52</span>
      </div>
      <div class="pv-player__controls" aria-hidden="true">
        <span class="pv-player__btn">
          <span class="pv-ico pv-ico--prev"></span>
        </span>
        <span class="pv-player__btn pv-player__btn--main">
          <span class="pv-ico pv-ico--play"></span>
        </span>
        <span class="pv-player__btn">
          <span class="pv-ico pv-ico--next"></span>
        </span>
      </div>
    </article>
  `,
};
