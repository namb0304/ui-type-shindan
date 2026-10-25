import { KIT_QUESTIONS } from '../data/kitQuestions';
import { KIT_CATEGORY_LABEL } from '../data/kitTypes';
import type { KitAnswers, KitCategory, KitOption, KitQuestion } from '../data/kitTypes';

/**
 * 第2部の回答から「使う部品」を決める（要件定義書 §9 の `logic/kit.ts`）。
 *
 * 「どっちでもいい」の扱いが、使う場所によって3つに分かれる（要件 §4.2）。
 *   AIに渡す文章      … 行ごと書かない（こだわらない項目として外す）
 *   結果ページの見た目 … Aを既定値として使う
 *   定番UIキットの一覧 … 「どちらでも」と表示する
 * 画面ごとに判断すると、必ずどこかで食い違うので、ここ1か所に集める。
 *
 * 画面に依存しない純粋な関数だけを置く。
 */

/** 1問ぶんの結果。 */
export interface KitChoiceResult {
  question: KitQuestion;
  /** 選んだ部品。「どっちでもいい」なら undefined */
  option?: KitOption;
  /** 「どっちでもいい」を選んだ、または未回答 */
  either: boolean;
}

/** 分類ごとにまとめた結果。 */
export interface KitCategoryGroup {
  category: KitCategory;
  /** 画面に出す分類名（レイアウトなど） */
  label: string;
  items: readonly KitChoiceResult[];
}

/**
 * 全10問ぶんの結果を、出題順で返す。
 *
 * 未回答も「どっちでもいい」として扱う。`?debug=1&type=ARCM` から
 * 直接開いた結果ページには第2部の回答が無いので、そこで落ちないようにする。
 */
export function resolveKit(answers: KitAnswers): readonly KitChoiceResult[] {
  return KIT_QUESTIONS.map((question) => {
    const answer = answers[question.id];
    if (answer === 'a' || answer === 'b') {
      return { question, option: question[answer], either: false };
    }
    return { question, either: true };
  });
}

/** 分類（レイアウト／コンポーネント／アニメーション）ごとにまとめる。 */
export function groupKitByCategory(answers: KitAnswers): readonly KitCategoryGroup[] {
  const groups: KitCategoryGroup[] = [];

  for (const result of resolveKit(answers)) {
    const last = groups[groups.length - 1];
    if (last && last.category === result.question.category) {
      (last.items as KitChoiceResult[]).push(result);
      continue;
    }
    groups.push({
      category: result.question.category,
      label: KIT_CATEGORY_LABEL[result.question.category],
      items: [result],
    });
  }

  return groups;
}

/**
 * 実際に選ばれた部品だけを返す（AIに渡す文章に使う）。
 * 「どっちでもいい」は入らない。
 */
export function chosenKitParts(
  answers: KitAnswers,
): readonly { question: KitQuestion; option: KitOption }[] {
  return resolveKit(answers)
    .filter((result): result is KitChoiceResult & { option: KitOption } => result.option !== undefined)
    .map((result) => ({ question: result.question, option: result.option }));
}

/**
 * 結果ページの見た目に使う部品のid（てんこ盛り化）。
 *
 * 「どっちでもいい」のときはAを既定にする（要件 §4.2）。
 * 見た目は必ずどちらかに決めないと描けないため。
 *
 * @param questionId 'k4' など。無い問題を指定したらエラーにする（打ち間違い対策）
 */
export function kitPartId(answers: KitAnswers, questionId: string): string {
  const question = KIT_QUESTIONS.find((candidate) => candidate.id === questionId);
  if (!question) {
    throw new Error(`第2部にその問題はありません: ${questionId}`);
  }
  const answer = answers[questionId];
  return answer === 'b' ? question.b.id : question.a.id;
}

/** 10問すべてが「どっちでもいい」かどうか（AIに渡す文章で、節ごと出すか決める）。 */
export function hasNoKitPreference(answers: KitAnswers): boolean {
  return chosenKitParts(answers).length === 0;
}
