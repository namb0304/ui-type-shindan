/**
 * トップページの一覧に並べる、場所の小さい写真。
 *
 * 結果ページで敷く写真（shopPhoto.ts）とは別のファイルを使う。
 * あちらは1080×1919で20〜143KBあり、16枚並べると重すぎる。
 * こちらは中央を正方形に切り出した360×360で、1枚3.7〜21KB。
 *
 * 置き場所は public/images/shops/thumbs/{タイプコード}.webp。
 * 読み込みに失敗したら要素ごと取り除く（写真が無くても一覧は成立する）。
 */

/** サムネイルのURL。base は './' なので、サブフォルダに置いても壊れない。 */
export function thumbUrl(code: string): string {
  return `${import.meta.env.BASE_URL}images/shops/thumbs/${code}.webp`;
}

export interface ShopThumbOptions {
  /** 画面に入ってから読む。一覧の16枚はこちら */
  lazy?: boolean;
}

export function createShopThumb(code: string, options: ShopThumbOptions = {}): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'thumb__img';
  img.src = thumbUrl(code);
  // 名前はすぐ隣の文字で読めるので、写真側は読み上げない
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  img.decoding = 'async';
  img.loading = options.lazy ? 'lazy' : 'eager';
  // 読み込む前から場所を取らせる。あとから入って行がずれるのを防ぐ
  img.width = 360;
  img.height = 360;

  img.addEventListener('error', () => {
    img.remove();
  });

  return img;
}
