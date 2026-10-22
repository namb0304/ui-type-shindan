import { QUESTIONS } from '../../data/questions';
import { hasPreview } from './index';

/**
 * 部品がまだ無い題材を、どの部品で代用するかの対応表（ステップ5の暫定措置）。
 *
 * 12問すべてに回答しないと判定できない（score.ts は未回答をエラーにする）ので、
 * 部品が揃うまでは既存の3部品で代用して通しで遊べるようにする。
 *
 * ステップ6で部品を作って PREVIEWS に登録したら、この表から該当行を消す。
 * 消し忘れても previews.test.ts が「代用先が必要な題材」と突き合わせて知らせる。
 *
 * 代用先は、その問題が測る軸の差が見えやすい部品を選んでいる。
 *   文字軸   → 文章量の多いカフェのメニュー
 *   トーン軸 → 色の面積が大きい天気アプリ
 *   装飾軸   → 面と操作部を持つ音楽プレイヤー
 */
export const FALLBACK_SUBJECT: Readonly<Record<string, string>> = {
  // 12題材すべての部品ができたので、代用は1件も無くなった。
  // 題材を増やしたときのために、仕組みだけ残してある。
};

export interface ResolvedSubject {
  /** 実際に描画する題材 */
  subject: string;
  /** 代用かどうか（画面に注記を出すために使う） */
  isFallback: boolean;
}

/**
 * 題材から、実際に描画する部品を決める。
 * 部品があればそのまま、無ければ代用先を返す。
 */
export function resolveSubject(subject: string): ResolvedSubject {
  if (hasPreview(subject)) {
    return { subject, isFallback: false };
  }

  const fallback = FALLBACK_SUBJECT[subject];
  if (!fallback || !hasPreview(fallback)) {
    throw new Error(`部品も代用先もありません: ${subject}`);
  }
  return { subject: fallback, isFallback: true };
}

/** 部品がまだ無い題材の一覧（テストと確認ページで使う）。 */
export function missingSubjects(): string[] {
  return QUESTIONS.map((question) => question.subject).filter(
    (subject) => !hasPreview(subject),
  );
}
