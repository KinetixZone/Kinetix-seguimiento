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
  if (key.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload?.role === 'service_role') return true;
    } catch {}
  }
  return false;
}

export function resolveSupabaseFromEnv(env: Record<string, string | undefined>) {
  const urlNames = ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'];
  const dynamicUrlNames = Object.keys(env).filter(
    (k) => k.toUpperCase().endsWith('_SUPABASE_URL') && !urlNames.includes(k)
  );
  let url = '';
  for (const name of [...urlNames, ...dynamicUrlNames]) {
    const candidate = cleanUrl(env[name] || '');
    if (candidate.startsWith('https://') && !candidate.includes('your-project')) {
      url = candidate;
      break;
    }
  }

  const keyNames = [
    'VITE_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const dynamicPublicKeyNames = Object.keys(env).filter(
    (k) =>
      (k.toUpperCase().endsWith('_SUPABASE_ANON_KEY') ||
        k.toUpperCase().endsWith('_SUPABASE_PUBLISHABLE_KEY')) &&
      !keyNames.includes(k)
  );
  const dynamicSecretKeyNames = Object.keys(env).filter(
    (k) =>
      (k.toUpperCase().endsWith('_SUPABASE_SECRET_KEY') ||
        k.toUpperCase().endsWith('_SUPABASE_SERVICE_ROLE_KEY')) &&
      !keyNames.includes(k)
  );

  let chosenName = '';
  let chosenKey = '';
  for (const name of [...keyNames, ...dynamicPublicKeyNames, ...dynamicSecretKeyNames]) {
    const trimmed = (env[name] || '').trim();
    if (trimmed) {
      chosenName = name;
      chosenKey = trimmed;
      break;
    }
  }

  return { url, chosenName, chosenKey };
}

export default function handler(_req: any, res: any) {
  const env: Record<string, string | undefined> = (globalThis as any).process?.env || {};
  const { url, chosenName, chosenKey } = resolveSupabaseFromEnv(env);

  res.setHeader('Cache-Control', 'no-store');

  if (!url || !chosenKey) {
    const supabaseEnvNames = Object.keys(env).filter((k) =>
      k.toUpperCase().includes('SUPABASE')
    );
    return res.status(200).json({
      configured: false,
      mode: 'none',
      sse: false,
      url: '',
      key: '',
      reason: !url ? 'missing_url' : 'missing_key',
      supabaseEnvNames,
    });
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
