function cleanUrl(raw: string): string {
  return (raw || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

function isSecretKey(key: string, varName: string): boolean {
  if (!key) return false;
  if (key.startsWith('sb_secret_')) return true;
  if (varName.includes('SECRET') || varName.includes('SERVICE_ROLE')) return true;
  // Detect JWT with service_role claim
  if (key.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload?.role === 'service_role') return true;
    } catch {}
  }
  return false;
}

export default function handler(_req: any, res: any) {
  const env: Record<string, string | undefined> = (globalThis as any).process?.env || {};

  const url = cleanUrl(
    env.VITE_SUPABASE_URL ||
      env.NEXT_PUBLIC_SUPABASE_URL ||
      env.SUPABASE_URL ||
      ''
  );

  const candidates: Array<[string, string | undefined]> = [
    ['VITE_SUPABASE_ANON_KEY', env.VITE_SUPABASE_ANON_KEY],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
    ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY],
    ['SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY],
    ['SUPABASE_PUBLISHABLE_KEY', env.SUPABASE_PUBLISHABLE_KEY],
    ['SUPABASE_SECRET_KEY', env.SUPABASE_SECRET_KEY],
    ['SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY],
  ];

  let chosenName = '';
  let chosenKey = '';
  for (const [name, val] of candidates) {
    const trimmed = (val || '').trim();
    if (trimmed) {
      chosenName = name;
      chosenKey = trimmed;
      break;
    }
  }

  res.setHeader('Cache-Control', 'no-store');

  if (!url.startsWith('https://') || !chosenKey || url.includes('your-project')) {
    return res.status(200).json({ configured: false, mode: 'none', sse: false, url: '', key: '' });
  }

  if (isSecretKey(chosenKey, chosenName)) {
    return res.status(200).json({
      configured: true,
      mode: 'proxy',
      sse: false,
      url,
      key: '',
    });
  }

  return res.status(200).json({
    configured: true,
    mode: 'direct',
    sse: false,
    url,
    key: chosenKey,
  });
}
