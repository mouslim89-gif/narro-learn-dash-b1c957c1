// Daily review reminder notifications.
// Native: Capacitor Local Notifications (scheduled on-device, works app closed).
// Web fallback: Notification API + in-page timer (fires while the app is open).

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NOTIF_ID = 1001;

interface ReminderOptions {
  enabled: boolean;
  /** "HH:mm" 24h */
  time: string;
  dueCount: number;
}

let webTimer: number | null = null;

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = (time || '19:00').split(':').map((n) => parseInt(n, 10));
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 19,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

function reminderBody(dueCount: number): string {
  return dueCount > 0
    ? `${dueCount} card${dueCount === 1 ? ' is' : 's are'} waiting for you.`
    : 'A quick review keeps your streak alive.';
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted';
    }
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export async function cancelDailyReviewReminder(): Promise<void> {
  if (webTimer !== null) {
    clearTimeout(webTimer);
    webTimer = null;
  }
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
    } catch {
      /* ignore */
    }
  }
}

/** (Re)schedule the daily review reminder. Safe to call often. */
export async function scheduleDailyReviewReminder(opts: ReminderOptions): Promise<void> {
  await cancelDailyReviewReminder();
  if (!opts.enabled) return;

  const { hour, minute } = parseTime(opts.time);
  const body = reminderBody(opts.dueCount);

  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') return;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIF_ID,
            title: 'Time for your reviews',
            body,
            schedule: { on: { hour, minute }, allowWhileIdle: true },
          },
        ],
      });
    } catch {
      /* ignore */
    }
    return;
  }

  // Web fallback — only fires while the app is open.
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - now.getTime();
  webTimer = window.setTimeout(() => {
    try {
      new Notification('Time for your reviews', { body });
    } catch {
      /* ignore */
    }
  }, delay);
}
