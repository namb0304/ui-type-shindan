/**
 * 結果ページのファーストビューに敷く、お店の写真。
 *
 * 読み込むのは、結果に出たタイプの1枚だけ（16枚を先読みしない）。
 * 置き場所は public/images/shops/{タイプコード}.webp で、
 * ビルド時にそのまま dist/ にコピーされる（要件 §9）。
 *
 * 写真がまだ無いタイプや、読み込みに失敗した場合は要素ごと取り除く。
 * ファーストビューはテーマ色のグラデーションだけでも成立するようにしてある。
 */

/**
 * 写真の加工の強さ（不透明度・テーマ色の重ね具合）は
 * base.css の --photo-opacity / --photo-tint の2つにまとめてある。
 *
 * 文字は写真の上に置かず、写真の下の領域（背景色が不透明）に置くので、
 * 加工の強さを変えても文字の読みやすさには影響しない。
 */

/** 写真のURL。base は './' なので、サーバーのサブフォルダに置いても壊れない。 */
export function photoUrl(code: string): string {
  return `${import.meta.env.BASE_URL}images/shops/${code}.webp`;
}

export interface ShopPhotoOptions {
  /** 確認ページのように何枚も並べるときは、見えたものから読み込む */
  lazy?: boolean;
  /** 付けるクラス名（ぼかし背景と、くっきり写真で分ける） */
  className?: string;
}

/**
 * 写真の要素を作る。
 * 読み込めなかったときは自分を取り除くので、呼び出し側で分岐しなくてよい。
 *
 * ぼかし背景と、くっきり写真で同じURLを使う。
 * 同じURLなのでブラウザは1回しか取りに行かない（読み込みは1枚ぶん）。
 */
export function createShopPhoto(code: string, options: ShopPhotoOptions = {}): HTMLImageElement {
  const img = document.createElement('img');
  img.className = options.className ?? 'hero__img';
  img.src = photoUrl(code);
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  img.decoding = 'async';
  // 確認ページでは16枚を並べるので、見えたものから読み込む
  img.loading = options.lazy ? 'lazy' : 'eager';

  img.addEventListener('error', () => {
    img.remove();
  });

  return img;
}
