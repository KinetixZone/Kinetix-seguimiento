import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function isSafePublicSupabaseKey(key: string): boolean {
  if (!key || key.startsWith('sb_secret_')) return false;
  if (key.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(
        Buffer.from(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
      );
      if (payload?.role === 'service_role') return false;
    } catch {}
  }
  return true;
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const urlKeys = [
    'VITE_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_URL',
    ...Object.keys(env).filter((k) => k.toUpperCase().endsWith('_SUPABASE_URL')),
  ];
  const publicUrl =
    urlKeys
      .map((k) => (env[k] || '').trim())
      .find((v) => v.startsWith('https://') && !v.includes('your-project')) || '';

  const pubKeyNames = [
    'VITE_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
    ...Object.keys(env).filter(
      (k) =>
        k.toUpperCase().endsWith('_SUPABASE_ANON_KEY') ||
        k.toUpperCase().endsWith('_SUPABASE_PUBLISHABLE_KEY')
    ),
  ];
  const rawPublicKey =
    pubKeyNames.map((k) => (env[k] || '').trim()).find((v) => isSafePublicSupabaseKey(v)) || '';

  const publicKey = isSafePublicSupabaseKey(rawPublicKey) ? rawPublicKey : '';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png', 'push-sw.js'],
        manifest: {
          id: '/',
          name: 'Kinetix Functional Zone',
          short_name: 'Kinetix',
          description: 'Seguimiento físico, composición corporal, pruebas 1RM y membresías para Kinetix Functional Zone.',
          theme_color: '#0a0a0c',
          background_color: '#0a0a0c',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallbackDenylist: [/^\/api/],
          importScripts: ['/push-sw.js'],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(publicUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(publicKey),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
