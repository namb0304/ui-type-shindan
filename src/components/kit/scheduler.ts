/**
 * 取り消せる待ち時間。
 *
 * デモはタイマーで動く（1.8秒後にトーストを消す、1.4秒後に中身を出す）。
 * 画面を離れたあとにタイマーが発火すると、すでに消えた要素を触ってしまう。
 * デモごとに1つ持たせ、destroy() で cancel() する。
 *
 * cancel() したあとは
 *   - 待っている wait() はその場で解決する（await が永遠に止まらないようにする）
 *   - cancelled が true になるので、再生の続きを止められる
 *   - 新しい wait() も即座に解決する
 */
/**
 * 見せるための「間」に掛ける倍率。**テンポを変えるときはここだけを触る。**
 *
 * デモの再生は「動き」と「間」でできている。
 *   動き … トーストが出入りする、スクロールする、文字が打たれる、波紋が広がる
 *   間   … 出したまま止めて見せる、押すまで待つ、読み込み中のまま待たせる
 *
 * 速くしたいときに縮めるのは「間」だけにする。動きまで速くすると、
 * K9（動きの速さ）で見比べているものが変わってしまう。
 *
 * 1.0 で元の長さ。小さくすると全10問のテンポが一度に上がる。
 */
export const HOLD_SCALE = 0.9;

export interface Scheduler {
  /**
   * ms ミリ秒待つ。cancel() 済みなら待たずに解決する。
   *
   * 動きに合わせて待つときに使う（波紋が広がりきるまで、文字を1字打つまで）。
   * 指定した長さがそのまま効く。
   */
  wait: (ms: number) => Promise<void>;
  /**
   * 見せるための間。HOLD_SCALE が掛かる。
   *
   * 「出したまま止めて見せる」「押すまで待つ」はこちらを使う。
   */
  hold: (ms: number) => Promise<void>;
  /** 取り消し済みかどうか。再生中の各段階の前に見る */
  readonly cancelled: boolean;
  cancel: () => void;
}

export function createScheduler(): Scheduler {
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const pending = new Set<() => void>();
  let cancelled = false;

  return {
    get cancelled() {
      return cancelled;
    },

    hold(ms: number): Promise<void> {
      return this.wait(Math.round(ms * HOLD_SCALE));
    },

    wait(ms: number): Promise<void> {
      if (cancelled) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const done = (): void => {
          pending.delete(done);
          resolve();
        };
        pending.add(done);

        const id = setTimeout(() => {
          timers.delete(id);
          done();
        }, ms);
        timers.add(id);
      });
    },

    cancel(): void {
      cancelled = true;
      for (const id of timers) clearTimeout(id);
      timers.clear();
      // 待っている側を解放する。解決しないと await が戻らず、
      // 再生中の処理がメモリに残り続ける
      for (const done of [...pending]) done();
      pending.clear();
    },
  };
}
