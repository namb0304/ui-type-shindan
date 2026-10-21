import { describe, expect, it } from 'vitest';

import { hasPreview } from './components/previews';
import { FALLBACK_SUBJECT, missingSubjects, resolveSubject } from './components/previews/fallback';
import { QUESTIONS, TOTAL_QUESTIONS } from './data/questions';
import type { AnswerValue } from './data/types';
import { calcResult } from './logic/score';
import type { DiagnosisState } from './state';
import {
  answer,
  backFromResult,
  canGoBack,
  createInitialState,
  currentQuestion,
  goBack,
  isComplete,
  progress,
  restart,
  sidesInDisplayOrder,
  start,
} from './state';

/** 乱数を固定して、表示順の入れ替えを決め打ちにする。 */
const alwaysSwap = () => 0.1;
const neverSwap = () => 0.9;

/** 全問同じ側を選んで最後まで進める。 */
function answerAll(value: AnswerValue, random = neverSwap): DiagnosisState {
  let state = start(createInitialState(random));
  for (let i = 0; i < TOTAL_QUESTIONS; i += 1) {
    state = answer(state, value);
  }
  return state;
}

describe('画面の遷移', () => {
  it('最初はトップ', () => {
    const state = createInitialState(neverSwap);
    expect(state.screen).toBe('top');
    expect(state.index).toBe(0);
    expect(state.answers).toEqual({});
  });

  it('開始すると1問目の質問になる', () => {
    const state = start(createInitialState(neverSwap));
    expect(state.screen).toBe('question');
    expect(progress(state)).toEqual({ current: 1, total: 12 });
    expect(currentQuestion(state).id).toBe('q1');
  });

  it('回答すると次の問題へ進む', () => {
    let state = start(createInitialState(neverSwap));
    state = answer(state, 'left');
    expect(state.screen).toBe('question');
    expect(currentQuestion(state).id).toBe('q2');
    expect(state.answers.q1).toBe('left');
  });

  it('12問目に回答すると結果画面になる', () => {
    const state = answerAll('left');
    expect(state.screen).toBe('result');
    expect(isComplete(state)).toBe(true);
    expect(Object.keys(state.answers)).toHaveLength(TOTAL_QUESTIONS);
  });

  it('結果画面から最後の問題に戻れる', () => {
    const state = backFromResult(answerAll('left'));
    expect(state.screen).toBe('question');
    expect(currentQuestion(state).id).toBe('q12');
  });

  it('もう一度診断するとトップに戻り、回答が消える', () => {
    const state = restart(neverSwap);
    expect(state.screen).toBe('top');
    expect(state.answers).toEqual({});
  });
});

describe('戻るボタン', () => {
  it('1問目では戻れない', () => {
    const state = start(createInitialState(neverSwap));
    expect(canGoBack(state)).toBe(false);
    expect(goBack(state)).toBe(state);
  });

  it('2問目以降は1つ前に戻れる', () => {
    let state = start(createInitialState(neverSwap));
    state = answer(state, 'left');
    expect(canGoBack(state)).toBe(true);
    state = goBack(state);
    expect(currentQuestion(state).id).toBe('q1');
  });

  it('戻って回答を変えると結果に反映される', () => {
    // まず全問「左」で回答 → DFCG
    let state = answerAll('left');
    expect(calcResult(state.answers).code).toBe('DFCG');

    // 最後の問題に戻り、文字軸の回答を「右」に変える
    state = backFromResult(state);
    expect(currentQuestion(state).axis).toBe('font');
    state = answer(state, 'right');

    // 文字軸は3問中1問だけ右なので2点（33%）。文字はGのまま
    expect(calcResult(state.answers).points.font).toBe(2);
    expect(calcResult(state.answers).code).toBe('DFCG');
  });

  it('戻って回答を変えるとタイプコードが変わる（50%を超えたとき）', () => {
    let state = answerAll('left');

    // 文字軸の3問（q4・q8・q12）のうち2問を「右」に変える → 4点（67%）
    state = { ...state, screen: 'question', index: 3 };
    state = answer(state, 'right'); // q4
    state = { ...state, index: 7 };
    state = answer(state, 'right'); // q8

    expect(calcResult(state.answers).points.font).toBe(4);
    expect(calcResult(state.answers).code).toBe('DFCM');
  });

  it('「どっちも同じ」では50%止まりなので、文字は左側のまま', () => {
    let state = answerAll('left');

    // 文字軸の3問すべてを「どっちも同じ」にする → 3点（ちょうど50%）
    for (const index of [3, 7, 11]) {
      state = { ...state, screen: 'question', index };
      state = answer(state, 'either');
    }

    expect(calcResult(state.answers).points.font).toBe(3);
    expect(calcResult(state.answers).code).toBe('DFCG');
  });

  it('答え直しても回答数は増えない（上書きになる）', () => {
    let state = start(createInitialState(neverSwap));
    state = answer(state, 'left');
    state = goBack(state);
    state = answer(state, 'right');
    expect(state.answers.q1).toBe('right');
    expect(Object.keys(state.answers)).toHaveLength(1);
  });
});

describe('A/Bの表示順（位置による偏りの対策）', () => {
  it('乱数に応じて左右が入れ替わる', () => {
    const normal = createInitialState(neverSwap);
    const swapped = createInitialState(alwaysSwap);
    const question = QUESTIONS[0];

    expect(sidesInDisplayOrder(normal, question)).toEqual(['left', 'right']);
    expect(sidesInDisplayOrder(swapped, question)).toEqual(['right', 'left']);
  });

  it('戻っても並びが変わらない', () => {
    let state = start(createInitialState(() => (Math.random() < 0.5 ? 0.1 : 0.9)));
    const first = sidesInDisplayOrder(state, currentQuestion(state));

    state = answer(state, 'left');
    state = goBack(state);

    expect(sidesInDisplayOrder(state, currentQuestion(state))).toEqual(first);
  });

  it('12問すべてに表示順が決まっている', () => {
    const state = createInitialState(neverSwap);
    for (const question of QUESTIONS) {
      expect(state.swapped[question.id], question.id).toBeTypeOf('boolean');
    }
  });

  it('表示順を入れ替えても判定結果は変わらない（意味ベースで記録しているため）', () => {
    expect(calcResult(answerAll('right', alwaysSwap).answers).code).toBe(
      calcResult(answerAll('right', neverSwap).answers).code,
    );
  });
});

describe('通しで診断できる', () => {
  it('全問左なら DFCG、全問右なら ARPM', () => {
    expect(calcResult(answerAll('left').answers).code).toBe('DFCG');
    expect(calcResult(answerAll('right').answers).code).toBe('ARPM');
  });

  it('全問「どっちも同じ」でも最後まで進み、結果が出る', () => {
    const state = answerAll('either');
    expect(state.screen).toBe('result');
    expect(calcResult(state.answers).code).toBe('DFCG');
    for (const score of calcResult(state.answers).scores) {
      expect(score.rightPoints).toBe(3);
    }
  });

  it('「どっちも同じ」を選んでも次の問題へ進む', () => {
    let state = start(createInitialState(neverSwap));
    state = answer(state, 'either');
    expect(currentQuestion(state).id).toBe('q2');
    expect(state.answers.q1).toBe('either');
  });

  it('12問すべてに部品（または代用）があり、最後まで進める', () => {
    let state = start(createInitialState(neverSwap));
    for (let i = 0; i < TOTAL_QUESTIONS; i += 1) {
      const question = currentQuestion(state);
      expect(() => resolveSubject(question.subject), question.id).not.toThrow();
      state = answer(state, i % 2 === 0 ? 'left' : 'right');
    }
    expect(state.screen).toBe('result');
  });
});

describe('部品の代用（ステップ6までの暫定措置）', () => {
  it('部品が無い題材すべてに代用先がある', () => {
    for (const subject of missingSubjects()) {
      expect(FALLBACK_SUBJECT[subject], subject).toBeDefined();
    }
  });

  it('代用先はすべて実在する部品', () => {
    for (const fallback of Object.values(FALLBACK_SUBJECT)) {
      expect(hasPreview(fallback), fallback).toBe(true);
    }
  });

  it('代用表に、存在しない題材が混ざっていない', () => {
    const subjects = new Set(QUESTIONS.map((question) => question.subject));
    for (const subject of Object.keys(FALLBACK_SUBJECT)) {
      expect(subjects, subject).toContain(subject);
    }
  });

  it('部品がある題材はそのまま、無い題材は代用になる', () => {
    expect(resolveSubject('cafe-menu')).toEqual({ subject: 'cafe-menu', isFallback: false });
    expect(resolveSubject('news-headline')).toEqual({ subject: 'cafe-menu', isFallback: true });
  });

  it('部品を作れば代用が自動で外れる（hasPreview が判断している）', () => {
    for (const preview of ['cafe-menu', 'music-player', 'weather-app']) {
      expect(resolveSubject(preview).isFallback).toBe(false);
    }
  });
});
