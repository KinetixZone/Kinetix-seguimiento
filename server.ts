import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE_PATH = path.join(__dirname, '.kinetix-cloud.json');

interface CloudConfigPayload {
  url: string;
  key: string;
  updatedAt?: string;
}

function cleanUrl(raw: string): string {
  return (raw || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

function readServerCloudConfig(): CloudConfigPayload | null {
  const envUrl = cleanUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '');
  const envKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  if (envUrl.startsWith('https://') && envKey && !envUrl.includes('your-project')) {
    return { url: envUrl, key: envKey };
  }

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as CloudConfigPayload;
      const url = cleanUrl(parsed?.url || '');
      const key = (parsed?.key || '').trim();
      if (url.startsWith('https://') && key) {
        return { url, key, updatedAt: parsed.updatedAt };
      }
    }
  } catch (err) {
    console.warn('Could not read .kinetix-cloud.json:', err);
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  const sseClients = new Set<express.Response>();
  const broadcastCloudChange = () => {
    for (const client of sseClients) {
      try {
        client.write(`data: update\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  };

  // Shared Cloud Configuration API (so all devices automatically connect to Supabase Cloud)
  app.get('/api/cloud-config', (_req, res) => {
    const config = readServerCloudConfig();
    if (!config) {
      return res.json({ configured: false, mode: 'none', url: '', key: '' });
    }
    if (config.key.startsWith('sb_secret_')) {
      return res.json({
        configured: true,
        mode: 'proxy',
        url: config.url,
        key: '',
      });
    }
    return res.json({
      configured: true,
      mode: 'direct',
      url: config.url,
      key: config.key,
    });
  });

  app.get('/api/cloud-events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  app.use('/api/sb-proxy', async (req, res) => {
    const config = readServerCloudConfig();
    if (!config) {
      return res.status(503).json({ message: 'Supabase Cloud no configurado en el servidor.' });
    }

    try {
      const targetUrl = `${config.url}${req.url}`;
      const headers: Record<string, string> = {
        apikey: config.key,
      };
      if (!config.key.startsWith('sb_')) {
        headers.Authorization = `Bearer ${config.key}`;
      }

      const forwardHeaders = ['accept', 'content-type', 'prefer', 'range', 'accept-profile', 'content-profile'];
      for (const h of forwardHeaders) {
        const val = req.headers[h];
        if (typeof val === 'string' && val) {
          headers[h] = val;
        }
      }

      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const bodyStr = hasBody && req.body !== undefined ? JSON.stringify(req.body) : undefined;
      if (hasBody && !headers['content-type']) {
        headers['content-type'] = 'application/json';
      }

      const upstream = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: bodyStr,
      });

      const contentType = upstream.headers.get('content-type');
      const contentRange = upstream.headers.get('content-range');
      if (contentType) res.setHeader('Content-Type', contentType);
      if (contentRange) res.setHeader('Content-Range', contentRange);

      const text = await upstream.text();
      if (hasBody && upstream.ok) {
        broadcastCloudChange();
      }
      return res.status(upstream.status).send(text);
    } catch (err: any) {
      return res.status(502).json({ message: err?.message || 'Error al contactar Supabase desde el servidor.' });
    }
  });

  app.post('/api/cloud-config', (req, res) => {
    const body = req.body as Partial<CloudConfigPayload>;
    const url = cleanUrl(body?.url || '');
    const key = (body?.key || '').trim();

    if (!url.startsWith('https://') || !key) {
      return res.status(400).json({ ok: false, error: 'URL y Anon Key válidos son requeridos.' });
    }

    try {
      const payload: CloudConfigPayload = {
        url,
        key,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
      broadcastCloudChange();
      return res.json({
        ok: true,
        configured: true,
        mode: key.startsWith('sb_secret_') ? 'proxy' : 'direct',
      });
    } catch (err) {
      console.error('Error saving .kinetix-cloud.json:', err);
      return res.status(500).json({ ok: false, error: 'No se pudo guardar la configuración en el servidor.' });
    }
  });

  app.delete('/api/cloud-config', (_req, res) => {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        fs.unlinkSync(CONFIG_FILE_PATH);
      }
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ ok: false });
    }
  });

  // Vite middleware for development; static dist serving for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinetix server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
