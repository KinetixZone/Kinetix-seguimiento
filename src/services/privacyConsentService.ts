import { PrivacyConsentRecord } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { CURRENT_PRIVACY_NOTICE_VERSION } from '../data/privacyNoticeContent';

const STORAGE_KEY = 'kinetix_privacy_consents';

/**
 * SQL SCHEMA FOR SUPABASE:
 * Run this in the Supabase SQL Editor if you wish to persist consents directly in PostgreSQL:
 * 
 * CREATE TABLE IF NOT EXISTS privacy_consents (
 *   consent_id TEXT PRIMARY KEY,
 *   user_id TEXT NOT NULL,
 *   user_email TEXT NOT NULL,
 *   privacy_notice_version TEXT NOT NULL,
 *   privacy_notice_accepted BOOLEAN NOT NULL DEFAULT true,
 *   sensitive_data_consent BOOLEAN NOT NULL DEFAULT true,
 *   accepted_at TIMESTAMPTZ NOT NULL,
 *   consent_date TEXT,
 *   consent_time TEXT,
 *   consent_method TEXT NOT NULL,
 *   medio TEXT NOT NULL DEFAULT 'Kinetix Progress',
 *   platform TEXT NOT NULL DEFAULT 'Kinetix Progress',
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

export function getLocalConsents(): Record<string, PrivacyConsentRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function hasUserConsentedCurrentVersion(userId: string): boolean {
  const consents = getLocalConsents();
  const userList = consents[userId] || [];
  return userList.some(
    (c) =>
      c.privacy_notice_version === CURRENT_PRIVACY_NOTICE_VERSION &&
      c.privacy_notice_accepted &&
      c.sensitive_data_consent
  );
}

export async function saveConsentRecord(record: PrivacyConsentRecord): Promise<void> {
  // 1. Local Storage persistence (Immediate & offline-ready)
  try {
    const current = getLocalConsents();
    const userList = current[record.user_id] || [];
    const updated = {
      ...current,
      [record.user_id]: [...userList, record],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving consent to localStorage:', err);
  }

  // 2. Supabase Cloud Database persistence (when connected)
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('privacy_consents').upsert([
        {
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
        },
      ]);
      if (error) {
        console.warn('Notice: Supabase consent upsert result:', error.message);
      }
    } catch (err) {
      console.warn('Notice: Supabase network or table sync skipped:', err);
    }
  }
}
