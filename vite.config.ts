import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

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
    plugins: [react(), tailwindcss()],
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
