import { AXES, getAxis } from '../data/axes';
import type { KitAnswers } from '../data/kitTypes';
import { CSS_VAR_NAMES } from '../data/tokens';
import { getPromptAdvice } from '../data/traits';
import { getTypeInfo } from '../data/typeInfos';
import type { AxisScore, DiagnosisResult } from '../data/types';
import { chosenKitParts } from './kit';
import { sideOf, toPercent } from './score';
import { buildResultTheme } from './theme';

/**
 * AI向けデザインプロンプトの生成（要件定義書 §7）。
 *
 * ブラウザ内で組み立てるだけで、AIのAPIは使わない。
 * 画面に依存しない純粋な関数。
 */

/**
 * 寄り方の強さを表す言葉。
 * 「どっちも同じに見える」が入ったことで割合が7段階になったため、
 * 100%/83% → はっきり、67% → やや、50% → どちらでもない の3段階にしている。
 */
export function strengthOf(score: AxisScore): string {
  const percent = toPercent(score.rightRatio);
  const distance = Math.abs(percent - 50);
  if (distance === 0) return 'どちらでもない';
  return distance >= 33 ? 'はっきり' : 'やや';
}

/** 1つの軸の行。例：「- 情報量：はっきりユッタリ（100%）。余白を広く取り…」 */
function axisLine(score: AxisScore): string {
  const axis = getAxis(score.axis);
  const side = sideOf(score);
  const advice = getPromptAdvice(score.axis, side);

  if (side === 'even') {
    return `- ${axis.label}：どちらでもない（50%）。${advice}`;
  }

  const name = side === 'right' ? axis.right.name : axis.left.name;
  const percent = side === 'right' ? toPercent(score.rightRatio) : 100 - toPercent(score.rightRatio);
  return `- ${axis.label}：${strengthOf(score)}${name}（${percent}%）。${advice}`;
}

/**
 * CSS変数の一覧を :root { } の形にする。
 *
 * 結果ページでは、この文字列だけを単独でコピーできるようにもしている
 * （「CSSの数値」の側）。そのため export している。
 */
export function buildTokenBlock(result: DiagnosisResult): string {
  const vars = buildResultTheme(result.scores);
  const lines = CSS_VAR_NAMES.map((name) => `  ${name}: ${vars[name]};`);
  return [':root {', ...lines, '}'].join('\n');
}

/**
 * 第2部で選んだ部品の行（要件 §7）。
 *
 * 名前と説明は kitQuestions.ts から組み立てる。文章にベタ書きすると、
 * 質問画面に出ている言葉とAIに渡す言葉が食い違う。
 *
 * 「どっちでもいい」の項目は**行ごと書かない**。
 * 「どちらでもよい」と書くと、AIはかえって何か決めようとする。
 */
function kitLines(answers: KitAnswers): readonly string[] {
  return chosenKitParts(answers).map(
    ({ question, option }) => `- ${question.label}：${option.name}（${option.description}）`,
  );
}

/**
 * AI向けプロンプトを組み立てる。
 *
 * @param kitAnswers 第2部の回答。無いときは「使いたいUI部品・動き」を出さない
 */
export function buildPrompt(result: DiagnosisResult, kitAnswers: KitAnswers = {}): string {
  const info = getTypeInfo(result.code);
  const orderedScores = AXES.map((axis) => {
    const score = result.scores.find((candidate) => candidate.axis === axis.id);
    if (!score) {
      throw new Error(`軸 ${axis.id} のスコアがありません`);
    }
    return score;
  });

  const parts = kitLines(kitAnswers);

  return [
    '以下のデザイン方針でUIを作成してください。',
    '',
    `## デザインタイプ：${result.code}（${info.shop}）`,
    ...orderedScores.map(axisLine),
    '',
    '## デザイントークン（CSS変数）',
    buildTokenBlock(result),
    '',
    // 1つも選んでいなければ、この節ごと出さない（要件 §7）
    ...(parts.length > 0 ? ['## 使いたいUI部品・動き', ...parts, ''] : []),
    '## 守ってほしいこと',
    '- 上記のトークン以外の色・フォントを追加しない',
    // 第2部の趣旨（一貫して使える自分の定番）そのものなので、必ず入れる
    '- 上記以外のUI部品を使う場合は、同じ役割の部品を2種類混ぜない',
    '- アクセシビリティ（コントラスト比4.5:1以上、タップ領域44px以上）は好みより優先する',
    '- 読みやすさと使いやすさを損なうなら、上記の方針より使いやすさを優先する',
    '',
  ].join('\n');
}
