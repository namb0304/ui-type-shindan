import { describe, expect, it } from 'vitest';

import { hasPreview, PREVIEWS } from './components/previews';
import { FALLBACK_SUBJECT, missingSubjects, resolveSubject } from './components/previews/fallback';
import { KIT_QUESTIONS, TOTAL_KIT_QUESTIONS } from './data/kitQuestions';
import type { KitAnswerValue } from './data/kitTypes';
import { QUESTIONS, TOTAL_QUESTIONS } from './data/questions';
import { estimatedMinutes, SECONDS_PER_QUESTION, TOTAL_ALL_QUESTIONS } from './data/quiz';
import type { AnswerValue } from './data/types';
import { calcResult } from './logic/score';
import type { DiagnosisState } from './state';
import {
  answer,
  answerKit,
  backFromResult,
  canGoBack,
  canGoBackKit,
  createInitialState,
  currentKitQuestion,
  currentQuestion,
  goBack,
  goBackKit,
  isComplete,
  isKitComplete,
  kitChoicesInDisplayOrder,
  kitProgress,
  overallProgress,
  progress,
  restart,
  sidesInDisplayOrder,
  start,
} from './state';

/** 第2部まで通して答える（第1部 → 第2部）。 */
function answerAllKit(
  kitValue: KitAnswerValue,
  value: AnswerValue = 'left',
  random = neverSwap,
): DiagnosisState {
  let state = answerAll(value, random);
  for (let i = 0; i < TOTAL_KIT_QUESTIONS; i += 1) {
    state = answerKit(state, kitValue);
  }
  return state;
}

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

  it('12問目に回答すると、そのまま第2部の1問目になる', () => {
    const state = answerAll('left');
    expect(state.screen).toBe('kit');
    expect(state.kitIndex).toBe(0);
    expect(isComplete(state)).toBe(true);
    expect(Object.keys(state.answers)).toHaveLength(TOTAL_QUESTIONS);
  });

  it('結果画面から、第2部の最後の問題に戻れる', () => {
    const state = backFromResult(answerAllKit('a'));
    expect(state.screen).toBe('kit');
    expect(currentKitQuestion(state).id).toBe(KIT_QUESTIONS[TOTAL_KIT_QUESTIONS - 1].id);
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
    const state = answerAllKit('either', 'either');
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
    expect(state.screen).toBe('kit');
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
    expect(resolveSubject('timetable')).toEqual({ subject: 'cafe-menu', isFallback: true });
  });

  it('部品を作れば代用が自動で外れる（hasPreview が判断している）', () => {
    for (const preview of PREVIEWS) {
      expect(resolveSubject(preview.subject).isFallback, preview.subject).toBe(false);
      expect(FALLBACK_SUBJECT[preview.subject], preview.subject).toBeUndefined();
    }
  });
});

describe('第2部（定番UIキット）', () => {
  it('第1部から切れ目なく続く', () => {
    const state = answerAll('left');
    expect(state.screen).toBe('kit');
    expect(currentKitQuestion(state).id).toBe(KIT_QUESTIONS[0].id);
  });

  it('最後の問題に回答すると結果画面になる', () => {
    const state = answerAllKit('a');
    expect(state.screen).toBe('result');
    expect(isKitComplete(state)).toBe(true);
    expect(Object.keys(state.kitAnswers)).toHaveLength(TOTAL_KIT_QUESTIONS);
  });

  it('「どっちでもいい」を選んでも次の問題へ進む', () => {
    let state = answerAll('left');
    state = answerKit(state, 'either');
    expect(state.kitAnswers[KIT_QUESTIONS[0].id]).toBe('either');
    expect(currentKitQuestion(state).id).toBe(KIT_QUESTIONS[1].id);
  });

  it('1問目から戻ると第1部の最後の問題に出る', () => {
    const state = goBackKit(answerAll('left'));
    expect(state.screen).toBe('question');
    expect(currentQuestion(state).id).toBe('q12');
  });

  it('2問目から戻ると1問目に出る', () => {
    let state = answerAll('left');
    state = answerKit(state, 'a');
    state = goBackKit(state);
    expect(state.screen).toBe('kit');
    expect(currentKitQuestion(state).id).toBe(KIT_QUESTIONS[0].id);
  });

  it('戻って選び直せる', () => {
    let state = answerAll('left');
    state = answerKit(state, 'a');
    state = goBackKit(state);
    state = answerKit(state, 'b');
    expect(state.kitAnswers[KIT_QUESTIONS[0].id]).toBe('b');
  });

  it('第2部ではいつでも戻れる（1問目でも）', () => {
    expect(canGoBackKit(answerAll('left'))).toBe(true);
  });

  it('進捗が1始まりで出る', () => {
    const state = answerAll('left');
    expect(kitProgress(state)).toEqual({ current: 1, total: TOTAL_KIT_QUESTIONS });
  });

  it('表示順は問題ごとに決まり、戻っても変わらない', () => {
    const question = KIT_QUESTIONS[0];
    const normal = createInitialState(neverSwap);
    const swapped = createInitialState(alwaysSwap);

    expect(kitChoicesInDisplayOrder(normal, question)).toEqual(['a', 'b']);
    expect(kitChoicesInDisplayOrder(swapped, question)).toEqual(['b', 'a']);
  });

  it('すべての問題に表示順が決まっている', () => {
    const state = createInitialState(neverSwap);
    for (const question of KIT_QUESTIONS) {
      expect(state.kitSwapped[question.id], question.id).toBeTypeOf('boolean');
    }
  });

  it('第2部の回答を変えても、タイプコードと割合が変わらない（判定に混ざっていない）', () => {
    const a = answerAllKit('a', 'right');
    const b = answerAllKit('b', 'right');
    const either = answerAllKit('either', 'right');

    expect(calcResult(a.answers)).toEqual(calcResult(b.answers));
    expect(calcResult(a.answers)).toEqual(calcResult(either.answers));
    expect(calcResult(a.answers).code).toBe('ARPM');
  });

  it('もう一度診断すると第2部の回答も消える', () => {
    const state = start(answerAllKit('a'));
    expect(state.kitAnswers).toEqual({});
    expect(state.kitIndex).toBe(0);
  });

  it('第1部と第2部で、回答の入れ物が分かれている', () => {
    const state = answerAllKit('a');
    for (const question of QUESTIONS) {
      expect(state.kitAnswers[question.id], question.id).toBeUndefined();
    }
    for (const question of KIT_QUESTIONS) {
      expect(state.answers[question.id], question.id).toBeUndefined();
    }
  });
});

describe('通しの進捗（ひと休み画面を廃止したあと）', () => {
  it('第1部の1問目が 1 / 全体', () => {
    const state = start(createInitialState(neverSwap));
    expect(overallProgress(state)).toEqual({ current: 1, total: TOTAL_ALL_QUESTIONS });
  });

  it('第1部の最後が 12 / 全体', () => {
    let state = start(createInitialState(neverSwap));
    for (let i = 0; i < TOTAL_QUESTIONS - 1; i += 1) state = answer(state, 'left');
    expect(overallProgress(state).current).toBe(TOTAL_QUESTIONS);
  });

  it('第2部に入っても数字が戻らない（12の次が13）', () => {
    const state = answerAll('left');
    expect(state.screen).toBe('kit');
    expect(overallProgress(state).current).toBe(TOTAL_QUESTIONS + 1);
  });

  it('第2部の最後が、全体の問題数と一致する', () => {
    let state = answerAll('left');
    for (let i = 0; i < TOTAL_KIT_QUESTIONS - 1; i += 1) state = answerKit(state, 'a');
    expect(overallProgress(state)).toEqual({
      current: TOTAL_ALL_QUESTIONS,
      total: TOTAL_ALL_QUESTIONS,
    });
  });

  it('進捗が1ずつ増え、戻ると1ずつ減る（通して一本になっている）', () => {
    let state = start(createInitialState(neverSwap));
    const forward: number[] = [];
    for (let i = 0; i < TOTAL_ALL_QUESTIONS - 1; i += 1) {
      forward.push(overallProgress(state).current);
      state = state.screen === 'kit' ? answerKit(state, 'a') : answer(state, 'left');
    }
    forward.push(overallProgress(state).current);
    expect(forward).toEqual(forward.map((_, i) => i + 1));

    // 第2部の1問目まで戻ると、第1部の12問目に出る
    while (state.screen === 'kit' && state.kitIndex > 0) state = goBackKit(state);
    state = goBackKit(state);
    expect(state.screen).toBe('question');
    expect(overallProgress(state).current).toBe(TOTAL_QUESTIONS);
  });
});

describe('トップに出す分量（データから数える）', () => {
  it('問題数は第1部と第2部の合計', () => {
    expect(TOTAL_ALL_QUESTIONS).toBe(TOTAL_QUESTIONS + TOTAL_KIT_QUESTIONS);
  });

  it('所要時間は問題数から計算し、切り上げる', () => {
    expect(estimatedMinutes()).toBe(
      Math.max(1, Math.ceil((TOTAL_ALL_QUESTIONS * SECONDS_PER_QUESTION) / 60)),
    );
    expect(estimatedMinutes()).toBeGreaterThan(0);
  });
});
