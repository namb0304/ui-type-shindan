import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { QUESTIONS } from '../../data/questions';
import { CSS_VAR_NAMES } from '../../data/tokens';
import { getPreview, hasPreview, PREVIEWS } from './index';

const PREVIEW_CSS = readFileSync(
  fileURLToPath(new URL('../../styles/preview.css', import.meta.url)),
  'utf8',
);

/** コメントを除いたCSS（コメント内の記述を誤検出しないため）。 */
const CSS_WITHOUT_COMMENTS = PREVIEW_CSS.replace(/\/\*[\s\S]*?\*\//g, '');

describe('部品の登録', () => {
  it('ステップ4の3題材が登録されている', () => {
    expect(PREVIEWS.map((preview) => preview.subject)).toEqual([
      'cafe-menu',
      'music-player',
      'weather-app',
    ]);
  });

  it('subject が questions.ts の題材と一致している', () => {
    const subjects = new Set(QUESTIONS.map((question) => question.subject));
    for (const preview of PREVIEWS) {
      expect(subjects, preview.subject).toContain(preview.subject);
    }
  });

  it('label が questions.ts の表示名と一致している', () => {
    for (const preview of PREVIEWS) {
      const question = QUESTIONS.find((candidate) => candidate.subject === preview.subject);
      expect(preview.label).toBe(question?.label);
    }
  });

  it('getPreview / hasPreview が引ける', () => {
    expect(getPreview('cafe-menu').label).toBe('カフェのメニュー');
    expect(hasPreview('cafe-menu')).toBe(true);
    expect(hasPreview('news-headline')).toBe(false); // ステップ6で追加する
    expect(() => getPreview('news-headline')).toThrow(/news-headline/);
  });
});

describe('部品のHTML', () => {
  it('空でないHTMLを返す', () => {
    for (const preview of PREVIEWS) {
      const html = preview.render();
      expect(html.trim().length, preview.subject).toBeGreaterThan(0);
      expect(html, preview.subject).toContain('class="pv ');
    }
  });

  it('呼び出しても内容が変わらない（純粋関数）', () => {
    for (const preview of PREVIEWS) {
      expect(preview.render()).toBe(preview.render());
    }
  });

  it('インラインstyleを使っていない（CSS変数で切り替わらなくなるため）', () => {
    for (const preview of PREVIEWS) {
      expect(preview.render(), preview.subject).not.toMatch(/style\s*=/);
    }
  });

  it('画像を使っていない（要件 §5：HTMLとCSSだけで描く）', () => {
    for (const preview of PREVIEWS) {
      expect(preview.render(), preview.subject).not.toMatch(/<img|background-image:\s*url|<svg/);
    }
  });

  it('操作できる要素を置いていない（質問画面でカード全体がタップ領域になるため）', () => {
    for (const preview of PREVIEWS) {
      expect(preview.render(), preview.subject).not.toMatch(/<button|<a\s|<input|<select/);
    }
  });

  it('文字を含んでいる（書体の違いが見える）', () => {
    for (const preview of PREVIEWS) {
      expect(preview.render(), preview.subject).toMatch(/[ぁ-んァ-ヶ一-龠]/);
    }
  });
});

describe('preview.css が CSS変数だけを参照している', () => {
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
      const value = declaration.split(':')[1].trim();
      const ok = value.includes('var(') || value === 'inherit' || value === 'none';
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
      const ok = value.includes('var(--space-unit)') || value === '0' || value === '0 auto';
      expect(ok, declaration.trim()).toBe(true);
    }

    const radii = CSS_WITHOUT_COMMENTS.match(/(?:^|[\s;{])border-radius\s*:[^;}]+/g) ?? [];
    for (const declaration of radii) {
      const value = declaration.split(':')[1].trim();
      const ok = value.includes('var(--radius)') || value === '50%' || value === 'inherit';
      expect(ok, declaration.trim()).toBe(true);
    }
  });

  it('部品が使うCSS変数は theme.ts が生成するものだけ', () => {
    const used = new Set(
      [...CSS_WITHOUT_COMMENTS.matchAll(/var\((--[a-z-]+)/g)].map((match) => match[1]),
    );
    expect(used.size).toBeGreaterThan(0);
    for (const name of used) {
      expect(CSS_VAR_NAMES, name).toContain(name);
    }
  });
});
