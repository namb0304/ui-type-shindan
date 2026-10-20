import type { ThemeVars } from '../../data/tokens';
import { applyTheme } from '../../logic/theme';
import { cafeMenu } from './cafeMenu';
import { musicPlayer } from './musicPlayer';
import type { PreviewComponent } from './types';
import { weatherApp } from './weatherApp';

export type { PreviewComponent } from './types';

/**
 * 題材ごとのプレビュー部品。
 * ステップ4では3題材だけ。残り9題材はステップ6で追加する。
 */
export const PREVIEWS: readonly PreviewComponent[] = [cafeMenu, musicPlayer, weatherApp];

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
