import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localApi } from './server/localApi';

export default defineConfig(({ mode }) => {
    return {
      envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), localApi(mode)],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
