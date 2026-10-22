import type { ThemeVars } from '../../data/tokens';
import { applyTheme } from '../../logic/theme';
import { cafeMenu } from './cafeMenu';
import { eventBanner } from './eventBanner';
import { musicPlayer } from './musicPlayer';
import { newsHeadline } from './newsHeadline';
import { profileCard } from './profileCard';
import type { PreviewComponent } from './types';
import { weatherApp } from './weatherApp';

export type { PreviewComponent } from './types';

/**
 * 題材ごとのプレビュー部品。並び順は questions.ts と同じにする。
 * ステップ6で、残りの題材を順に追加していく。
 */
export const PREVIEWS: readonly PreviewComponent[] = [
  cafeMenu, // Q1  情報量
  musicPlayer, // Q2  装飾
  weatherApp, // Q3  トーン
  newsHeadline, // Q4  文字
  profileCard, // Q8  文字
  eventBanner, // Q12 文字
];

/**
 * 結果ページの「あなた好みのデザイン見本」に出す題材（要件 §5-4-6：3つ）。
 *
 * 登録済みの部品を全部並べると最終的に12枚になり、結果ページが縦に伸びすぎる。
 * 軸ごとの違いがいちばん出る3つに絞る。
 *   カフェのメニュー → 情報量（余白・行間）
 *   音楽プレイヤー   → 装飾（影・グラデーション）
 *   天気アプリ       → トーン（配色・角丸）
 * 書体はどの部品にも効くので、専用の1つは置かない。
 */
export const RESULT_PREVIEW_SUBJECTS: readonly string[] = [
  'cafe-menu',
  'music-player',
  'weather-app',
];

export function hasPreview(subject: string): boolean {
  return PREVIEWS.some((preview) => preview.subject === subject);
}

export function getPreview(subject: string): PreviewComponent {
  const preview = PREVIEWS.find((candidate) => candidate.subject === subject);
  if (!preview) {
    throw new Error(`プレビュー部品がありません: ${subject}`);
  }
  return preview;
}

/**
 * 部品を要素として作り、渡されたCSS変数をその要素に上書きする。
 *
 * 要素単位でCSS変数を上書きするので、同じ画面にクールの部品とポップの部品を
 * 並べられる（要件定義書 §5：AとBの違いの表現方法）。
 */
export function createPreview(subject: string, vars: ThemeVars): HTMLElement {
  const host = document.createElement('div');
  host.className = 'pv-host';
  host.innerHTML = getPreview(subject).render();
  applyTheme(host, vars);
  return host;
}
