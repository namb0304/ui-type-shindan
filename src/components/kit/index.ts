import type { ThemeVars } from '../../data/tokens';
import { applyTheme } from '../../logic/theme';
import { cardDemo, listDemo } from './list';
import { skeletonDemo, spinnerDemo } from './loading';
import { bottomNavDemo, hamburgerDemo } from './menu';
import { infiniteScrollDemo, loadMoreDemo } from './more';
import { bannerDemo, toastDemo } from './notice';
import { bottomSheetDemo, modalDemo } from './panel';
import type { KitDemo, KitDemoInstance } from './types';

export type { KitDemo, KitDemoInstance } from './types';

/**
 * 第2部のデモ部品。id は kitQuestions.ts の KitOption.id と一致させる。
 * 問題を足したらここにも足す（kit.test.ts が対応を突き合わせる）。
 */
export const KIT_DEMOS: readonly KitDemo[] = [
  hamburgerDemo, // K1-A
  bottomNavDemo, // K1-B
  listDemo, // K2-A
  cardDemo, // K2-B
  infiniteScrollDemo, // K3-A
  loadMoreDemo, // K3-B
  toastDemo, // K4-A
  bannerDemo, // K4-B
  modalDemo, // K5-A
  bottomSheetDemo, // K5-B
  skeletonDemo, // K6-A
  spinnerDemo, // K6-B
];

export function hasKitDemo(id: string): boolean {
  return KIT_DEMOS.some((demo) => demo.id === id);
}

export function getKitDemo(id: string): KitDemo {
  const demo = KIT_DEMOS.find((candidate) => candidate.id === id);
  if (!demo) {
    throw new Error(`デモ部品がありません: ${id}`);
  }
  return demo;
}

/**
 * デモを作り、渡されたCSS変数をその要素に上書きする。
 *
 * 質問画面ではニュートラルのテーマを渡す（要件 §4.2：
 * ここで測るのは部品の好みであって、色や余白の好みではない）。
 * 結果ページで見本として使い回すときは、その人のテーマを渡す。
 */
export function createKitDemo(id: string, vars: ThemeVars): KitDemoInstance {
  const instance = getKitDemo(id).create();
  applyTheme(instance.element, vars);
  return instance;
}
