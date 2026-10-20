import { defineConfig } from 'vite';

export default defineConfig({
  // 大学のサーバーのサブフォルダに dist/ を置いても
  // JS / CSS のパスが壊れないよう相対パスで出力する（要件定義書 §9）
  base: './',
});
