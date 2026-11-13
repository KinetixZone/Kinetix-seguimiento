function cleanUrl(raw: string): string {
  return (raw || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

export default async function handler(req: any, res: any) {
  const env: Record<string, string | undefined> = (globalThis as any).process?.env || {};

  const baseUrl = cleanUrl(
    env.VITE_SUPABASE_URL ||
      env.NEXT_PUBLIC_SUPABASE_URL ||
      env.SUPABASE_URL ||
      ''
  );

  const key = (
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_SECRET_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();

  if (!baseUrl.startsWith('https://') || !key) {
    return res.status(503).json({ message: 'Supabase Cloud no configurado en Vercel.' });
  }

  try {
    const rawUrl = String(req.url || '');
    const stripped = rawUrl.replace(/^\/api\/sb-proxy/, '') || '/';
    const targetUrl = `${baseUrl}${stripped}`;

    const headers: Record<string, string> = {
      apikey: key,
    };
    if (!key.startsWith('sb_')) {
      headers.Authorization = `Bearer ${key}`;
    }

    const forwardHeaders = ['accept', 'content-type', 'prefer', 'range', 'accept-profile', 'content-profile'];
    for (const h of forwardHeaders) {
      const val = req.headers?.[h];
      if (typeof val === 'string' && val) {
        headers[h] = val;
      }
    }

    const method = (req.method || 'GET').toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD';
    let bodyStr: string | undefined;
    if (hasBody && req.body !== undefined) {
      bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!headers['content-type']) {
        headers['content-type'] = 'application/json';
      }
    }

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: bodyStr,
    });

    const contentType = upstream.headers.get('content-type');
    const contentRange = upstream.headers.get('content-range');
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentRange) res.setHeader('Content-Range', contentRange);

    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (err: any) {
    return res.status(502).json({ message: err?.message || 'Error al contactar Supabase desde Vercel.' });
  }
}
