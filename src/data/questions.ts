import type { Question } from './types';

/**
 * 12問の定義（要件定義書 §4）。
 *
 * - 同じ軸が連続しないよう、情報量 → 装飾 → トーン → 文字 の順で3周させる
 * - 比べる2つのUIは、測る軸だけが違い、他の3軸はニュートラル値で同じにする
 * - 問題ごとに題材（subject）を変え、場面が偏らないようにする
 * - 質問文は全問共通で「どっちが好き？」
 */
export const QUESTIONS = [
  // 1周目
  { id: 'q1', axis: 'density', subject: 'cafe-menu', label: 'カフェのメニュー' },
  { id: 'q2', axis: 'decoration', subject: 'music-player', label: '音楽プレイヤー' },
  { id: 'q3', axis: 'tone', subject: 'weather-app', label: '天気アプリ' },
  { id: 'q4', axis: 'font', subject: 'news-headline', label: 'ニュース記事の見出し' },
  // 2周目
  { id: 'q5', axis: 'density', subject: 'product-card', label: 'ECの商品カード' },
  { id: 'q6', axis: 'decoration', subject: 'login-form', label: 'ログイン画面' },
  { id: 'q7', axis: 'tone', subject: 'todo-list', label: 'ToDoリスト' },
  { id: 'q8', axis: 'font', subject: 'profile-card', label: 'プロフィールカード' },
  // 3周目
  { id: 'q9', axis: 'density', subject: 'timetable', label: '大学の時間割' },
  { id: 'q10', axis: 'decoration', subject: 'notification-list', label: '通知一覧' },
  { id: 'q11', axis: 'tone', subject: 'social-post', label: 'SNSの投稿' },
  { id: 'q12', axis: 'font', subject: 'event-banner', label: 'イベント告知' },
] as const satisfies readonly Question[];

/** 全体の問題数。進捗バーの分母に使う。 */
export const TOTAL_QUESTIONS = QUESTIONS.length;
