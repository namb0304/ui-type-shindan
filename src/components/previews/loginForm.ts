import type { PreviewComponent } from './types';

/**
 * ログイン画面（Q6・装飾）。
 *
 * 装飾の差は「面の見せ方」で出るので、性格の違う面を3つ置いている。
 *   入力欄2つ … へこんだ面（枠線 ⇄ やわらかい影）
 *   ボタン    … 出っぱった面（ベタ塗り ⇄ グラデと影）
 *
 * 面にならない行（店名の行・「ログイン状態を保つ」の行）は落としてある。
 * 装飾の軸は上下2つの高さが同じになるので、1行の高さがそのまま2倍効き、
 * 並べて見比べられなくなるため。店名は見出しに入れて1行にまとめた。
 *
 * メールは example.com（説明用に予約されたドメイン）。店名・人名は架空。
 */
export const loginForm: PreviewComponent = {
  subject: 'login-form',
  label: 'ログイン画面',
  render: () => `
    <article class="pv pv-login">
      <h3 class="pv-login__title">湊見ブックスにログイン</h3>
      <div class="pv-login__field">
        <span class="pv-login__label">メールアドレス</span>
        <span class="pv-login__input">nonomura@example.com</span>
      </div>
      <div class="pv-login__field">
        <span class="pv-login__label">パスワード</span>
        <span class="pv-login__input">••••••••</span>
      </div>
      <span class="pv-login__submit">ログイン</span>
    </article>
  `,
};
