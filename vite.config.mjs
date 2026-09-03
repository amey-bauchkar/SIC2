import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/frontend',
  server: {
    port: 3000,
    fs: {
      allow: ['..']
    },
    proxy: {
      '^/api/': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
