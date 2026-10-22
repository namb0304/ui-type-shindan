import type { PreviewComponent } from './types';

/**
 * 天気アプリ（Q3・トーン）。
 *
 * トーンの差（配色と角丸）が出るよう、色の面積が大きい部品にしている。
 * 太陽と気温グラフは CSS の図形だけで描く（画像は使わない）。
 * 棒の高さはクラス（--lv1〜--lv5）で指定する。
 * インラインstyleを使うと、CSS変数で見た目を切り替える方針が崩れるため。
 *
 * 地名は架空（湊見市 桜並）。実在の地名にすると、実際の天気予報と
 * 読まれるおそれがあるため。
 *
 * 注記の行は落としてある。トーンの軸は上下2つの高さが同じになるので、
 * 1行の高さがそのまま2倍効くため。色の面（太陽・棒グラフ）は残している。
 */
export const weatherApp: PreviewComponent = {
  subject: 'weather-app',
  label: '天気アプリ',
  render: () => `
    <article class="pv pv-weather">
      <header class="pv-weather__head">
        <div>
          <p class="pv-weather__place">湊見市 桜並</p>
          <p class="pv-weather__now">
            <span class="pv-weather__temp">24</span><span class="pv-weather__unit">°C</span>
          </p>
          <p class="pv-weather__state">晴れ時々くもり　体感 26°</p>
        </div>
        <span class="pv-weather__sun" aria-hidden="true"></span>
      </header>
      <ul class="pv-weather__hours">
        <li class="pv-weather__hour">
          <span class="pv-weather__hour-temp">24°</span>
          <span class="pv-weather__bar pv-weather__bar--lv4" aria-hidden="true"></span>
          <span class="pv-weather__hour-label">12時</span>
        </li>
        <li class="pv-weather__hour">
          <span class="pv-weather__hour-temp">26°</span>
          <span class="pv-weather__bar pv-weather__bar--lv5" aria-hidden="true"></span>
          <span class="pv-weather__hour-label">15時</span>
        </li>
        <li class="pv-weather__hour">
          <span class="pv-weather__hour-temp">23°</span>
          <span class="pv-weather__bar pv-weather__bar--lv3" aria-hidden="true"></span>
          <span class="pv-weather__hour-label">18時</span>
        </li>
        <li class="pv-weather__hour">
          <span class="pv-weather__hour-temp">20°</span>
          <span class="pv-weather__bar pv-weather__bar--lv2" aria-hidden="true"></span>
          <span class="pv-weather__hour-label">21時</span>
        </li>
        <li class="pv-weather__hour">
          <span class="pv-weather__hour-temp">18°</span>
          <span class="pv-weather__bar pv-weather__bar--lv1" aria-hidden="true"></span>
          <span class="pv-weather__hour-label">24時</span>
        </li>
      </ul>
    </article>
  `,
};
