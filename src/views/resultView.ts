import { createCopyButton } from '../components/copyButton';
import { createPreview, PREVIEWS } from '../components/previews';
import { createShopPhoto } from '../components/shopPhoto';
import { AXES, getAxis } from '../data/axes';
import { getTrait } from '../data/traits';
import { getTypeInfo } from '../data/typeInfos';
import type { AxisScore, DiagnosisResult, TypeInfo } from '../data/types';
import { calcAffinity } from '../logic/affinity';
import { buildPrompt } from '../logic/prompt';
import { sideOf, toPercent } from '../logic/score';
import { buildTypeSummaryParts } from '../logic/summary';
import { applyTheme, buildResultTheme } from '../logic/theme';
import { button, el } from './dom';

export interface ResultHandlers {
  onRestart: () => void;
  onBack: () => void;
}

/**
 * 結果画面（要件定義書 §5-3）。
 *
 * この画面の見せ場は、ページ全体がそのタイプのテーマに変わること。
 * 演出は「看板が灯る」一度きりに絞り、それ以外は静かに積む。
 * CSS変数は画面のルート要素に適用する。画面を作り直せば消えるので、
 * 他の画面にテーマが残らない。
 */
export function renderResult(result: DiagnosisResult, handlers: ResultHandlers): HTMLElement {
  const info = getTypeInfo(result.code);
  const vars = buildResultTheme(result.scores);

  const screen = el('main', 'screen screen--result');
  applyTheme(screen, vars);

  screen.append(
    renderHero(result, info),
    renderTraits(result.scores),
    renderAxes(result.scores),
    renderPreviews(result),
    renderAffinity(result),
    renderPrompt(result),
    renderFooter(handlers),
  );

  return screen;
}

/**
 * 1〜3. ファーストビュー（写真・発表演出・店名・説明文・ひとこと）。
 *
 * 開いた瞬間に「どういうお店か」が伝わることを狙う、この画面の主役。
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
  for (const preview of PREVIEWS) {
    grid.append(createPreview(preview.subject, vars));
  }

  block.append(grid);
  return block;
}

/** 7. お店の相性 */
function renderAffinity(result: DiagnosisResult): HTMLElement {
  const block = el('section', 'result__after result__block');
  block.append(el('h2', 'result__heading', 'お店の相性'));

  const affinity = calcAffinity(result.code, result.scores);
  const axis = getAxis(affinity.flippedAxis);

  const grid = el('div', 'affinity');
  grid.append(
    affinityCard(
      '気が合うお店',
      affinity.match,
      `いちばん迷ったのは「${axis.label}」。そこが逆なだけなので、たぶん話は合います`,
    ),
    affinityCard(
      'たぶん落ち着かないお店',
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

/** 8. AI向けプロンプト */
function renderPrompt(result: DiagnosisResult): HTMLElement {
  const block = el('section', 'result__after result__block');

  const prompt = buildPrompt(result);
  const body = el('pre', 'prompt__body', prompt);
  body.tabIndex = 0;

  const head = el('div', 'result__heading-row');
  head.append(
    el('h2', 'result__heading result__heading--flush', 'AIに頼むための文章'),
    createCopyButton({ getText: () => prompt, selectTarget: body, label: '文章をコピー' }),
  );

  block.append(
    head,
    el(
      'p',
      'result__sub',
      'ChatGPTなどのAIにこの文章を貼り付けると、あなた好みの見た目で画面を作ってくれます。コピーして使ってください。',
    ),
    body,
  );
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
