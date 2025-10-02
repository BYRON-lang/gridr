import { join } from 'path';
import { fileURLToPath } from 'url';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      qwikCity({
        trailingSlash: false,
      }),
      qwikVite({
        client: {
          outDir: 'dist',
        },
        ssr: {
          outDir: 'netlify/edge-functions/entry.netlify-edge',
        },
      }),
    ],
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
