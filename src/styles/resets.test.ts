import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * リセットのセレクタが、部品側の指定に勝ってしまわないことを確かめる。
 *
 * `.pv p { margin: 0 }` のように書くと、強さが（クラス1＋要素1）になり、
 * あとから書く `.pv-cafe__note { margin-top: ... }`（クラス1）に負ける。
 * この事故を2回やっている（preview.css と kit.css）ので、機械的に止める。
 *
 * :where() で包めば強さが0になり、部品側の指定が必ず勝つ。
 */

const FILES = ['preview.css', 'kit.css'] as const;

function read(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./${name}`, import.meta.url)), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
}

/** 「クラス 要素」の形のセレクタ（.pv p など）を探す。:where() の中は除く。 */
function elementSelectorsOutsideWhere(css: string): string[] {
  const found: string[] = [];

  for (const block of css.split('}')) {
    const brace = block.indexOf('{');
    if (brace === -1) continue;

    // '}' で切ったので、各かたまりの先頭から '{' までがセレクタになる
    const selectors = block.slice(0, brace);
    // :where(...) の中身は強さ0なので取り除いてから見る
    const bare = selectors.replace(/:where\([^)]*\)/g, '');

    for (const one of bare.split(',')) {
      const trimmed = one.trim();
      if (!trimmed) continue;
      // 「.クラス つづけて 要素名」= 強さにクラスと要素が両方入る形
      if (/\.[\w-]+\s+[a-z][\w-]*\s*$/.test(trimmed)) found.push(trimmed);
    }
  }

  return found;
}

describe('リセットが部品側の指定に勝たないこと', () => {
  for (const file of FILES) {
    describe(file, () => {
      const css = read(file);

      it('リセットを :where() で包んでいる', () => {
        expect(css).toMatch(/:where\([^)]*\)\s*:where\([^)]*\)\s*\{[^}]*margin:\s*0/);
      });

      it('「クラス＋要素」のセレクタを使っていない（部品側の余白を潰すため）', () => {
        expect(elementSelectorsOutsideWhere(css)).toEqual([]);
      });

      it('リセットで margin と padding を0にしている（土台はそろえる）', () => {
        expect(css).toMatch(/margin:\s*0/);
        expect(css).toMatch(/padding:\s*0/);
      });
    });
  }
});

/**
 * 書体を見出し用と本文用に分けたときの、書き換え漏れを止める（要件 §4.1）。
 *
 * 分ける前の `var(--font-family)` が1か所でも残っていると、
 * その要素は書体の指定を失い、親から継がれた書体で描かれる。
 * エラーにならず、見た目も「それらしく」出てしまうので気づきにくい。
 */
describe('書体の変数（見出し用・本文用）', () => {
  const ALL_FILES = ['preview.css', 'kit.css', 'base.css'] as const;

  it('分ける前の --font-family を参照しているファイルが無い', () => {
    for (const name of ALL_FILES) {
      expect(read(name), name).not.toMatch(/var\(--font-family\)/);
    }
  });

  it('結果ページは本文用、その見出しは見出し用を見ている', () => {
    const css = read('base.css');
    const result = css.match(/\.screen--result\s*\{[^}]+\}/)?.[0] ?? '';
    expect(result, '.screen--result の font-family').toContain(
      'font-family: var(--font-family-body)',
    );
    // 場所の名前・節の見出し・相性の場所名
    expect(css).toMatch(
      /\.hero__shop,[\s\S]{0,80}\.result__heading,[\s\S]{0,80}\.affinity__shop\s*\{[^}]*var\(--font-family-heading\)/,
    );
  });
});

/**
 * 質問画面がスクロールなしで収まる作りになっていることを、機械的に確かめる
 * （CLAUDE.md の作業ルール）。
 *
 * 高さが足りるかどうかは実際に描かないと分からないが、
 * 「残りの高さに合わせて縮む」作りが壊れていないかは、ここで止められる。
 * 置き場の flex: 1 が外れると、デモが縮まなくなって下がはみ出す。
 */
describe('質問画面はスクロールなしで操作が完結する', () => {
  const css = () => read('base.css');

  function ruleOf(selector: string): string {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return css().match(new RegExp(`${escaped}[^{]*\\{[^}]+\\}`))?.[0] ?? '';
  }

  it('画面の高さを基準にした縦のflexになっている', () => {
    const screen = ruleOf('.screen--question,');
    expect(screen, '質問画面の指定').toContain('flex-direction: column');
    // vh ではなく dvh。iOS Safari は上下のバーの出入りで vh が変わる
    expect(screen, '画面の高さ').toContain('height: 100dvh');
  });

  it('伸び縮みするのは置き場だけ（他の行は縮まない）', () => {
    expect(ruleOf('.screen--question > *,'), '行の指定').toContain('flex-shrink: 0');
    expect(ruleOf('.q__stage'), '第1部の置き場').toContain('flex: 1');
    expect(ruleOf('.kit__stage'), '第2部の置き場').toContain('flex: 1');
  });

  it('置き場には最小の高さがある（小さい画面で潰れきらない）', () => {
    expect(ruleOf('.q__stage')).toMatch(/min-height:\s*\d/);
    expect(ruleOf('.kit__stage')).toMatch(/min-height:\s*\d/);
  });

  it('第2部のデモの入れ物が、残りの高さをそのまま枠に渡している', () => {
    expect(ruleOf('.kit__demo'), '.kit__demo').toContain('flex: 1');
    expect(ruleOf('.kit__demo'), '.kit__demo').toContain('min-height: 0');
  });
});
