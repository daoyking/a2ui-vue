import {defineConfig} from 'vite';
import {resolve} from 'node:path';

/**
 * Library build config for @a2ui/vue.
 * The demo playground uses vite.demo.config.ts instead.
 */
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'v0_9/index': resolve(__dirname, 'src/v0_9/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'zod', /^@a2ui\/web_core/],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
