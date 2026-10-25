import { describe, expect, it } from 'vitest';

import { TYPE_INFOS } from '../data/typeInfos';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { photoUrl } from './shopPhoto';

const BASE_CSS = readFileSync(
  fileURLToPath(new URL('../styles/base.css', import.meta.url)),
  'utf8',
);

describe('場所の写真', () => {
  it('URLはタイプコードごとに1枚', () => {
    const urls = TYPE_INFOS.map((info) => photoUrl(info.code));
    expect(new Set(urls).size).toBe(TYPE_INFOS.length);
  });

  it('URLの形は images/shops/{コード}.webp', () => {
    for (const info of TYPE_INFOS) {
      expect(photoUrl(info.code)).toContain(`images/shops/${info.code}.webp`);
    }
  });

  it('外部のサービスを参照しない（同一オリジンの相対パス）', () => {
    for (const info of TYPE_INFOS) {
      expect(photoUrl(info.code)).not.toMatch(/^https?:|^\/\//);
    }
  });

  it('加工の強さはCSS変数にまとまっている', () => {
    const value = (name: string) => {
      const found = BASE_CSS.match(new RegExp(`--${name}:\\s*([\\d.]+)`));
      expect(found, `--${name} が base.css にない`).not.toBeNull();
      return Number(found?.[1]);
    };

    // くっきり写真：見えないほど薄くしない／テーマ色で塗りつぶさない
    expect(value('photo-opacity')).toBeGreaterThanOrEqual(0.7);
    expect(value('photo-opacity')).toBeLessThanOrEqual(1);
    expect(value('photo-tint')).toBeLessThanOrEqual(0.3);

    // ぼかし背景
    expect(value('hero-bg-blur')).toBeGreaterThanOrEqual(24);
    expect(value('hero-bg-opacity')).toBeLessThanOrEqual(0.7);
    expect(value('hero-bg-tint')).toBeLessThanOrEqual(0.5);

    // 文字パネル：0.94 未満にすると、背後が暗い写真のとき 4.5:1 を割る
    expect(value('panel-scrim')).toBeGreaterThanOrEqual(0.94);
  });

  it('JS側で不透明度を直接書いていない（CSS変数に一本化）', () => {
    const source = readFileSync(
      fileURLToPath(new URL('./shopPhoto.ts', import.meta.url)),
      'utf8',
    );
    expect(source).not.toMatch(/style\.opacity/);
  });
});
