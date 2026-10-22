import type { PreviewComponent } from './types';

/**
 * ToDoリスト（Q7・トーン）。
 *
 * トーンは配色と角丸で差が出るので、角丸の効く部品を多めに置いている。
 *   進み具合のバー・チェックボックス4つ・追加ボタン
 * クールは四角く冷たい寒色、ポップは丸く明るい暖色になる。
 *
 * チェックの印は文字（✓）で描く。画像も図形も使わずに済む。
 *
 * 地名は架空（湊見・桜並）。
 */
export const todoList: PreviewComponent = {
  subject: 'todo-list',
  label: 'ToDoリスト',
  render: () => `
    <article class="pv pv-todo">
      <header class="pv-todo__head">
        <h3 class="pv-todo__title">今日やること</h3>
        <p class="pv-todo__count">2 / 4</p>
      </header>
      <span class="pv-todo__bar" aria-hidden="true">
        <span class="pv-todo__fill"></span>
      </span>
      <ul class="pv-todo__list">
        <li class="pv-todo__item pv-todo__item--done">
          <span class="pv-todo__box pv-todo__box--on" aria-hidden="true">✓</span>
          <span class="pv-todo__text">ゼミの資料を印刷する</span>
        </li>
        <li class="pv-todo__item pv-todo__item--done">
          <span class="pv-todo__box pv-todo__box--on" aria-hidden="true">✓</span>
          <span class="pv-todo__text">湊見図書館に本を返す</span>
        </li>
        <li class="pv-todo__item">
          <span class="pv-todo__box" aria-hidden="true"></span>
          <span class="pv-todo__text">桜並の花屋に電話する</span>
        </li>
        <li class="pv-todo__item">
          <span class="pv-todo__box" aria-hidden="true"></span>
          <span class="pv-todo__text">レポートの下書き</span>
        </li>
      </ul>
      <span class="pv-todo__add">＋ 追加する</span>
    </article>
  `,
};
