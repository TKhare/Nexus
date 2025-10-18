import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Separate config for content script - must be self-contained
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': {},
    'global': 'window',
  },
  build: {
    outDir: 'dist/content',
    lib: {
      entry: resolve(__dirname, 'content/index.jsx'),
      formats: ['iife'],
      name: 'ContentScript',
      fileName: () => 'content.js',
    },
    rollupOptions: {
      external: ['chrome'],
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
        globals: {
          chrome: 'chrome'
        },
      },
    },
    minify: false, // Easier to debug
  },
});
