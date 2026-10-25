import { el } from '../views/dom';

/**
 * 結果が出るまでの待ち時間の見せ方（K6 のてんこ盛り化・要件 §5）。
 *
 * 待ち時間を新しく作ってはいない。結果ページには元から
 * 「あなたのデザインの好みは……」→ 一拍おいて店名、という発表演出があり、
 * そのあいだ写真の読み込みも実際に走っている。その一拍に乗せる。
 *
 *   スケルトンスクリーン … 出てくる中身の形を先に灰色で出す
 *   スピナー             … くるくる回る印だけを出す
 *
 * 発表が終わったら、この要素と入れ替わりに本文が出る。
 * 入れ替わるのは画面の下のほう（ファーストビューより下）なので、
 * 見ている人の目の前で飛び跳ねることはない。
 */

/**
 * 発表が終わるまでの時間。
 * base.css の `.result__after` の animation-delay（0.95s）と同じにする。
 * ずれると、本文が出たあとに待たせるか、待ち時間が消える前に本文が出る。
 */
export const REVEAL_DELAY_MS = 950;

export type LoadingVariant = 'skeleton' | 'spinner';

/** スケルトンの行。出てくる中身（見出し＋4行）の形に合わせてある */
const SKELETON_WIDTHS = ['38%', '100%', '92%', '74%'] as const;

export function createResultLoading(variant: LoadingVariant): HTMLElement {
  const element = el('div', `result-loading result-loading--${variant}`);
  // 飾りなので読み上げない。待っていることは本文が出れば分かる
  element.setAttribute('aria-hidden', 'true');

  if (variant === 'spinner') {
    element.append(el('span', 'result-loading__spinner'));
    return element;
  }

  for (const width of SKELETON_WIDTHS) {
    const bar = el('span', 'result-loading__bar');
    bar.style.width = width;
    element.append(bar);
  }
  return element;
}
