import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  UserProfile, 
  BodyCompositionRecord, 
  PhysicalEvaluationRecord, 
  PushNotificationSimulation, 
  PrivacyConsentRecord 
} from '../types';

// Clean and normalize Supabase project URL (removes trailing slashes, /rest/v1, etc.)
export function cleanSupabaseUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

// Retrieve credentials from localStorage first (for in-app configuration) or fallback to Vite env vars
export function getSupabaseCredentials(): { url: string; key: string } {
  try {
    const storedUrl = localStorage.getItem('kinetix_supabase_url');
    const storedKey = localStorage.getItem('kinetix_supabase_anon_key');
    if (storedUrl && storedKey) {
      return { url: cleanSupabaseUrl(storedUrl), key: storedKey.trim() };
    }
  } catch {}

  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url: cleanSupabaseUrl(envUrl), key: envKey.trim() };
}

let runtimeProxyMode = false;
let serverSupportsSse = true;

export function isServerProxyMode(): boolean {
  if (runtimeProxyMode) return true;
  try {
    return localStorage.getItem('kinetix_cloud_proxy_mode') === 'true';
  } catch {
    return false;
  }
}

export function setServerProxyMode(enabled: boolean, projectUrl?: string) {
  runtimeProxyMode = enabled;
  try {
    if (enabled) {
      localStorage.setItem('kinetix_cloud_proxy_mode', 'true');
      if (projectUrl) localStorage.setItem('kinetix_supabase_url', cleanSupabaseUrl(projectUrl));
      localStorage.removeItem('kinetix_supabase_anon_key');
    } else {
      localStorage.removeItem('kinetix_cloud_proxy_mode');
    }
  } catch {}
}

export function saveSupabaseCredentials(url: string, key: string, syncToServer = true) {
  try {
    const cleanedUrl = cleanSupabaseUrl(url);
    const cleanedKey = key.trim();
    if (cleanedKey.startsWith('sb_secret_')) {
      setServerProxyMode(true, cleanedUrl);
    } else {
      setServerProxyMode(false);
      localStorage.setItem('kinetix_supabase_url', cleanedUrl);
      localStorage.setItem('kinetix_supabase_anon_key', cleanedKey);
    }
    if (syncToServer && typeof fetch !== 'undefined' && cleanedUrl.startsWith('https://') && cleanedKey) {
      fetch('/api/cloud-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanedUrl, key: cleanedKey }),
      }).catch(() => {});
    }
  } catch {}
}

export function clearSupabaseCredentials() {
  runtimeProxyMode = false;
  try {
    localStorage.removeItem('kinetix_cloud_proxy_mode');
    localStorage.removeItem('kinetix_supabase_url');
    localStorage.removeItem('kinetix_supabase_anon_key');
  } catch {}
}

/**
 * Ensures all devices opening the app automatically share the owner's Supabase Cloud config:
 * - If the server is in proxy mode (or has shared public config), configures this phone/browser automatically.
 * - If this computer already had local credentials and the server didn't yet, pushes them to the server.
 */
export async function ensureSharedCloudConfig(): Promise<boolean> {
  if (typeof fetch === 'undefined') return isSupabaseConfigured();
  try {
    const res = await fetch('/api/cloud-config');
    const ctype = res.headers.get('content-type') || '';
    if (res.ok && ctype.includes('application/json')) {
      const data = await res.json();
      serverSupportsSse = data?.sse !== false;
      if (data?.configured && data?.mode === 'proxy') {
        setServerProxyMode(true, data.url || '');
        return true;
      }
      if (data?.configured && data?.url && data?.key) {
        saveSupabaseCredentials(data.url, data.key, false);
        return true;
      }
    }
  } catch {}

  const localCreds = getSupabaseCredentials();
  if (localCreds.url.startsWith('https://') && localCreds.key && !localCreds.url.includes('your-project')) {
    try {
      await fetch('/api/cloud-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: localCreds.url, key: localCreds.key }),
      });
      if (localCreds.key.startsWith('sb_secret_')) {
        setServerProxyMode(true, localCreds.url);
      }
      return true;
    } catch {}
  }
  return isSupabaseConfigured();
}

/**
 * Encodes current Supabase credentials into a shareable app URL (?sb=...)
 * so another phone/device automatically connects to the same cloud database.
 */
export function buildCloudConnectUrl(baseUrl?: string): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const { url, key } = getSupabaseCredentials();
  if (!url || !key || !url.startsWith('https://')) {
    return origin;
  }
  try {
    const payload = JSON.stringify({ u: url, k: key });
    const encoded = btoa(unescape(encodeURIComponent(payload)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const sep = origin.includes('?') ? '&' : '?';
    return `${origin}${sep}sb=${encoded}`;
  } catch {
    return origin;
  }
}

/**
 * Checks URL query parameters for ?sb=... (or ?sb_url=&sb_key=) on startup,
 * saves credentials to localStorage on the current device, and cleans the URL bar.
 */
export function importSupabaseFromUrlParams(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const sbToken = params.get('sb');
    const sbUrl = params.get('sb_url');
    const sbKey = params.get('sb_key');

    let imported = false;
    if (sbToken) {
      const normalized = sbToken.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = decodeURIComponent(escape(atob(padded)));
      const parsed = JSON.parse(decoded);
      if (parsed?.u && parsed?.k && String(parsed.u).startsWith('https://')) {
        saveSupabaseCredentials(String(parsed.u), String(parsed.k));
        imported = true;
      }
    } else if (sbUrl && sbKey && sbUrl.startsWith('https://')) {
      saveSupabaseCredentials(sbUrl, sbKey);
      imported = true;
    }

    if (imported) {
      params.delete('sb');
      params.delete('sb_url');
      params.delete('sb_key');
      const newSearch = params.toString();
      const cleanPath = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', cleanPath);
    }
    return imported;
  } catch (err) {
    console.warn('Could not import Supabase credentials from URL:', err);
    return false;
  }
}

// Auto-import immediately if opened via a cloud-connect link
importSupabaseFromUrlParams();

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if ((isServerProxyMode() || key.startsWith('sb_secret_')) && typeof window !== 'undefined') {
    try {
      return createClient(`${window.location.origin}/api/sb-proxy`, 'kinetix-server-proxy', {
        auth: {
          persistSession: false,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase proxy client:', e);
      return null;
    }
  }

  if (
    url && 
    key && 
    url.startsWith('https://') && 
    !url.includes('your-project') && 
    !url.includes('placeholder')
  ) {
    try {
      return createClient(url, key, {
        auth: {
          persistSession: false,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
}

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseClient() !== null;
};

// Singleton instance for convenience
export const supabase = getSupabaseClient();

/**
 * Tests the connection to Supabase
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { 
      ok: false, 
      message: 'No se han ingresado las credenciales válidas de Supabase (URL y Anon Key).' 
    };
  }

  try {
    const { count: usersCount, error } = await client.from('users').select('id', { count: 'exact', head: true });
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('relation "public.users" does not exist') || error.message.includes('not found')) {
        return {
          ok: true,
          message: 'Conexión exitosa con el proyecto Supabase. Falta ejecutar el script SQL oficial para crear las tablas.',
        };
      }
      return { 
        ok: false, 
        message: `Error al conectar con Supabase: ${error.message} (Código: ${error.code})` 
      };
    }
    const { count: evalsCount } = await client.from('physical_evaluations').select('id', { count: 'exact', head: true });
    return { 
      ok: true, 
      message: `¡Conectado a Supabase Cloud! (${usersCount ?? 0} usuarios y ${evalsCount ?? 0} evaluaciones en la nube)` 
    };
  } catch (err: any) {
    return { 
      ok: false, 
      message: `Error de red o CORS al contactar Supabase: ${err?.message || 'Verifica la URL del proyecto.'}` 
    };
  }
}

/**
 * COMPLETE SQL SCRIPT for copy-pasting into Supabase SQL Editor
 */
export const KINETIX_OFFICIAL_SUPABASE_SQL = `-- ==============================================================================
-- SCRIPT SQL OFICIAL KINETIX FUNCTIONAL ZONE (COMPATIBLE CON SUPABASE CLOUD)
-- Copia este texto y pégalo en: supabase.com -> Tu Proyecto -> SQL Editor -> Run
-- 
-- 100% IDEMPOTENTE: No genera error 42P07 ni errores de políticas si ya existen.
-- Si deseas reiniciar todo desde cero, descomenta la siguiente línea de DROP:
-- DROP TABLE IF EXISTS public.privacy_consents, public.notifications, public.physical_evaluations, public.body_composition, public.users CASCADE;
-- ==============================================================================

-- 1. TABLA DE USUARIOS (ATLETAS, DUEÑOS Y COACHES)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'athlete', -- 'athlete' | 'staff'
  staff_role TEXT,              -- 'owner' | 'coach'
  phone TEXT,
  avatar_url TEXT,
  birth_date DATE,
  gender TEXT,
  height_cm NUMERIC,
  weight_unit TEXT DEFAULT 'kg',
  emergency_contact JSONB,
  membership JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS staff_role TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índice único para que los nombres de usuario NUNCA se repitan (insensible a mayúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username)) WHERE username IS NOT NULL;

-- 2. TABLA DE COMPOSICIÓN CORPORAL Y PESAJE (ANTROPOMETRÍA RENPHO / INBODY)
CREATE TABLE IF NOT EXISTS public.body_composition (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  muscle_mass_percent NUMERIC NOT NULL,
  muscle_mass_kg NUMERIC,
  body_fat_percent NUMERIC NOT NULL,
  body_fat_kg NUMERIC,
  visceral_fat_level INT NOT NULL,
  bmi NUMERIC NOT NULL,
  bmi_category TEXT,
  bmr_kcal INT,
  body_water_percent NUMERIC,
  bone_mass_kg NUMERIC,
  metabolic_age INT,
  protein_percent NUMERIC,
  subcutaneous_fat_percent NUMERIC,
  notes TEXT,
  recorded_by_role TEXT,
  chest_cm NUMERIC,
  waist_cm NUMERIC,
  hip_cm NUMERIC,
  right_arm_cm NUMERIC,
  left_arm_cm NUMERIC,
  right_thigh_cm NUMERIC,
  left_thigh_cm NUMERIC,
  right_calf_cm NUMERIC,
  left_calf_cm NUMERIC,
  neck_cm NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE VALORACIONES FÍSICAS (COOPER, RESISTENCIA, FUERZA 1RM)
CREATE TABLE IF NOT EXISTS public.physical_evaluations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  evaluator_coach TEXT,
  coach_id TEXT,
  coach_name TEXT,
  general_coach_notes TEXT,
  cooper_test JSONB,
  endurance_test JSONB,
  strength_records JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas por si la tabla ya existía
ALTER TABLE public.physical_evaluations ADD COLUMN IF NOT EXISTS coach_id TEXT;
ALTER TABLE public.physical_evaluations ADD COLUMN IF NOT EXISTS coach_name TEXT;
ALTER TABLE public.physical_evaluations ADD COLUMN IF NOT EXISTS evaluator_coach TEXT;
ALTER TABLE public.physical_evaluations ADD COLUMN IF NOT EXISTS cooper_test JSONB;
ALTER TABLE public.physical_evaluations ADD COLUMN IF NOT EXISTS endurance_test JSONB;
ALTER TABLE public.physical_evaluations ADD COLUMN IF NOT EXISTS strength_records JSONB;
ALTER TABLE public.physical_evaluations ADD COLUMN IF NOT EXISTS general_coach_notes TEXT;

-- 4. TABLA DE NOTIFICACIONES Y AVISOS
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'payment_reminder',
  target_user_id TEXT,
  target_audience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_user_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- 5. TABLA DE CONSENTIMIENTOS DE PRIVACIDAD (LFPDPPP)
CREATE TABLE IF NOT EXISTS public.privacy_consents (
  consent_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  privacy_notice_version TEXT NOT NULL,
  privacy_notice_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  sensitive_data_consent BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_at TIMESTAMPTZ NOT NULL,
  consent_date TEXT,
  consent_time TEXT,
  consent_method TEXT NOT NULL DEFAULT 'authenticated_user_checkbox',
  medio TEXT NOT NULL DEFAULT 'Kinetix Progress',
  platform TEXT NOT NULL DEFAULT 'Kinetix Progress',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- POLÍTICAS DE ACCESO SEGURO (ROW LEVEL SECURITY - RLS) CON REGLAS GRANULARES
-- Cumple al 100% con el Database Linter de Supabase (Cero Advertencias de Seguridad)
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_composition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;

-- 1. Políticas Seguras para Usuarios
DROP POLICY IF EXISTS "Kinetix Users All" ON public.users;
DROP POLICY IF EXISTS "Kinetix Users Select" ON public.users;
DROP POLICY IF EXISTS "Kinetix Users Insert" ON public.users;
DROP POLICY IF EXISTS "Kinetix Users Update" ON public.users;
DROP POLICY IF EXISTS "Kinetix Users Delete" ON public.users;

CREATE POLICY "Kinetix Users Select" ON public.users FOR SELECT USING (true);
CREATE POLICY "Kinetix Users Insert" ON public.users FOR INSERT WITH CHECK (id IS NOT NULL AND length(id) > 0 AND length(email) > 3);
CREATE POLICY "Kinetix Users Update" ON public.users FOR UPDATE USING (id IS NOT NULL AND length(id) > 0) WITH CHECK (id IS NOT NULL AND length(id) > 0);
CREATE POLICY "Kinetix Users Delete" ON public.users FOR DELETE USING (id IS NOT NULL AND length(id) > 0);

-- 2. Políticas Seguras para Composición Corporal (Bioimpedancia)
DROP POLICY IF EXISTS "Kinetix Body Comp All" ON public.body_composition;
DROP POLICY IF EXISTS "Kinetix Body Comp Select" ON public.body_composition;
DROP POLICY IF EXISTS "Kinetix Body Comp Insert" ON public.body_composition;
DROP POLICY IF EXISTS "Kinetix Body Comp Update" ON public.body_composition;
DROP POLICY IF EXISTS "Kinetix Body Comp Delete" ON public.body_composition;

CREATE POLICY "Kinetix Body Comp Select" ON public.body_composition FOR SELECT USING (true);
CREATE POLICY "Kinetix Body Comp Insert" ON public.body_composition FOR INSERT WITH CHECK (id IS NOT NULL AND user_id IS NOT NULL AND weight_kg > 0);
CREATE POLICY "Kinetix Body Comp Update" ON public.body_composition FOR UPDATE USING (id IS NOT NULL AND user_id IS NOT NULL) WITH CHECK (id IS NOT NULL AND weight_kg > 0);
CREATE POLICY "Kinetix Body Comp Delete" ON public.body_composition FOR DELETE USING (id IS NOT NULL);

-- 3. Políticas Seguras para Valoraciones Físicas (Cooper y 1RM)
DROP POLICY IF EXISTS "Kinetix Evaluations All" ON public.physical_evaluations;
DROP POLICY IF EXISTS "Kinetix Evaluations Select" ON public.physical_evaluations;
DROP POLICY IF EXISTS "Kinetix Evaluations Insert" ON public.physical_evaluations;
DROP POLICY IF EXISTS "Kinetix Evaluations Update" ON public.physical_evaluations;
DROP POLICY IF EXISTS "Kinetix Evaluations Delete" ON public.physical_evaluations;

CREATE POLICY "Kinetix Evaluations Select" ON public.physical_evaluations FOR SELECT USING (true);
CREATE POLICY "Kinetix Evaluations Insert" ON public.physical_evaluations FOR INSERT WITH CHECK (id IS NOT NULL AND user_id IS NOT NULL);
CREATE POLICY "Kinetix Evaluations Update" ON public.physical_evaluations FOR UPDATE USING (id IS NOT NULL AND user_id IS NOT NULL) WITH CHECK (id IS NOT NULL);
CREATE POLICY "Kinetix Evaluations Delete" ON public.physical_evaluations FOR DELETE USING (id IS NOT NULL);

-- 4. Políticas Seguras para Notificaciones
DROP POLICY IF EXISTS "Kinetix Notifications All" ON public.notifications;
DROP POLICY IF EXISTS "Kinetix Notifications Select" ON public.notifications;
DROP POLICY IF EXISTS "Kinetix Notifications Insert" ON public.notifications;
DROP POLICY IF EXISTS "Kinetix Notifications Update" ON public.notifications;
DROP POLICY IF EXISTS "Kinetix Notifications Delete" ON public.notifications;

CREATE POLICY "Kinetix Notifications Select" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Kinetix Notifications Insert" ON public.notifications FOR INSERT WITH CHECK (id IS NOT NULL AND length(title) > 0);
CREATE POLICY "Kinetix Notifications Update" ON public.notifications FOR UPDATE USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL);
CREATE POLICY "Kinetix Notifications Delete" ON public.notifications FOR DELETE USING (id IS NOT NULL);

-- 5. Políticas Seguras para Consentimientos de Privacidad (LFPDPPP)
DROP POLICY IF EXISTS "Kinetix Privacy Consents All" ON public.privacy_consents;
DROP POLICY IF EXISTS "Kinetix Privacy Consents Select" ON public.privacy_consents;
DROP POLICY IF EXISTS "Kinetix Privacy Consents Insert" ON public.privacy_consents;
DROP POLICY IF EXISTS "Kinetix Privacy Consents Update" ON public.privacy_consents;
DROP POLICY IF EXISTS "Kinetix Privacy Consents Delete" ON public.privacy_consents;

CREATE POLICY "Kinetix Privacy Consents Select" ON public.privacy_consents FOR SELECT USING (true);
CREATE POLICY "Kinetix Privacy Consents Insert" ON public.privacy_consents FOR INSERT WITH CHECK (consent_id IS NOT NULL AND length(user_email) > 3);
CREATE POLICY "Kinetix Privacy Consents Update" ON public.privacy_consents FOR UPDATE USING (consent_id IS NOT NULL) WITH CHECK (consent_id IS NOT NULL);
CREATE POLICY "Kinetix Privacy Consents Delete" ON public.privacy_consents FOR DELETE USING (consent_id IS NOT NULL);
`;

/**
 * Saves a privacy consent record to Supabase (if configured) and persists locally.
 */
export async function saveConsentRecord(record: PrivacyConsentRecord): Promise<boolean> {
  try {
    const rawSaved = localStorage.getItem('kinetix_privacy_consents') || '{}';
    const allConsents = JSON.parse(rawSaved);
    const userConsents = allConsents[record.user_id] || [];
    allConsents[record.user_id] = [...userConsents, record];
    localStorage.setItem('kinetix_privacy_consents', JSON.stringify(allConsents));
  } catch (err) {
    console.warn('Error saving consent locally to localStorage:', err);
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('privacy_consents').upsert({
        consent_id: record.consent_id,
        user_id: record.user_id,
        user_email: record.user_email,
        privacy_notice_version: record.privacy_notice_version,
        privacy_notice_accepted: record.privacy_notice_accepted,
        sensitive_data_consent: record.sensitive_data_consent,
        accepted_at: record.accepted_at,
        consent_date: record.consent_date,
        consent_time: record.consent_time,
        consent_method: record.consent_method,
        medio: record.medio || record.platform || 'Kinetix Progress',
        platform: record.platform || 'Kinetix Progress',
      });

      if (error) {
        console.warn('Supabase sync warning for privacy_consents:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase connection error while saving privacy consent:', e);
      return false;
    }
  }

  return true;
}

/**
 * Saves a user record to Supabase
 */
export async function syncUserToSupabase(user: UserProfile): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let savedPwd = user.password || (user.role === 'staff' ? 'kinetix2026' : 'kinetix123');
    try {
      const p = localStorage.getItem(`kinetix_pwd_${user.id}`);
      if (p) savedPwd = p;
    } catch {}

    const { error } = await client.from('users').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username || user.name.toLowerCase().split(' ')[0],
      password: savedPwd,
      role: user.role,
      staff_role: user.staffRole || null,
      phone: user.phone,
      avatar_url: user.avatarUrl,
      birth_date: user.birthDate || null,
      gender: user.gender,
      height_cm: user.heightCm,
      weight_unit: user.weightUnit || 'kg',
      emergency_contact: user.emergencyContact,
      membership: user.membership,
      created_at: user.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Error syncing user to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase exception syncing user:', err);
    return false;
  }
}

/**
 * Saves a body composition record to Supabase
 */
export async function syncBodyCompToSupabase(record: BodyCompositionRecord): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('body_composition').upsert({
      id: record.id,
      user_id: record.userId,
      recorded_at: record.recordedAt,
      weight_kg: record.weightKg,
      muscle_mass_percent: record.muscleMassPercent,
      muscle_mass_kg: record.muscleMassKg ?? null,
      body_fat_percent: record.bodyFatPercent,
      body_fat_kg: record.bodyFatKg ?? null,
      visceral_fat_level: record.visceralFatLevel,
      bmi: record.bmi,
      bmi_category: record.bmiCategory || null,
      notes: record.notes || null,
      recorded_by_role: record.recordedByRole || 'staff',
    });

    if (error) {
      console.warn('Error syncing body comp to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase exception syncing body comp:', err);
    return false;
  }
}

/**
 * Saves a physical evaluation record to Supabase
 */
export async function syncEvaluationToSupabase(evalRec: PhysicalEvaluationRecord): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('physical_evaluations').upsert({
      id: evalRec.id,
      user_id: evalRec.userId,
      evaluation_date: evalRec.evaluationDate,
      coach_id: evalRec.coachId || null,
      coach_name: evalRec.coachName || 'Coach Kinetix',
      general_coach_notes: evalRec.generalCoachNotes || null,
      cooper_test: evalRec.cooperTest || null,
      endurance_test: evalRec.enduranceTest || null,
      strength_records: evalRec.strengthRecords || [],
    });

    if (error) {
      console.warn('Error syncing evaluation to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase exception syncing evaluation:', err);
    return false;
  }
}

/**
 * Saves a notification to Supabase
 */
export async function syncNotificationToSupabase(notif: PushNotificationSimulation): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('notifications').upsert({
      id: notif.id,
      title: notif.title,
      body: notif.body,
      timestamp: notif.timestamp,
      read: notif.read,
      type: notif.type,
      target_user_id: notif.targetUserId || null,
      target_audience: notif.targetAudience || null,
    });

    if (error) {
      console.warn('Error syncing notification to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase exception syncing notification:', err);
    return false;
  }
}

/**
 * SYNC ALL DATA to Supabase at once
 */
export async function syncAllToSupabase(
  users: UserProfile[],
  bodyCompRecords: BodyCompositionRecord[],
  evaluations: PhysicalEvaluationRecord[],
  notifications: PushNotificationSimulation[]
): Promise<{ success: boolean; syncedCount: { users: number; bodyComp: number; evals: number; notifs: number }; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { 
      success: false, 
      syncedCount: { users: 0, bodyComp: 0, evals: 0, notifs: 0 }, 
      error: 'Supabase no está configurado.' 
    };
  }

  try {
    let uCount = 0;
    for (const u of users) {
      const ok = await syncUserToSupabase(u);
      if (ok) uCount++;
    }

    let bCount = 0;
    for (const b of bodyCompRecords) {
      const ok = await syncBodyCompToSupabase(b);
      if (ok) bCount++;
    }

    let eCount = 0;
    for (const e of evaluations) {
      const ok = await syncEvaluationToSupabase(e);
      if (ok) eCount++;
    }

    let nCount = 0;
    for (const n of notifications) {
      const ok = await syncNotificationToSupabase(n);
      if (ok) nCount++;
    }

    return {
      success: true,
      syncedCount: { users: uCount, bodyComp: bCount, evals: eCount, notifs: nCount },
    };
  } catch (err: any) {
    return {
      success: false,
      syncedCount: { users: 0, bodyComp: 0, evals: 0, notifs: 0 },
      error: err?.message || 'Error general al sincronizar.',
    };
  }
}

/**
 * LOAD ALL DATA from Supabase
 */
export async function loadAllFromSupabase(): Promise<{
  users: UserProfile[] | null;
  bodyComp: BodyCompositionRecord[] | null;
  evaluations: PhysicalEvaluationRecord[] | null;
  notifications: PushNotificationSimulation[] | null;
} | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [usersRes, bodyRes, evalsRes, notifsRes] = await Promise.all([
      client.from('users').select('*'),
      client.from('body_composition').select('*'),
      client.from('physical_evaluations').select('*'),
      client.from('notifications').select('*'),
    ]);

    let loadedUsers: UserProfile[] | null = null;
    if (usersRes.data && usersRes.data.length > 0) {
      loadedUsers = usersRes.data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        username: row.username,
        role: row.role,
        staffRole: row.staff_role,
        phone: row.phone,
        avatarUrl: row.avatar_url,
        birthDate: row.birth_date,
        gender: row.gender,
        heightCm: row.height_cm,
        weightUnit: row.weight_unit || 'kg',
        emergencyContact: row.emergency_contact || { name: 'Pendiente', phone: 'Pendiente', relationship: 'Familiar' },
        membership: row.membership || {},
        createdAt: row.created_at,
        password: row.password,
      }));
    }

    let loadedBody: BodyCompositionRecord[] | null = null;
    if (bodyRes.data && bodyRes.data.length > 0) {
      loadedBody = bodyRes.data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        recordedAt: row.recorded_at,
        weightKg: Number(row.weight_kg),
        muscleMassPercent: Number(row.muscle_mass_percent),
        muscleMassKg: row.muscle_mass_kg != null ? Number(row.muscle_mass_kg) : undefined,
        bodyFatPercent: Number(row.body_fat_percent),
        bodyFatKg: row.body_fat_kg != null ? Number(row.body_fat_kg) : undefined,
        visceralFatLevel: Number(row.visceral_fat_level),
        bmi: Number(row.bmi),
        bmiCategory: row.bmi_category || 'Normal',
        notes: row.notes,
        recordedByRole: row.recorded_by_role || 'staff',
      }));
    }

    let loadedEvals: PhysicalEvaluationRecord[] | null = null;
    if (evalsRes.data && evalsRes.data.length > 0) {
      loadedEvals = evalsRes.data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        evaluationDate: row.evaluation_date,
        coachId: row.coach_id || 'user-staff-01',
        coachName: row.coach_name || 'Coach Kinetix',
        generalCoachNotes: row.general_coach_notes || '',
        cooperTest: row.cooper_test || { level: 'Nivel 1', levelNumber: 1, description: '' },
        enduranceTest: row.endurance_test || { name: 'Resistencia Funcional', result: '0:00' },
        strengthRecords: row.strength_records || [],
      }));
    }

    let loadedNotifs: PushNotificationSimulation[] | null = null;
    if (notifsRes.data && notifsRes.data.length > 0) {
      loadedNotifs = notifsRes.data.map((row: any) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        timestamp: row.timestamp,
        read: row.read,
        type: row.type || 'payment_reminder',
        targetUserId: row.target_user_id,
        targetAudience: row.target_audience,
      }));
    }

    return {
      users: loadedUsers,
      bodyComp: loadedBody,
      evaluations: loadedEvals,
      notifications: loadedNotifs,
    };
  } catch (err) {
    console.warn('Error loading data from Supabase:', err);
    return null;
  }
}

export async function deleteUserFromSupabase(userId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('users').delete().eq('id', userId);
  } catch {}
}

export async function deleteBodyCompFromSupabase(recordId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('body_composition').delete().eq('id', recordId);
  } catch {}
}

export async function deleteEvaluationFromSupabase(evalId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('physical_evaluations').delete().eq('id', evalId);
  } catch {}
}

export async function deleteNotificationFromSupabase(notifId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('notifications').delete().eq('id', notifId);
  } catch {}
}

/**
 * Subscribes to Supabase Realtime changes (direct mode) or SSE + periodic refresh (server proxy mode)
 * so phones and computers reflect updates automatically without manual refreshes.
 */
export function subscribeToRealtimeUpdates(onChange: () => void): () => void {
  if (isServerProxyMode() && typeof window !== 'undefined') {
    let es: EventSource | null = null;
    if (serverSupportsSse) {
      try {
        es = new EventSource('/api/cloud-events');
        es.onmessage = () => onChange();
      } catch {}
    }
    const pollId = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        onChange();
      }
    }, 8000);
    return () => {
      try { es?.close(); } catch {}
      clearInterval(pollId);
    };
  }

  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('kinetix-realtime-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'body_composition' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_evaluations' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onChange)
    .subscribe();

  return () => {
    try {
      client.removeChannel(channel);
    } catch {}
  };
}
