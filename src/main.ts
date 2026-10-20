import './styles/base.css';

// ステップ1（環境構築）の動作確認用。ステップ5で画面の切り替えに置き換える。
const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = `
    <main class="setup-check">
      <h1>UIタイプ診断</h1>
      <p>環境構築OK（Vite + TypeScript）</p>
    </main>
  `;
}
