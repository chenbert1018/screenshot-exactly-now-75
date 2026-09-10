import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  type LocalNotificationSchema,
} from "@capacitor/local-notifications";

import {
  eventTypeMeta,
  type IdolEvent,
} from "./events";

/**
 * IdolDays D-Day Local Notifications
 *
 * 每個活動最多建立：
 * D-30 / D-7 / D-1 / D-DAY
 *
 * 通知時間：
 * 當地時間上午 09:00
 */

const REMINDER_DAYS = [30, 7, 3, 1, 0] as const;
const NOTIFICATION_HOUR = 9;

function isIOSNative(): boolean {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "ios"
  );
}

/**
 * LocalNotifications 要求數字 ID。
 * 從 event.id + reminderDays 穩定產生正整數，
 * 確保修改活動時可以取消舊通知。
 */
function hashString(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

function notificationId(
  eventId: string,
  reminderDays: number,
): number {
  const suffix =
    reminderDays === 30
      ? 30
      : reminderDays === 7
        ? 7
        : reminderDays === 1
          ? 1
          : 0;

  // 保持在安全的正整數範圍
  return (
    (hashString(`idoldays:${eventId}`) % 20_000_000) * 100 +
    suffix +
    1
  );
}

function parseEventDate(
  date: string,
  daysBefore: number,
): Date | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const target = new Date(
    year,
    month - 1,
    day,
    NOTIFICATION_HOUR,
    0,
    0,
    0,
  );

  target.setDate(target.getDate() - daysBefore);

  return Number.isNaN(target.getTime())
    ? null
    : target;
}

function notificationCopy(
  event: IdolEvent,
  daysBefore: number,
): {
  title: string;
  body: string;
} {
  const meta = eventTypeMeta(event.type);

  if (daysBefore === 0) {
    return {
      title: `${meta.emoji} 今天就是重要的日子`,
      body: `${event.title} 就在今天 ♡`,
    };
  }

  if (daysBefore === 1) {
    return {
      title: `${meta.emoji} 明天就是重要的日子`,
      body: `再一天就是 ${event.title} 了 ♡`,
    };
  }

  return {
    title: `${meta.emoji} D-${daysBefore}`,
    body: `再 ${daysBefore} 天就是 ${event.title} 了 ✨`,
  };
}

/**
 * 第一次需要排通知時才要求權限。
 */
export async function ensureNotificationPermission():
  Promise<boolean> {
  if (!isIOSNative()) return false;

  try {
    let permission =
      await LocalNotifications.checkPermissions();

    if (permission.display === "prompt") {
      permission =
        await LocalNotifications.requestPermissions();
    }

    return permission.display === "granted";
  } catch (error) {
    console.error(
      "[IdolDays Notifications] Permission failed:",
      error,
    );

    return false;
  }
}

/**
 * 取消某一活動的全部 D-Day 通知。
 */
export async function cancelEventNotifications(
  eventId: string,
): Promise<void> {
  if (!isIOSNative()) return;

  try {
    await LocalNotifications.cancel({
      notifications: REMINDER_DAYS.map((days) => ({
        id: notificationId(eventId, days),
      })),
    });
  } catch (error) {
    console.error(
      "[IdolDays Notifications] Cancel failed:",
      error,
    );
  }
}

/**
 * 為單一活動重新建立 D-Day 通知。
 *
 * 先取消舊通知，因此：
 * - 修改日期不會留下舊通知
 * - 不會重複排程
 * - 已經過期的提醒不建立
 */
export async function scheduleEventNotifications(
  event: IdolEvent,
  daysBefore: number | null,
): Promise<number> {
  if (!isIOSNative()) return 0;

  // 不提醒 = 清除這個活動所有既有通知
  if (daysBefore === null) {
    await cancelEventNotifications(event.id);
    return 0;
  }

  const granted =
    await ensureNotificationPermission();

  if (!granted) return 0;

  // 修改提醒時間或活動日期時，先清掉舊排程
  await cancelEventNotifications(event.id);

  const at = parseEventDate(
    event.date,
    daysBefore,
  );

  // 已經過去的提醒不補發
  if (!at || at.getTime() <= Date.now()) {
    return 0;
  }

  const copy =
    notificationCopy(event, daysBefore);

  const notification: LocalNotificationSchema = {
    id: notificationId(
      event.id,
      daysBefore,
    ),
    title: copy.title,
    body: copy.body,
    schedule: {
      at,
      allowWhileIdle: true,
    },
    extra: {
      eventId: event.id,
      eventType: event.type,
      eventDate: event.date,
      reminderDays: daysBefore,
    },
  };

  try {
    await LocalNotifications.schedule({
      notifications: [notification],
    });

    return 1;
  } catch (error) {
    console.error(
      "[IdolDays Notifications] Schedule failed:",
      error,
    );

    return 0;
  }
}
