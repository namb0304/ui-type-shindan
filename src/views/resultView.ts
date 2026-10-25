import { createConfirmPanel } from '../components/confirmPanel';
import type { ConfirmVariant } from '../components/confirmPanel';
import { createCopyButton } from '../components/copyButton';
import { prefersReducedMotion } from '../components/kit';
import { createPreview, RESULT_PREVIEW_SUBJECTS } from '../components/previews';
import { createResultLoading, REVEAL_DELAY_MS } from '../components/resultLoading';
import type { LoadingVariant } from '../components/resultLoading';
import { createResultNotice } from '../components/resultNotice';
import type { NoticeVariant } from '../components/resultNotice';
import { createShopPhoto } from '../components/shopPhoto';
import { createSwitcher } from '../components/switcher';
import type { SwitcherVariant } from '../components/switcher';
import { AXES, getAxis } from '../data/axes';
import type { KitAnswers } from '../data/kitTypes';
import { getTrait } from '../data/traits';
import { getTypeInfo } from '../data/typeInfos';
import type { AxisScore, DiagnosisResult, TypeInfo } from '../data/types';
import { calcAffinity } from '../logic/affinity';
import { kitPartId } from '../logic/kit';
import { buildPrompt, buildTokenBlock } from '../logic/prompt';
import { sideOf, toPercent } from '../logic/score';
import { buildTypeSummaryParts } from '../logic/summary';
import { applyTheme, buildResultTheme } from '../logic/theme';
import { button, el } from './dom';
import type { View } from './dom';
import { renderKitResult } from './kitResult';

export interface ResultHandlers {
  onRestart: () => void;
  onBack: () => void;
}

/**
 * 結果ページのてんこ盛り化で使う部品（要件 §5）。
 *
 * 第2部の回答から決める。「どっちでもいい」はAが既定（logic/kit.ts）。
 */
interface KitParts {
  /** K4：コピーしたときのお知らせ */
  notice: NoticeVariant;
  /** K2：定番UIキットの並べ方 */
  list: 'list' | 'card';
  /** K7：AIに渡す文章とCSSの数値の切り替え */
  switcher: SwitcherVariant;
  /** K5：もう一度診断するときの確認 */
  confirm: ConfirmVariant;
  /** K9：ページ全体の動きの長さ */
  duration: string;
  /** K10：結果ページが出てくるときの出方 */
  transition: 'slide' | 'fade';
  /** K6：発表のあいだの待たせ方 */
  loading: LoadingVariant;
}

/**
 * K9（動きの速さ）の長さ。質問画面のデモと同じ値にそろえる。
 * 「どっちでもいい」はニュートラル（0.25秒）のまま。
 */
const DURATIONS: Readonly<Record<string, string>> = {
  snappy: '0.15s',
  soft: '0.35s',
};

function resolveParts(answers: KitAnswers): KitParts {
  // K9 だけは「どっちでもいい」をAに寄せない。
  // 速さは好みが無いならニュートラルが正解で、Aに寄せる理由がない
  const speed = answers.k9 === 'a' ? 'snappy' : answers.k9 === 'b' ? 'soft' : 'neutral';

  return {
    notice: kitPartId(answers, 'k4') === 'banner' ? 'banner' : 'toast',
    list: kitPartId(answers, 'k2') === 'card' ? 'card' : 'list',
    switcher: kitPartId(answers, 'k7') === 'tabs' ? 'tabs' : 'segmented',
    confirm: kitPartId(answers, 'k5') === 'bottom-sheet' ? 'sheet' : 'modal',
    duration: DURATIONS[speed] ?? '0.25s',
    transition: kitPartId(answers, 'k10') === 'fade' ? 'fade' : 'slide',
    loading: kitPartId(answers, 'k6') === 'spinner' ? 'spinner' : 'skeleton',
  };
}

/**
 * 結果画面（要件定義書 §5-4）。
 *
 * この画面の見せ場は、ページ全体がそのタイプのテーマに変わること。
 * 演出は「看板が灯る」一度きりに絞り、それ以外は静かに積む。
 * CSS変数は画面のルート要素に適用する。画面を作り直せば消えるので、
 * 他の画面にテーマが残らない。
 */
export function renderResult(
  result: DiagnosisResult,
  handlers: ResultHandlers,
  kitAnswers: KitAnswers = {},
): View {
  const info = getTypeInfo(result.code);
  const vars = buildResultTheme(result.scores);
  const parts = resolveParts(kitAnswers);

  const screen = el('main', 'screen screen--result');
  applyTheme(screen, vars);

  /*
   * K9（動きの速さ）。ページ全体の動きの長さを決める。
   *
   * --kit-duration に入れる。--duration に入れると、デモの中（kit.css が
   * --duration を自分で定義し直している）まで届かない。
   * K9 のデモだけは data-speed で自分の速さを持つので、ここに引きずられない。
   */
  screen.style.setProperty('--kit-duration', parts.duration);
  screen.style.setProperty('--duration', parts.duration);

  // K10（画面の切り替わり）。結果ページが出てくるときの出方
  screen.dataset.transition = parts.transition;

  // コピーしたことを知らせる相手。第2部で選んだ出し方で出す（K4・P0）
  const notice = createResultNotice(parts.notice);
  const kit = renderKitResult(kitAnswers, vars, parts.list);

  // もう一度診断するときの確認（K5）。結果が消えるので1回受け止める
  const confirm = createConfirmPanel(parts.confirm, {
    title: 'もう一度診断しますか？',
    note: 'いまの結果は消えます。',
    confirmLabel: '診断しなおす',
    cancelLabel: 'やめる',
    onConfirm: handlers.onRestart,
  });

  // ファーストビューより下。発表が終わるまでは出さない
  const below = [
    renderTraits(result.scores),
    renderAxes(result.scores),
    renderPreviews(result),
    kit.element,
    renderAffinity(result),
    renderPrompt(result, kitAnswers, notice.show, parts.switcher),
    renderFooter({ onRestart: confirm.open, onBack: handlers.onBack }),
  ];

  /*
   * K6（読み込み中の見せ方）。
   *
   * 発表のあいだ、下の本文の代わりに待たせ方を出す。
   * 動きを減らす設定のときは発表そのものが無い（base.css）ので、
   * 待たせずにそのまま本文を出す。
   */
  const reveals = !prefersReducedMotion();
  const loading = reveals ? createResultLoading(parts.loading) : undefined;
  if (loading) {
    for (const section of below) section.hidden = true;
  }

  screen.append(
    renderHero(result, info),
    ...(loading ? [loading] : []),
    ...below,
    notice.element,
    ...confirm.elements,
  );

  let revealTimer: number | undefined;

  return {
    element: screen,
    mounted() {
      // 入ってから付ける。付いた状態で挿すと、出入りの動きが始まらない
      requestAnimationFrame(() => {
        screen.dataset.entered = 'true';
      });

      if (!loading) return;
      revealTimer = window.setTimeout(() => {
        loading.remove();
        for (const section of below) section.hidden = false;
      }, REVEAL_DELAY_MS);
    },
    destroy() {
      window.clearTimeout(revealTimer);
      kit.destroy();
      notice.destroy();
      confirm.destroy();
    },
  };
}


/**
 * 1〜3. ファーストビュー（写真・発表演出・店名・説明文・ひとこと）。
 *
 * 開いた瞬間に「どういう場所か」が伝わることを狙う、この画面の主役。
 *
 * 同じ写真を2回使う。
 *   背景 … 大きくぼかして画面全体に敷く。左右に空白を作らないため
 *   前景 … 縦長の枠にくっきり出す。切らずに見せるため
 * 同じURLなので、読み込みは1枚ぶんで済む。
 *
 * 文字はぼかした背景の上に乗るので、テーマ色のパネル（--panel-scrim）を敷く。
 * 背後が真っ黒な写真でも 4.5:1 を保てる濃さにしてある（theme.test.ts で検証）。
 */
function renderHero(result: DiagnosisResult, info: TypeInfo): HTMLElement {
  const hero = el('header', 'hero');

  // 画面全体に敷くぼかし背景。写真が無いタイプは wash だけが残る
  const backdrop = el('div', 'hero__backdrop');
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.append(
    el('span', 'hero__wash'),
    createShopPhoto(result.code, { className: 'hero__blur' }),
    el('span', 'hero__backdrop-tint'),
  );

  // くっきり出す写真
  const photo = el('div', 'hero__photo');
  photo.setAttribute('aria-hidden', 'true');
  photo.append(createShopPhoto(result.code), el('span', 'hero__tint'));

  // 文字（テーマ色のパネルの上）
  const body = el('div', 'hero__body');

  const reveal = el('div', 'hero__reveal');
  const meta = el('p', 'hero__meta');
  meta.append(el('span', 'hero__suffix', 'タイプ'), el('span', 'hero__code', result.code));
  reveal.append(el('h1', 'hero__shop', `『${info.shop}』`), meta);

  // 区切りごとに包み、言葉の途中で改行されないようにする
  const summary = el('p', 'hero__summary');
  for (const part of buildTypeSummaryParts(result.scores)) {
    summary.append(el('span', 'hero__summary-part', part));
  }

  const after = el('div', 'hero__after');
  after.append(summary, el('p', 'hero__quip', info.quip));

  body.append(el('p', 'hero__lead', 'あなたのデザインの好みは……'), reveal, after);

  const layout = el('div', 'hero__layout');
  layout.append(photo, body);

  hero.append(backdrop, layout);
  return hero;
}

/** 4. UIあるある（軸ごとに1つ、計4つ） */
function renderTraits(scores: readonly AxisScore[]): HTMLElement {
  const block = el('section', 'result__after result__block');
  block.append(el('h2', 'result__heading', 'あなたのデザインあるある'));

  const list = el('ul', 'traits');
  for (const axis of AXES) {
    const score = scores.find((candidate) => candidate.axis === axis.id);
    if (!score) continue;
    list.append(el('li', 'traits__item', getTrait(axis.id, sideOf(score))));
  }

  block.append(list);
  return block;
}

/** 5. 4軸の割合バー */
function renderAxes(scores: readonly AxisScore[]): HTMLElement {
  const block = el('section', 'result__after result__block');
  block.append(el('h2', 'result__heading', '4つの好みの傾向'));

  const list = el('ul', 'axes');
  for (const axis of AXES) {
    const score = scores.find((candidate) => candidate.axis === axis.id);
    if (!score) continue;

    const rightPercent = toPercent(score.rightRatio);
    const leftPercent = 100 - rightPercent;
    const side = sideOf(score);
    const isRight = side === 'right';

    const row = el('li', 'axis');
    const labels = el('div', 'axis__labels');

    // タイプコードの文字は、バー側（内側）を向くように添える
    const leftLabel = el('span', `axis__side${side === 'left' ? ' axis__side--on' : ''}`);
    leftLabel.append(
      el('span', 'axis__side-name', `${axis.left.name}（${leftPercent}%）`),
      letterChip(axis.left.letter, axis.left.englishName),
    );

    const rightLabel = el('span', `axis__side${isRight ? ' axis__side--on' : ''}`);
    rightLabel.append(
      letterChip(axis.right.letter, axis.right.englishName),
      el('span', 'axis__side-name', `${axis.right.name}（${rightPercent}%）`),
    );

    labels.append(leftLabel, el('span', 'axis__name', axis.label), rightLabel);

    const track = el('div', 'axis__track');
    const fill = el('span', 'axis__fill');
    fill.style.width = `${isRight ? rightPercent : leftPercent}%`;
    if (!isRight) fill.classList.add('axis__fill--left');
    track.append(fill);

    row.append(labels, track);
    list.append(row);
  }

  block.append(list);
  return block;
}

/** タイプコードの文字と、その略（D = Dense）を小さく添える */
function letterChip(letter: string, englishName: string): HTMLElement {
  const chip = el('span', 'axis__letter');
  chip.append(
    el('span', 'axis__letter-code', letter),
    el('span', 'axis__letter-name', `= ${englishName}`),
  );
  return chip;
}

/** 6. あなた専用UIのプレビュー */
function renderPreviews(result: DiagnosisResult): HTMLElement {
  const block = el('section', 'result__after result__block');
  block.append(
    el('h2', 'result__heading', 'あなた好みのデザイン見本'),
    el('p', 'result__sub', '質問に出てきた画面を、あなたの好みに合わせて作り直しました。'),
  );

  const grid = el('div', 'result__previews');
  const vars = buildResultTheme(result.scores);
  for (const subject of RESULT_PREVIEW_SUBJECTS) {
    grid.append(createPreview(subject, vars));
  }

  block.append(grid);
  return block;
}

/** 7. 場所の相性 */
function renderAffinity(result: DiagnosisResult): HTMLElement {
  const block = el('section', 'result__after result__block');
  block.append(el('h2', 'result__heading', '場所の相性'));

  const affinity = calcAffinity(result.code, result.scores);
  const axis = getAxis(affinity.flippedAxis);

  const grid = el('div', 'affinity');
  grid.append(
    affinityCard(
      '気が合う場所',
      affinity.match,
      `いちばん迷ったのは「${axis.label}」。そこが逆なだけなので、たぶん話は合います`,
    ),
    affinityCard(
      'たぶん落ち着かない場所',
      affinity.clash,
      '4つの軸すべてが逆。見ているところが違うだけで、どちらが良いわけでもありません',
    ),
  );

  block.append(grid);
  return block;
}

function affinityCard(title: string, code: string, note: string): HTMLElement {
  const card = el('div', 'affinity__card');
  card.append(
    el('p', 'affinity__title', title),
    el('p', 'affinity__shop', `『${getTypeInfo(code).shop}』`),
    el('p', 'affinity__code', code),
    el('p', 'affinity__note', note),
  );
  return card;
}

/**
 * 8. AIに渡す文章と、CSSの数値。
 *
 * 2つを切り替えて見せる。切り替えの部品はK7の答えで変わる（てんこ盛り化）。
 *
 * 「デザイントークン」とは呼ばない。開発の知識がない人に通じないので、
 * 「CSSの数値（開発者向け）」と書いて、誰に向けたものかを先に示す。
 */
function renderPrompt(
  result: DiagnosisResult,
  kitAnswers: KitAnswers,
  notify: (message: string) => void,
  switcherVariant: SwitcherVariant,
): HTMLElement {
  const block = el('section', 'result__after result__block');

  const prompt = buildPrompt(result, kitAnswers);
  const tokens = buildTokenBlock(result);

  const promptPanel = el('div', 'prompt__panel');
  const promptBody = el('pre', 'prompt__body', prompt);
  promptBody.tabIndex = 0;
  promptPanel.append(
    el(
      'p',
      'result__sub',
      'ChatGPTなどのAIにこの文章を貼り付けると、あなた好みの見た目で画面を作ってくれます。',
    ),
    promptBody,
  );

  const tokenPanel = el('div', 'prompt__panel');
  const tokenBody = el('pre', 'prompt__body', tokens);
  tokenBody.tabIndex = 0;
  tokenPanel.append(
    el('p', 'result__sub', 'CSSにそのまま貼り付けて使えます。'),
    tokenBody,
  );

  // コピーボタンは1つにして、いま見ているほうをコピーする。
  // 2つ置くと、どちらが何をコピーするのか分かりにくい
  let showingTokens = false;
  const copy = createCopyButton({
    getText: () => (showingTokens ? tokens : prompt),
    selectTarget: () => (showingTokens ? tokenBody : promptBody),
    label: '文章をコピー',
    notify,
  });

  const switcher = createSwitcher(
    switcherVariant,
    [
      { label: 'AIに渡す文章', element: promptPanel },
      { label: 'CSSの数値（開発者向け）', element: tokenPanel },
    ],
    (index) => {
      showingTokens = index === 1;
      copy.textContent = showingTokens ? '数値をコピー' : '文章をコピー';
    },
  );

  const head = el('div', 'result__heading-row');
  head.append(el('h2', 'result__heading result__heading--flush', 'AIに頼むための文章'), copy);

  block.append(head, switcher.element);
  return block;
}

/** 9. 注記と、もう一度診断する */
function renderFooter(handlers: ResultHandlers): HTMLElement {
  const block = el('section', 'result__after result__footer');

  const actions = el('div', 'result__actions');
  actions.append(
    button('btn btn--primary', 'もう一度診断する', handlers.onRestart),
    button('btn btn--ghost', '← 最後の問題にもどる', handlers.onBack),
  );

  block.append(
    actions,
    el(
      'p',
      'result__disclaimer',
      '遊びの診断です。科学的な根拠はありません。答えた内容はこの端末の中だけで、どこにも送られません。',
    ),
  );
  return block;
}
