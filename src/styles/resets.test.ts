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
