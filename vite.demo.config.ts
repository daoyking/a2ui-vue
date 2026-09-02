import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'node:path';

/**
 * Dev/build config for the demo playground (not the published library).
 * Resolution aliases let the demo import the library from source.
 */
export default defineConfig({
  root: resolve(__dirname, 'demo'),
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@a2ui/vue/v0_9': resolve(__dirname, 'src/v0_9/index.ts'),
      '@a2ui/vue': resolve(__dirname, 'src/index.ts'),
    },
    dedupe: ['vue', 'zod'],
  },
  server: {
    port: 5178,
    open: false,
  },
  build: {
    outDir: resolve(__dirname, 'demo-dist'),
    emptyOutDir: true,
  },
});
