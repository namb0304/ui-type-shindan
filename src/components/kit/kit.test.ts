import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

import { KIT_QUESTIONS, TOTAL_KIT_QUESTIONS } from '../../data/kitQuestions';
import { KIT_CATEGORY_LABEL } from '../../data/kitTypes';
import { CSS_VAR_NAMES } from '../../data/tokens';
import { getKitDemo, hasKitDemo, KIT_DEMOS } from './index';
import { createScheduler } from './scheduler';
import { maxScrollTop, scrollSmoothly } from './scroll';

const KIT_CSS = readFileSync(
  fileURLToPath(new URL('../../styles/kit.css', import.meta.url)),
  'utf8',
);

const CSS_WITHOUT_COMMENTS = KIT_CSS.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * 第2部が自前で持つ変数。
 *   --duration / --kit-duration … 動きの長さ。tokens.ts に入るまでは既定値で動かす（要件 §6）
 *   --ease / --kit-ease          … 動き方。K9（きびきび／ふんわり）で変える
 *   --bezel                      … 筐体の縁の太さ。--space-unit から計算している
 *                                  （下の「--bezel は --space-unit から導いている」で検証）
 *   --kit-danger / --kit-danger-bg … 入力ミスの赤（K8）。16タイプのどれで見ても
 *                                  「間違っている」と伝わる必要があるので、
 *                                  テーマで変えずに base.css に固定で置いている
 *                                  （下の「入力ミスの赤は〜」で検証）
 */
const KIT_OWN_VARS = [
  '--duration',
  '--kit-duration',
  '--bezel',
  '--ease',
  '--kit-ease',
  '--kit-danger',
  '--kit-danger-bg',
];

const BASE_CSS = readFileSync(
  fileURLToPath(new URL('../../styles/base.css', import.meta.url)),
  'utf8',
);

describe('第2部の質問データ', () => {
  it('10問（K1〜K10）そろっている', () => {
    expect(KIT_QUESTIONS.map((question) => question.id)).toEqual([
      'k1',
      'k2',
      'k3',
      'k4',
      'k5',
      'k6',
      'k7',
      'k8',
      'k9',
      'k10',
    ]);
    expect(TOTAL_KIT_QUESTIONS).toBe(10);
  });

  it('分類ごとにまとまって並んでいる（出題中に分類が行き来しない）', () => {
    const order = KIT_QUESTIONS.map((question) => question.category);
    const seen: string[] = [];
    for (const category of order) {
      if (seen[seen.length - 1] !== category) seen.push(category);
    }
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('id が重複していない', () => {
    const ids = KIT_QUESTIONS.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('分類に表示名がある', () => {
    for (const question of KIT_QUESTIONS) {
      expect(KIT_CATEGORY_LABEL[question.category], question.id).toBeTruthy();
    }
  });

  it('どの選択肢にも名前と一言の説明がある（要件 §4.2）', () => {
    for (const question of KIT_QUESTIONS) {
      for (const option of [question.a, question.b]) {
        expect(option.name.length, `${question.id} ${option.id}`).toBeGreaterThan(0);
        expect(option.description.length, `${question.id} ${option.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('問いと説明が日本語で書かれている', () => {
    for (const question of KIT_QUESTIONS) {
      expect(question.label, question.id).toMatch(/[ぁ-んァ-ヶ一-龠]/);
      expect(question.a.description, question.id).toMatch(/[ぁ-んァ-ヶ一-龠]/);
      expect(question.b.description, question.id).toMatch(/[ぁ-んァ-ヶ一-龠]/);
    }
  });
});

describe('デモ部品の登録', () => {
  it('すべての選択肢にデモがある', () => {
    for (const question of KIT_QUESTIONS) {
      for (const option of [question.a, question.b]) {
        expect(hasKitDemo(option.id), `${question.id} ${option.id}`).toBe(true);
      }
    }
  });

  it('余分なデモが登録されていない（質問から引けないデモを残さない）', () => {
    const used = new Set(KIT_QUESTIONS.flatMap((question) => [question.a.id, question.b.id]));
    for (const demo of KIT_DEMOS) {
      expect(used, demo.id).toContain(demo.id);
    }
  });

  it('id が重複していない', () => {
    const ids = KIT_DEMOS.map((demo) => demo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getKitDemo は無いものを引くとエラーになる', () => {
    expect(getKitDemo('toast').id).toBe('toast');
    expect(() => getKitDemo('tooltip')).toThrow(/tooltip/);
  });
});

describe('取り消せる待ち時間（scheduler）', () => {
  it('指定した時間が過ぎたら解決する', async () => {
    vi.useFakeTimers();
    const scheduler = createScheduler();

    let done = false;
    const waiting = scheduler.wait(1000).then(() => {
      done = true;
    });

    await vi.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await waiting;
    expect(done).toBe(true);

    vi.useRealTimers();
  });

  it('cancel したら、待っている側はその場で解決する（await が止まらない）', async () => {
    vi.useFakeTimers();
    const scheduler = createScheduler();

    const waiting = scheduler.wait(100000);
    scheduler.cancel();

    await expect(waiting).resolves.toBeUndefined();
    expect(scheduler.cancelled).toBe(true);

    vi.useRealTimers();
  });

  it('cancel したあとはタイマーが発火しない（画面を離れたあとの誤作動を防ぐ）', async () => {
    vi.useFakeTimers();
    const scheduler = createScheduler();

    let fired = false;
    void scheduler.wait(1000).then(() => {
      // cancel 済みなら、ここは「解決はするが続きはやらない」側で弾く
      if (!scheduler.cancelled) fired = true;
    });

    scheduler.cancel();
    await vi.advanceTimersByTimeAsync(2000);

    expect(fired).toBe(false);
    expect(vi.getTimerCount()).toBe(0);

    vi.useRealTimers();
  });

  it('cancel 後の wait は待たずに解決する', async () => {
    const scheduler = createScheduler();
    scheduler.cancel();
    await expect(scheduler.wait(100000)).resolves.toBeUndefined();
  });
});

/**
 * スクロールだけを取り出して確かめる（K2・K3）。
 *
 * 本物の要素はテストでは作れない（DOMを動かす環境を入れていない）ので、
 * scrollSmoothly が触る3つの値だけを持つ身代わりを渡す。
 */
function fakeScrollTarget(scrollHeight: number, clientHeight: number): HTMLElement {
  return { scrollTop: 0, scrollHeight, clientHeight } as unknown as HTMLElement;
}

describe('デモの中のスクロール（K2・K3）', () => {
  it('いちばん下の位置は「中身の高さ − 見えている高さ」', () => {
    expect(maxScrollTop(fakeScrollTarget(500, 300))).toBe(200);
  });

  it('中身が画面に収まっているときは、下まで行っても0のまま（負にしない）', () => {
    expect(maxScrollTop(fakeScrollTarget(200, 300))).toBe(0);
  });

  it('決めた時間をかけて、目的の位置までたどり着く', async () => {
    vi.useFakeTimers();
    const scheduler = createScheduler();
    const target = fakeScrollTarget(500, 300);

    const scrolling = scrollSmoothly(target, 200, 480, scheduler);
    await vi.advanceTimersByTimeAsync(240);
    // 途中なので、まだ着いていない
    expect(target.scrollTop).toBeGreaterThan(0);
    expect(target.scrollTop).toBeLessThan(200);

    await vi.advanceTimersByTimeAsync(240);
    await scrolling;
    expect(target.scrollTop).toBe(200);

    vi.useRealTimers();
  });

  it('画面を離れたら、その場で止まる（動き続けない）', async () => {
    vi.useFakeTimers();
    const scheduler = createScheduler();
    const target = fakeScrollTarget(500, 300);

    const scrolling = scrollSmoothly(target, 200, 480, scheduler);
    await vi.advanceTimersByTimeAsync(160);
    const stoppedAt = target.scrollTop;

    scheduler.cancel();
    await scrolling;
    await vi.advanceTimersByTimeAsync(1000);

    expect(target.scrollTop).toBe(stoppedAt);
    expect(target.scrollTop).toBeLessThan(200);

    vi.useRealTimers();
  });

  it('いまいる場所と同じなら、何もしない', async () => {
    const scheduler = createScheduler();
    const target = fakeScrollTarget(500, 300);
    await expect(scrollSmoothly(target, 0, 480, scheduler)).resolves.toBeUndefined();
    expect(target.scrollTop).toBe(0);
  });
});

describe('kit.css が CSS変数だけを参照している', () => {
  it('生の色（16進・rgb・hsl・色名）を書いていない', () => {
    expect(CSS_WITHOUT_COMMENTS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CSS_WITHOUT_COMMENTS).not.toMatch(/\b(?:rgb|rgba|hsl|hsla)\(/);
    expect(CSS_WITHOUT_COMMENTS).not.toMatch(/:\s*(?:white|black|gray|grey|red|blue)\b/);
  });

  it('色・背景・影・フォントの指定が var() を経由している', () => {
    const declarations = CSS_WITHOUT_COMMENTS.match(
      /(?:^|[\s;{])(?:color|background|background-color|background-image|box-shadow|font-family)\s*:[^;}]+/g,
    );
    expect(declarations?.length ?? 0).toBeGreaterThan(0);
    for (const declaration of declarations ?? []) {
      const value = declaration.split(':').slice(1).join(':').trim();
      const ok =
        value.includes('var(') ||
        value === 'inherit' ||
        value === 'none' ||
        value === 'currentcolor' ||
        // 色を持たない影（目印の輪が消えきった状態）は素の値でよい
        /^0 0 0 [\d.]+em transparent$/.test(value);
      expect(ok, declaration.trim()).toBe(true);
    }
  });

  it('余白・角丸を px で直接書いていない（1px / 2px は枠線用に許容）', () => {
    const pxValues = CSS_WITHOUT_COMMENTS.match(/\b\d+(?:\.\d+)?px\b/g) ?? [];
    const notAllowed = pxValues.filter((value: string) => value !== '1px' && value !== '2px');
    expect(notAllowed).toEqual([]);
  });

  it('余白は --space-unit から、角丸は --radius から導いている', () => {
    const paddings = CSS_WITHOUT_COMMENTS.match(
      /(?:^|[\s;{])(?:margin|padding|gap)(?:-top|-right|-bottom|-left)?\s*:[^;}]+/g,
    );
    expect(paddings?.length ?? 0).toBeGreaterThan(0);
    for (const declaration of paddings ?? []) {
      const value = declaration.split(':')[1].trim();
      const ok =
        value.includes('var(--space-unit)') ||
        // --bezel は --space-unit から計算した値
        value.includes('var(--bezel)') ||
        value === '0' ||
        value === '0 auto';
      expect(ok, declaration.trim()).toBe(true);
    }

    const radii = CSS_WITHOUT_COMMENTS.match(/(?:^|[\s;{])border-radius\s*:[^;}]+/g) ?? [];
    for (const declaration of radii) {
      const value = declaration.split(':')[1].trim();
      const ok = value.includes('var(--radius)') || value === '50%' || value === 'inherit';
      expect(ok, declaration.trim()).toBe(true);
    }
  });

  it('--bezel は --space-unit から導いている（素のpxで持たない）', () => {
    const bezel = CSS_WITHOUT_COMMENTS.match(/--bezel:\s*([^;]+);/);
    expect(bezel?.[1], '--bezel の定義が見つからない').toBeTruthy();
    expect(bezel?.[1]).toContain('var(--space-unit)');
  });

  it('内側の画面の角丸を、縁の太さぶん小さくしている（角の見切れ対策）', () => {
    const screen = CSS_WITHOUT_COMMENTS.match(/\.kit-demo__screen\s*\{[^}]+\}/)?.[0] ?? '';
    const radius = screen.match(/border-radius:\s*([^;]+);/)?.[1] ?? '';
    expect(radius, '.kit-demo__screen の border-radius').toContain('var(--bezel)');
  });

  it('スマホの枠を縦長に保っている（横長だと一般的なUIに見えない）', () => {
    const frame = CSS_WITHOUT_COMMENTS.match(/\.kit-demo\s*\{[^}]+\}/)?.[0] ?? '';
    const ratio = frame.match(/aspect-ratio:\s*(\d+)\s*\/\s*(\d+)/);
    expect(ratio, '.kit-demo の aspect-ratio').toBeTruthy();
    const [, w, h] = ratio ?? [];
    expect(Number(w) / Number(h), '幅 ÷ 高さ が1未満（縦長）').toBeLessThan(1);
  });

  it('デモが使うCSS変数は theme.ts が生成するものだけ（--duration を除く）', () => {
    const used = new Set(
      [...CSS_WITHOUT_COMMENTS.matchAll(/var\((--[a-z-]+)/g)].map((match) => match[1]),
    );
    expect(used.size).toBeGreaterThan(0);
    for (const name of used) {
      if (KIT_OWN_VARS.includes(name)) continue;
      expect(CSS_VAR_NAMES, name).toContain(name);
    }
  });

  it('K9 は速さだけでなく動き方も変えている（0.15秒と0.35秒の差だけでは見分けにくい）', () => {
    const snappy = CSS_WITHOUT_COMMENTS.match(/\.kit-demo\[data-speed='snappy'\]\s*\{[^}]+\}/)?.[0] ?? '';
    const soft = CSS_WITHOUT_COMMENTS.match(/\.kit-demo\[data-speed='soft'\]\s*\{[^}]+\}/)?.[0] ?? '';
    expect(snappy, 'きびきびの指定').toContain('--kit-duration');
    expect(soft, 'ふんわりの指定').toContain('--kit-duration');

    const snappyEase = snappy.match(/--kit-ease:\s*cubic-bezier\(([^)]+)\)/)?.[1];
    const softEase = soft.match(/--kit-ease:\s*cubic-bezier\(([^)]+)\)/)?.[1];
    expect(snappyEase, 'きびきびの動き方').toBeTruthy();
    expect(softEase, 'ふんわりの動き方').toBeTruthy();
    expect(softEase).not.toBe(snappyEase);

    const [softX1, softY1, , softY2] = (softEase ?? '').split(',').map(Number);

    // 行き過ぎてから戻る（制御点のどちらかが1を超える＝弾む）
    expect(Math.max(softY1, softY2), 'ふんわりは1を超えて行き過ぎる').toBeGreaterThan(1);

    // 出だしを遅らせてある。ここが要で、出だしの速い曲線にすると
    // 0.35秒かけていても、きびきび（0.15秒）より先に進んで見える
    expect(softX1, 'ふんわりは出だしを遅らせる').toBeGreaterThanOrEqual(0.3);
  });

  it('動きを止める設定は、K9 の速さの指定にも勝てる強さで打ち消している', () => {
    const reduced =
      CSS_WITHOUT_COMMENTS.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\}/)?.[0] ??
      '';
    // `.kit-demo` だけだと `.kit-demo[data-speed='soft']` に負ける
    expect(reduced).toMatch(/\.kit-demo\[data-speed\][\s\S]{0,80}--kit-duration:\s*0s/);
  });

  it('デモの本文は本文用、題は見出し用の書体を見ている（要件 §4.1）', () => {
    const base = CSS_WITHOUT_COMMENTS.match(/\.kit-demo\s*\{[^}]+\}/)?.[0] ?? '';
    expect(base, '.kit-demo の font-family').toContain('font-family: var(--font-family-body)');
    expect(CSS_WITHOUT_COMMENTS).toContain('var(--font-family-heading)');
  });

  it('分ける前の --font-family が残っていない', () => {
    expect(CSS_WITHOUT_COMMENTS).not.toMatch(/var\(--font-family\)/);
  });

  it('入力ミスの赤は、テーマではなく base.css に固定で置いている（K8）', () => {
    // kit.css 側では変数を参照するだけ
    expect(CSS_WITHOUT_COMMENTS).toContain('var(--kit-danger)');
    // 実体は base.css の :root にある
    expect(BASE_CSS).toMatch(/--kit-danger:\s*#[0-9a-fA-F]{6};/);
    expect(BASE_CSS).toMatch(/--kit-danger-bg:\s*#[0-9a-fA-F]{6};/);
  });

  it('動きの長さは --duration を見ている（手順4〜5で tokens.ts から渡せるように）', () => {
    expect(CSS_WITHOUT_COMMENTS).toMatch(/transition:[^;}]*var\(--duration\)/);
  });

  it('prefers-reduced-motion の指定がある（要件 §4.2）', () => {
    expect(CSS_WITHOUT_COMMENTS).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });
});

describe('デモの文言（CLAUDE.md の文言のルール）', () => {
  it('説明文に、かたい言い回しを使っていない', () => {
    for (const question of KIT_QUESTIONS) {
      for (const option of [question.a, question.b]) {
        // 「〜させる」は説明口調になりやすい（「待たせる」など）
        expect(option.description, `${question.id} ${option.id}`).not.toMatch(/させる|による|すること/);
      }
    }
  });

  it('説明文が短い（1行で読み切れる長さ）', () => {
    for (const question of KIT_QUESTIONS) {
      for (const option of [question.a, question.b]) {
        expect(option.description.length, `${question.id} ${option.id}`).toBeLessThanOrEqual(24);
      }
    }
  });
});

describe('kit.css のタップの波紋', () => {
  it('波紋のスタイルがある（どこが押されたか分かるようにする）', () => {
    expect(CSS_WITHOUT_COMMENTS).toMatch(/\.memo__tap\s*\{/);
    expect(CSS_WITHOUT_COMMENTS).toMatch(/@keyframes kit-tap/);
  });

  it('動きを止めた環境では、波紋を広げない', () => {
    const reduced = CSS_WITHOUT_COMMENTS.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\}/,
    )?.[0] ?? '';
    expect(reduced).toMatch(/\.memo__tap\s*\{[^}]*animation:\s*none/);
  });
});
