import { createClient } from '@supabase/supabase-js';
import { PrivacyConsentRecord } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * SQL Schema for Supabase Table `privacy_consents`:
 * 
 * create table if not exists public.privacy_consents (
 *   consent_id text primary key,
 *   user_id text not null,
 *   user_email text not null,
 *   privacy_notice_version text not null,
 *   privacy_notice_accepted boolean not null default true,
 *   sensitive_data_consent boolean not null default true,
 *   accepted_at timestamp with time zone not null,
 *   consent_date text,
 *   consent_time text,
 *   consent_method text not null default 'authenticated_user_checkbox',
 *   medio text not null default 'Kinetix Progress',
 *   platform text not null default 'Kinetix Progress',
 *   created_at timestamp with time zone default now()
 * );
 * 
 * -- Enable Row Level Security (RLS)
 * alter table public.privacy_consents enable row level security;
 * 
 * -- Allow insert from authenticated clients
 * create policy "Enable insert for privacy consents" 
 *   on public.privacy_consents for insert 
 *   with check (true);
 * 
 * -- Allow read for own records
 * create policy "Enable read for users" 
 *   on public.privacy_consents for select 
 *   using (true);
 */

/**
 * Saves a privacy consent record to Supabase (if configured) and persists locally.
 */
export async function saveConsentRecord(record: PrivacyConsentRecord): Promise<boolean> {
  // Always persist locally in localStorage for instant offline access & resilience
  try {
    const rawSaved = localStorage.getItem('kinetix_privacy_consents') || '{}';
    const allConsents = JSON.parse(rawSaved);
    const userConsents = allConsents[record.user_id] || [];
    allConsents[record.user_id] = [...userConsents, record];
    localStorage.setItem('kinetix_privacy_consents', JSON.stringify(allConsents));
  } catch (err) {
    console.warn('Error saving consent locally to localStorage:', err);
  }

  // If Supabase is connected, persist to remote PostgreSQL table
  if (supabase) {
    try {
      const { error } = await supabase.from('privacy_consents').upsert({
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
 * Fetches consent records from Supabase (if available) with local fallback.
 */
export async function fetchUserConsents(userId: string): Promise<PrivacyConsentRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('privacy_consents')
        .select('*')
        .eq('user_id', userId)
        .order('accepted_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as PrivacyConsentRecord[];
      }
    } catch (e) {
      console.warn('Error fetching consents from Supabase:', e);
    }
  }

  // Fallback to localStorage
  try {
    const rawSaved = localStorage.getItem('kinetix_privacy_consents') || '{}';
    const allConsents = JSON.parse(rawSaved);
    return allConsents[userId] || [];
  } catch {
    return [];
  }
}
