import { createDemoFrame, createMemoBar, createTapper, demoButton } from './memoApp';
import { createScheduler } from './scheduler';
import type { KitDemo, KitDemoInstance } from './types';

/**
 * K8 入力ミスの伝え方：その場で出す ／ まとめて出す。
 *
 * 同じフォームに同じ文字を打ち、同じ打ち間違いをする。差が出るのは次の3点。
 *   1. 気づける時 … 打った直後／[送る]を押したあと
 *   2. 出る場所   … 間違えた欄のすぐ下／フォームの上にまとめて
 *   3. 送る回数   … 1回／2回（1回目は送れずに戻される）
 *
 * 打ち間違いは「@のあとが空っぽ」にしてある。見ただけで何が足りないか
 * 分かるうえ、直すのも短く済むので、デモの中で収まる。
 *
 * 動きを止める設定でも、出る場所と押す回数の差はそのまま残る（要件 §4.2）。
 * この問題はアニメーションではなく、知らせる「時」と「場所」の問題なので、
 * 動きが無くても成立する。
 */

/** 本物の入力欄は使わない。この見本では、打つのはデモ自身だけなので */
const WRONG_PART = 'tanaka@';
const FIXED_PART = 'mail.com';

/** 1文字あたりの間。速すぎると打っている感じが出ない */
const TYPE_MS = 85;

const PLAY_LEAD_MS = 400;

/** エラーを出したまま見せる時間。どこに何が出たか読める長さにする */
const ERROR_HOLD_MS = 1400;

/** 送ったあとを見せる時間 */
const SENT_HOLD_MS = 900;

/** ひとことの欄は埋めておく。見るところを宛先だけに絞るため */
const MESSAGE_TEXT = 'あとでかけ直します';

/** 宛先として通る形か。@のあとにドメインがあるかだけを見る */
function isValidAddress(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function formBase(variant: 'inline' | 'summary'): KitDemoInstance {
  const scheduler = createScheduler();
  const tap = createTapper(scheduler);
  const { frame, screen } = createDemoFrame();

  const listeners = new AbortController();
  const { signal } = listeners;

  const app = document.createElement('div');
  app.className = 'memo';
  app.append(createMemoBar('メモ').element);

  const body = document.createElement('div');
  body.className = 'memo__body memo__form';

  // --- まとめて出すほうの置き場（フォームの上） ---
  const summary = document.createElement('div');
  summary.className = 'kit-error-summary';
  summary.setAttribute('role', 'alert');
  summary.innerHTML = `
    <p class="kit-error-summary__title">1か所、直すところがあります</p>
    <p class="kit-error-summary__item">宛先：@のあとを入力してください</p>
  `;
  if (variant === 'summary') body.append(summary);

  // --- 宛先の欄 ---
  const addressField = document.createElement('div');
  addressField.className = 'memo__field';

  const addressLabel = document.createElement('span');
  addressLabel.className = 'memo__label';
  addressLabel.textContent = '宛先';

  // 本物の入力欄にはしない。打つのはデモだけなので、押せる箱で足りる。
  // ボタンにしてあるのは、タップの波紋を出せるようにするため
  const addressInput = document.createElement('button');
  addressInput.type = 'button';
  addressInput.className = 'memo__input';
  addressInput.setAttribute('aria-label', '宛先');

  const addressText = document.createElement('span');
  addressText.className = 'memo__input-text';
  const caret = document.createElement('span');
  caret.className = 'memo__caret';
  caret.setAttribute('aria-hidden', 'true');
  addressInput.append(addressText, caret);

  // --- その場で出すほうの置き場（欄のすぐ下） ---
  const inlineError = document.createElement('p');
  inlineError.className = 'kit-error';
  inlineError.setAttribute('role', 'alert');
  inlineError.textContent = '@のあとを入力してください';

  addressField.append(addressLabel, addressInput);
  if (variant === 'inline') addressField.append(inlineError);

  // --- ひとことの欄（最初から埋まっている） ---
  const messageField = document.createElement('div');
  messageField.className = 'memo__field';
  messageField.innerHTML = `
    <span class="memo__label">ひとこと</span>
    <span class="memo__input memo__input--filled">${MESSAGE_TEXT}</span>
  `;

  body.append(addressField, messageField);
  app.append(body);

  // --- 送ったあとの画面 ---
  const done = document.createElement('div');
  done.className = 'memo__done';
  done.innerHTML = `
    <span class="memo__done-mark" aria-hidden="true"></span>
    <p class="memo__done-text">送りました</p>
  `;
  app.append(done);

  const actions = document.createElement('div');
  actions.className = 'memo__actions';
  const sendButton = demoButton('送る');
  actions.append(sendButton);
  app.append(actions);

  screen.append(app);

  let value = '';
  /** 打っている最中かどうか。カーソルの点滅に使う */
  let editing = false;

  function render(): void {
    addressText.textContent = value;
    frame.dataset.editing = String(editing);
  }

  function showError(): void {
    frame.dataset.invalid = 'true';
  }

  function clearError(): void {
    delete frame.dataset.invalid;
  }

  /**
   * その場で出すほうは、打っている最中にも見る。
   * ただし「@」を打つまでは何も言わない。1文字目から赤くすると、
   * ただ打っているだけで怒られているように見えるため。
   */
  function validateWhileTyping(): void {
    if (variant !== 'inline') return;
    if (!value.includes('@')) {
      clearError();
      return;
    }
    if (isValidAddress(value)) clearError();
    else showError();
  }

  async function type(text: string): Promise<void> {
    editing = true;
    for (const char of text) {
      await scheduler.wait(TYPE_MS);
      if (scheduler.cancelled) return;
      value += char;
      render();
      validateWhileTyping();
    }
  }

  function focusField(): void {
    editing = true;
    render();
  }

  /** 送る。通らなければ、変種ごとの場所にエラーを出す */
  function send(): void {
    editing = false;
    render();
    if (isValidAddress(value)) {
      clearError();
      frame.dataset.sent = 'true';
      return;
    }
    showError();
  }

  sendButton.addEventListener('click', send, { signal });
  addressInput.addEventListener('click', focusField, { signal });

  function reset(): void {
    value = '';
    editing = false;
    clearError();
    delete frame.dataset.sent;
    render();
  }

  reset();

  return {
    element: frame,
    reset,

    /**
     * その場で出す：欄を押す → tanaka@ → **その場で**欄の下に出る
     *                → mail.com を打ち足す → 消える → [送る] → 送れた
     * まとめて出す：欄を押す → tanaka@ → 何も出ない → [送る] → **上にまとめて**出る
     *                → mail.com を打ち足す → まとめは残る → [送る] → 送れた
     */
    async play(): Promise<void> {
      reset();
      await scheduler.wait(PLAY_LEAD_MS);
      if (scheduler.cancelled) return;

      await tap(addressInput, focusField);
      if (scheduler.cancelled) return;

      await type(WRONG_PART);
      if (scheduler.cancelled) return;

      if (variant === 'inline') {
        // もう出ている。読む間をとってから直す
        await scheduler.wait(ERROR_HOLD_MS);
        if (scheduler.cancelled) return;
      } else {
        // 間違えたまま、何も言われない時間
        await scheduler.wait(800);
        if (scheduler.cancelled) return;

        // 押してはじめて、上にまとめて出る
        await tap(sendButton, send);
        if (scheduler.cancelled) return;
        await scheduler.wait(ERROR_HOLD_MS);
        if (scheduler.cancelled) return;
      }

      await type(FIXED_PART);
      if (scheduler.cancelled) return;
      await scheduler.wait(400);
      if (scheduler.cancelled) return;

      await tap(sendButton, send);
      if (scheduler.cancelled) return;

      await scheduler.wait(SENT_HOLD_MS);
      reset();
    },

    destroy(): void {
      scheduler.cancel();
      listeners.abort();
    },
  };
}

export const inlineErrorDemo: KitDemo = {
  id: 'inline-error',
  create: () => formBase('inline'),
};

export const summaryErrorDemo: KitDemo = {
  id: 'summary-error',
  create: () => formBase('summary'),
};
