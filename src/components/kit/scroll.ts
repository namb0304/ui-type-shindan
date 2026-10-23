import type { Scheduler } from './scheduler';

/**
 * デモの中をゆっくりスクロールさせる（K2 一覧の見せ方・K3 続きの見せ方）。
 *
 * この2問の差（1画面に何件入るか／続きがどう出てくるか）は、
 * スクロールしてみないと分からない。けれど見ている人は何も操作しないので、
 * 再生のときは代わりにこちらで動かす。
 *
 * ブラウザの scrollTo({ behavior: 'smooth' }) は使わない。
 *   - かかる時間をブラウザが決めるので、再生の段取りと合わせられない
 *   - 途中で止める手段がなく、画面を離れたあとも動き続ける
 * 代わりに scheduler で少しずつ動かし、cancel されたらその場で止める。
 */

/** 1コマの間隔。これより細かくしても見た目は変わらない */
const FRAME_MS = 16;

/**
 * 動きを止める設定かどうか。
 *
 * テストはブラウザの外で動かすので、window が無い場合も通るようにしておく
 * （無ければ「止めていない」として扱う）。
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** 行き過ぎ・戻りすぎのない、ふつうの加減速。 */
function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** いちばん下まで行ったときの scrollTop。 */
export function maxScrollTop(target: HTMLElement): number {
  return Math.max(0, target.scrollHeight - target.clientHeight);
}

/**
 * ms ミリ秒かけて to までスクロールする。
 *
 * 動きを止める設定のときは一気に移動する。
 * K2・K3 の差は「何件見えるか」「続きがどう出るか」なので、
 * スクロールが瞬間移動になっても差は残る（要件 §4.2）。
 */
export async function scrollSmoothly(
  target: HTMLElement,
  to: number,
  ms: number,
  scheduler: Scheduler,
): Promise<void> {
  const from = target.scrollTop;
  const distance = to - from;
  if (distance === 0) return;

  if (prefersReducedMotion()) {
    target.scrollTop = to;
    return;
  }

  const steps = Math.max(1, Math.round(ms / FRAME_MS));
  for (let step = 1; step <= steps; step += 1) {
    await scheduler.wait(FRAME_MS);
    if (scheduler.cancelled) return;
    target.scrollTop = from + distance * ease(step / steps);
  }
}

/** いちばん下までスクロールする。 */
export function scrollToBottom(
  target: HTMLElement,
  ms: number,
  scheduler: Scheduler,
): Promise<void> {
  return scrollSmoothly(target, maxScrollTop(target), ms, scheduler);
}

/** 先頭まで戻る。 */
export function scrollToTop(
  target: HTMLElement,
  ms: number,
  scheduler: Scheduler,
): Promise<void> {
  return scrollSmoothly(target, 0, ms, scheduler);
}
