/**
 * テスト（previews.test.ts）で preview.css をファイルとして読むために、
 * node:fs / node:url の必要な関数だけを宣言している。
 *
 * @types/node を追加すれば不要になるが、CLAUDE.md の「外部ライブラリは原則追加しない」
 * という方針に合わせて、使う2関数だけをここで宣言している。
 * Vite の ?raw インポートは Vitest 環境では空文字になるため使えない。
 */
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}
