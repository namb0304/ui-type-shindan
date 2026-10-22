import type { PreviewComponent } from './types';

/**
 * 大学の時間割（Q9・情報量）。
 *
 * 表はマス目の余白がそのまま効くので、情報量の差が一番素直に出る。
 * 1コマを「科目＋教室」の2行にして、余白と行間の差が二重に効くようにした。
 *
 * 4コマ×5日に抑えてある。コマを増やすとユッタリ側だけが縦に伸びて、
 * 2つを並べて見比べられなくなるため。
 * 列は幅を等分（minmax(0, 1fr)）にして、どの文字サイズでも
 * 横スクロールが出ないようにしている。
 *
 * 大学名・科目・教室はすべて架空。
 */

const DAYS = ['月', '火', '水', '木', '金'] as const;

/** 1コマ。null は空きコマ。 */
type Slot = { subject: string; room: string } | null;

const SLOTS: readonly (readonly Slot[])[] = [
  [
    { subject: '情報', room: 'A301' },
    null,
    { subject: '英語', room: 'B105' },
    null,
    { subject: '体育', room: '体育館' },
  ],
  [
    { subject: '線形', room: 'A301' },
    { subject: '線形', room: 'A301' },
    null,
    { subject: '統計', room: 'C202' },
    null,
  ],
  [
    null,
    { subject: 'UI', room: 'D401' },
    { subject: 'UI', room: 'D401' },
    null,
    { subject: '演習', room: 'E102' },
  ],
  [
    { subject: 'ゼミ', room: '研究室' },
    null,
    null,
    { subject: '物理', room: 'C110' },
    null,
  ],
];

function cellHtml(slot: Slot): string {
  if (!slot) {
    return '<span class="pv-timetable__cell pv-timetable__cell--empty"></span>';
  }
  return `
    <span class="pv-timetable__cell">
      <span class="pv-timetable__subject">${slot.subject}</span>
      <span class="pv-timetable__room">${slot.room}</span>
    </span>
  `;
}

export const timetable: PreviewComponent = {
  subject: 'timetable',
  label: '大学の時間割',
  render: () => {
    const head = [
      '<span class="pv-timetable__corner"></span>',
      ...DAYS.map((day) => `<span class="pv-timetable__day">${day}</span>`),
    ].join('');

    const body = SLOTS.map(
      (row, i) =>
        `<span class="pv-timetable__period">${i + 1}</span>${row.map(cellHtml).join('')}`,
    ).join('');

    return `
    <article class="pv pv-timetable">
      <header class="pv-timetable__head">
        <p class="pv-timetable__term">2026年度 後期</p>
        <h3 class="pv-timetable__title">時間割</h3>
      </header>
      <div class="pv-timetable__grid">${head}${body}</div>
    </article>
  `;
  },
};
