import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.ts',
      name: 'SuperpathHvacGame',
      formats: ['iife'],
      fileName: () => 'game.js',
      cssFileName: 'game',
    },
    // WordPress loads one local script and stylesheet, with stable filenames.
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});
