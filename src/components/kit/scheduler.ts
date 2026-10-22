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
export interface Scheduler {
  /** ms ミリ秒待つ。cancel() 済みなら待たずに解決する */
  wait: (ms: number) => Promise<void>;
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
