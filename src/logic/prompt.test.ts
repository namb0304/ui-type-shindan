import { describe, expect, it } from 'vitest';

import { AXES } from '../data/axes';
import { CSS_VAR_NAMES } from '../data/tokens';
import { getPromptAdvice } from '../data/traits';
import { TYPE_INFOS } from '../data/typeInfos';
import type { RightPoints } from '../data/types';
import { buildPrompt, strengthOf } from './prompt';
import { resultFromPoints, sideOf } from './score';

const ALL_LEFT: RightPoints = { density: 0, decoration: 0, tone: 0, font: 0 };
const ALL_RIGHT: RightPoints = { density: 6, decoration: 6, tone: 6, font: 6 };
const ALL_EVEN: RightPoints = { density: 3, decoration: 3, tone: 3, font: 3 };

describe('寄り方の判定', () => {
  it.each([
    [0, 'left', 'はっきり'],
    [1, 'left', 'はっきり'],
    [2, 'left', 'やや'],
    [3, 'even', 'どちらでもない'],
    [4, 'right', 'やや'],
    [5, 'right', 'はっきり'],
    [6, 'right', 'はっきり'],
  ] as const)('点数 %i → %s / %s', (points, side, strength) => {
    const score = resultFromPoints({ ...ALL_LEFT, density: points }).scores[0];
    expect(sideOf(score)).toBe(side);
    expect(strengthOf(score)).toBe(strength);
  });
});

describe('buildPrompt', () => {
  it('タイプコードとお店の名前が入る', () => {
    const prompt = buildPrompt(resultFromPoints(ALL_RIGHT));
    expect(prompt).toContain('## デザインタイプ：ARPM（老舗旅館）');
  });

  it('4軸すべての行がある（軸の順）', () => {
    const prompt = buildPrompt(resultFromPoints({ density: 6, decoration: 4, tone: 3, font: 0 }));
    const lines = axisLinesOf(prompt);

    expect(lines).toHaveLength(4);
    for (const [index, axis] of AXES.entries()) {
      expect(lines[index]).toContain(axis.label);
    }
  });

  it('割合と寄り方の強さが文言に反映される', () => {
    const prompt = buildPrompt(resultFromPoints({ density: 6, decoration: 4, tone: 3, font: 0 }));
    const lines = axisLinesOf(prompt);

    expect(lines[0]).toContain('はっきり'); // 100%
    expect(lines[0]).toContain('（100%）');
    expect(lines[1]).toContain('やや'); // 67%
    expect(lines[1]).toContain('（67%）');
    expect(lines[2]).toContain('どちらでもない（50%）');
    expect(lines[3]).toContain('（100%）'); // 左側に100%寄り
  });

  it('見出しの軸は、本文がゴシックのままだと分かる文になる（要件 §4.1）', () => {
    // 「明朝体で」とだけ渡すと、AIは本文まで明朝にしてしまう。
    // どのタイプでも、本文がゴシックであることが文面に出ていること
    const mincho = axisLinesOf(buildPrompt(resultFromPoints(ALL_RIGHT)))[3];
    expect(mincho).toContain('見出し');
    expect(mincho).toContain('見出しだけ明朝体（Noto Serif JP）');
    expect(mincho).toContain('本文はゴシック体（Noto Sans JP）');

    const gothic = axisLinesOf(buildPrompt(resultFromPoints(ALL_LEFT)))[3];
    expect(gothic).toContain('見出しも本文もゴシック体（Noto Sans JP）');

    const even = axisLinesOf(buildPrompt(resultFromPoints(ALL_EVEN)))[3];
    expect(even).toContain('本文はゴシック体（Noto Sans JP）');
  });

  it('設計図のトークンに、見出し用と本文用の書体が両方入る', () => {
    const prompt = buildPrompt(resultFromPoints(ALL_RIGHT));
    expect(prompt).toContain("--font-family-heading: 'Noto Serif JP', serif;");
    expect(prompt).toContain("--font-family-body: 'Noto Sans JP', system-ui, sans-serif;");
    // 分ける前の1本の変数は、もう出さない
    expect(prompt).not.toMatch(/--font-family:/);
  });

  it('左に寄っているときは左側の割合を出す', () => {
    const prompt = buildPrompt(resultFromPoints({ ...ALL_LEFT, density: 2 }));
    const line = prompt.split('\n').find((text) => text.startsWith(`- ${AXES[0].label}`));
    // 右側33% → 左側は67%
    expect(line).toContain('（67%）');
    expect(line).toContain(AXES[0].left.name);
  });

  it('軸ごとの指示文が入っている', () => {
    const prompt = buildPrompt(resultFromPoints(ALL_EVEN));
    for (const axis of AXES) {
      expect(prompt, axis.id).toContain(getPromptAdvice(axis.id, 'even'));
    }
  });

  it('CSS変数がすべて入っている', () => {
    const prompt = buildPrompt(resultFromPoints(ALL_RIGHT));
    expect(prompt).toContain(':root {');
    for (const name of CSS_VAR_NAMES) {
      expect(prompt, name).toContain(`  ${name}: `);
    }
  });

  it('使いやすさを優先する一文が必ず入る', () => {
    for (const info of TYPE_INFOS) {
      const prompt = buildPrompt(resultFromPoints(pointsOf(info.code)));
      expect(prompt, info.code).toContain('アクセシビリティ');
      expect(prompt, info.code).toContain('使いやすさを優先する');
    }
  });

  it('16タイプすべてで組み立てられ、空の値が混ざらない', () => {
    for (const info of TYPE_INFOS) {
      const prompt = buildPrompt(resultFromPoints(pointsOf(info.code)));
      expect(prompt, info.code).toContain(info.shop);
      expect(prompt, info.code).not.toContain('undefined');
      expect(prompt, info.code).not.toContain('{left}');
      expect(prompt, info.code).not.toContain('{right}');
    }
  });

  it('同じ結果なら毎回同じ文字列になる（純粋関数）', () => {
    const result = resultFromPoints({ density: 1, decoration: 5, tone: 3, font: 6 });
    expect(buildPrompt(result)).toBe(buildPrompt(result));
  });
});

/** 軸の説明行だけを取り出す（「守ってほしいこと」の箇条書きと区別する）。 */
function axisLinesOf(prompt: string): string[] {
  return prompt
    .split('\n')
    .filter((line) => line.startsWith('- ') && line.includes('：'));
}

/** コードから点数を作る（テスト用）。 */
function pointsOf(code: string): RightPoints {
  const entries = AXES.map((axis, index) => [
    axis.id,
    code[index] === axis.right.letter ? 6 : 0,
  ]);
  return Object.fromEntries(entries) as RightPoints;
}
