import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'background.js'),
        popup: resolve(__dirname, 'popup/popup.html'),
        document: resolve(__dirname, 'document/document.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          return '[name]/[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            if (assetInfo.name.includes('content')) {
              return 'content/content.css';
            }
            return '[name]/[name].css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@utils': resolve(__dirname, 'utils'),
      '@models': resolve(__dirname, 'models'),
    }
  }
});
