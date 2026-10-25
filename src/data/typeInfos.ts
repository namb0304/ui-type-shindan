import type { TypeInfo } from './types';

/**
 * 16タイプの呼び名（要件定義書 §12・場所テーマ）。
 *
 * 結果は「あなたのUIは『町中華』タイプ」＋ひとことツッコミの形で見せる。
 * 実在の店名・ブランド名は使わない。ツッコミには長所を1つ入れ、いじりすぎない。
 */
export const TYPE_INFOS: readonly TypeInfo[] = [
  { code: 'DFCG', shop: '市役所の窓口', quip: '必要な情報は全部ある。愛想はない' },
  { code: 'DFCM', shop: '古本屋', quip: '棚ぎっしり、でも探す時間も楽しい' },
  { code: 'DFPG', shop: '激安スーパー', quip: '赤字で「本日限り」が3つ並ぶ' },
  { code: 'DFPM', shop: '町中華', quip: 'メニューは壁一面。でも迷わない' },
  { code: 'DRCG', shop: '空港の出発ロビー', quip: '情報量は多いのに、なぜか洗練されている' },
  { code: 'DRCM', shop: 'アンティーク時計店', quip: '細部まで作り込まれた、ぎっしりの美学' },
  { code: 'DRPG', shop: 'ゲームセンター', quip: '光る、鳴る、目移りする。それが正義' },
  { code: 'DRPM', shop: 'お祭りの屋台通り', quip: 'にぎやかで、どこか懐かしい' },
  { code: 'AFCG', shop: '北欧の家具屋', quip: '余白が多い。値札まで静か' },
  { code: 'AFCM', shop: '美術館', quip: '一つの作品に、壁一面を使う' },
  { code: 'AFPG', shop: 'おしゃれなジェラート屋', quip: '色はかわいく、レイアウトはすっきり' },
  { code: 'AFPM', shop: '街角の花屋', quip: 'やわらかい色と、手書きのPOP' },
  { code: 'ARCG', shop: 'スマホの旗艦店', quip: '何も置いてないのに、なぜか高そう' },
  { code: 'ARCM', shop: '高級ホテルのロビー', quip: '静かで重厚。ボタンを押すのも緊張する' },
  { code: 'ARPG', shop: 'テーマパークの入口', quip: '広くて、明るくて、ワクワクする' },
  { code: 'ARPM', shop: '老舗旅館', quip: 'ゆったりとして、あたたかいおもてなし' },
];

export function getTypeInfo(code: string): TypeInfo {
  const info = TYPE_INFOS.find((candidate) => candidate.code === code);
  if (!info) {
    throw new Error(`タイプが見つかりません: ${code}`);
  }
  return info;
}
