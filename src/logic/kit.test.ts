import { describe, expect, it } from 'vitest';

import { KIT_QUESTIONS } from '../data/kitQuestions';
import type { KitAnswers } from '../data/kitTypes';
import {
  chosenKitParts,
  groupKitByCategory,
  hasNoKitPreference,
  kitPartId,
  resolveKit,
} from './kit';

/** 全問Aを選んだ状態。 */
const ALL_A: KitAnswers = Object.fromEntries(KIT_QUESTIONS.map((q) => [q.id, 'a']));
const ALL_B: KitAnswers = Object.fromEntries(KIT_QUESTIONS.map((q) => [q.id, 'b']));
const ALL_EITHER: KitAnswers = Object.fromEntries(KIT_QUESTIONS.map((q) => [q.id, 'either']));

describe('resolveKit', () => {
  it('10問ぶんを、出題順で返す', () => {
    const results = resolveKit(ALL_A);
    expect(results).toHaveLength(KIT_QUESTIONS.length);
    expect(results.map((r) => r.question.id)).toEqual(KIT_QUESTIONS.map((q) => q.id));
  });

  it('選んだ側の部品が入る', () => {
    expect(resolveKit(ALL_A)[0].option?.id).toBe(KIT_QUESTIONS[0].a.id);
    expect(resolveKit(ALL_B)[0].option?.id).toBe(KIT_QUESTIONS[0].b.id);
  });

  it('「どっちでもいい」は部品が入らない', () => {
    for (const result of resolveKit(ALL_EITHER)) {
      expect(result.either, result.question.id).toBe(true);
      expect(result.option, result.question.id).toBeUndefined();
    }
  });

  it('未回答も「どっちでもいい」として扱う（?debug=1 から開いた結果ページで落ちない）', () => {
    const results = resolveKit({});
    expect(results).toHaveLength(KIT_QUESTIONS.length);
    expect(results.every((r) => r.either)).toBe(true);
  });
});

describe('groupKitByCategory', () => {
  it('分類ごとにまとまり、合計は10問', () => {
    const groups = groupKitByCategory(ALL_A);
    const total = groups.reduce((sum, g) => sum + g.items.length, 0);
    expect(total).toBe(KIT_QUESTIONS.length);
  });

  it('同じ分類が2回出てこない（出題順が分類ごとにまとまっているため）', () => {
    const categories = groupKitByCategory(ALL_A).map((g) => g.category);
    expect(new Set(categories).size).toBe(categories.length);
  });

  it('分類に表示名が付く', () => {
    for (const group of groupKitByCategory(ALL_A)) {
      expect(group.label.length).toBeGreaterThan(0);
    }
  });
});

describe('chosenKitParts（AIに渡す文章用）', () => {
  it('「どっちでもいい」の項目は入らない（要件 §4.2）', () => {
    expect(chosenKitParts(ALL_EITHER)).toHaveLength(0);
    expect(chosenKitParts(ALL_A)).toHaveLength(KIT_QUESTIONS.length);
  });

  it('混ざっているときは、選んだ項目だけが入る', () => {
    const answers: KitAnswers = { ...ALL_EITHER, k4: 'b' };
    const parts = chosenKitParts(answers);
    expect(parts).toHaveLength(1);
    expect(parts[0].option.id).toBe('banner');
  });

  it('10問すべて「どっちでもいい」かどうかを判定できる', () => {
    expect(hasNoKitPreference(ALL_EITHER)).toBe(true);
    expect(hasNoKitPreference({ ...ALL_EITHER, k1: 'a' })).toBe(false);
  });
});

describe('kitPartId（結果ページの見た目用）', () => {
  it('選んだ側の部品を返す', () => {
    expect(kitPartId(ALL_A, 'k4')).toBe('toast');
    expect(kitPartId(ALL_B, 'k4')).toBe('banner');
  });

  it('「どっちでもいい」と未回答は、Aを既定にする（要件 §4.2）', () => {
    expect(kitPartId(ALL_EITHER, 'k4')).toBe('toast');
    expect(kitPartId({}, 'k4')).toBe('toast');
  });

  it('無い問題を指定したらエラーになる（打ち間違い対策）', () => {
    expect(() => kitPartId(ALL_A, 'k99')).toThrow(/k99/);
  });

  it('どの問題でも、必ずどちらかの部品のidを返す', () => {
    for (const question of KIT_QUESTIONS) {
      const id = kitPartId(ALL_EITHER, question.id);
      expect([question.a.id, question.b.id], question.id).toContain(id);
    }
  });
});
