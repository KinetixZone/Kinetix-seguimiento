import { PushNotificationSimulation } from '../types';

const NOTIFIED_STORAGE_KEY = 'kinetix_os_notified_ids';
const MAX_STORED_NOTIF_IDS = 200;

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getPushPermissionStatus(): PushPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as PushPermissionStatus;
}

function getNotifiedIdsSet(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function saveNotifiedIdsSet(ids: Set<string>) {
  try {
    const trimmed = Array.from(ids).slice(-MAX_STORED_NOTIF_IDS);
    localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

export async function showSystemNotification(title: string, body: string, tag?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const options: NotificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: tag || `kinetix-${Date.now()}`,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
  } catch {}

  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

export async function requestPushNotificationPermission(): Promise<PushPermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      await showSystemNotification(
        '🔔 Alertas Kinetix Activadas',
        'Recibirás avisos del Coach, recordatorios de corte y nuevas marcas directamente en tu dispositivo.',
        'kinetix-welcome-push'
      );
    }
    return result as PushPermissionStatus;
  } catch {
    return getPushPermissionStatus();
  }
}

/**
 * Fires real browser/PWA notifications at most once per notification ID
 * so refreshing the page never re-triggers already delivered alerts.
 */
export async function deliverUnreadBrowserNotifications(
  notifications: PushNotificationSimulation[],
  isInitialHydration: boolean
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  const notifiedSet = getNotifiedIdsSet();
  const unread = notifications.filter(n => !n.read);

  // On very first boot on a fresh device (no history recorded yet), seed existing
  // historical unread IDs without flooding the user's notification tray.
  if (isInitialHydration && notifiedSet.size === 0) {
    unread.forEach(n => notifiedSet.add(n.id));
    saveNotifiedIdsSet(notifiedSet);
    return;
  }

  if (Notification.permission !== 'granted') return;

  const freshUnread = unread.filter(n => !notifiedSet.has(n.id));
  if (freshUnread.length === 0) return;

  // Deliver up to 3 latest notifications cleanly to avoid OS spam
  const toDeliver = freshUnread.slice(0, 3);
  for (const notif of toDeliver) {
    await showSystemNotification(notif.title, notif.body, `kinetix-${notif.id}`);
    notifiedSet.add(notif.id);
  }
  freshUnread.forEach(n => notifiedSet.add(n.id));
  saveNotifiedIdsSet(notifiedSet);
}
