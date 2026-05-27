import type { SessionLogEntry, DailyStats } from "../types/focus";
import { localDateKey, todayKey, daysAgoKey } from "./time";

/** Sessions only count work phases for stats. */
function isWork(s: SessionLogEntry): boolean {
  return s.phase === "work";
}

export function computeDailyStats(sessions: SessionLogEntry[]): DailyStats {
  const today = todayKey();
  let pomodorosToday = 0;
  let focusSecondsToday = 0;

  for (const s of sessions) {
    if (!isWork(s)) continue;
    const key = localDateKey(new Date(s.completedAt));
    if (key === today) {
      pomodorosToday += 1;
      focusSecondsToday += s.durationSec;
    }
  }

  const streakDays = computeStreak(sessions);
  return { pomodorosToday, focusSecondsToday, streakDays };
}

/** Streak: consecutive days (counting today if active) with at least 1 work pomodoro. */
export function computeStreak(sessions: SessionLogEntry[]): number {
  const daysWithPomodoro = new Set<string>();
  for (const s of sessions) {
    if (!isWork(s)) continue;
    daysWithPomodoro.add(localDateKey(new Date(s.completedAt)));
  }

  let streak = 0;
  let offset = 0;
  // If today has none, the streak continues from yesterday backward — but only
  // if yesterday had one. So we start the walk at offset 0 (today).
  // Convention: streak excludes today if today is empty (a streak you "have" right now).
  const todaysKey = todayKey();
  if (!daysWithPomodoro.has(todaysKey)) {
    offset = 1;
  }
  while (true) {
    const key = daysAgoKey(offset);
    if (daysWithPomodoro.has(key)) {
      streak += 1;
      offset += 1;
    } else {
      break;
    }
  }
  return streak;
}

/** Pomodoros per day for the last N days, oldest → newest. */
export function pomodorosPerDay(
  sessions: SessionLogEntry[],
  days: number,
): { dateKey: string; count: number }[] {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i -= 1) {
    buckets.set(daysAgoKey(i), 0);
  }
  for (const s of sessions) {
    if (s.phase !== "work") continue;
    const key = localDateKey(new Date(s.completedAt));
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  return [...buckets.entries()].map(([dateKey, count]) => ({ dateKey, count }));
}

/** Focus seconds per day for last N days, oldest → newest. */
export function focusSecondsPerDay(
  sessions: SessionLogEntry[],
  days: number,
): { dateKey: string; seconds: number }[] {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i -= 1) {
    buckets.set(daysAgoKey(i), 0);
  }
  for (const s of sessions) {
    if (s.phase !== "work") continue;
    const key = localDateKey(new Date(s.completedAt));
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + s.durationSec);
    }
  }
  return [...buckets.entries()].map(([dateKey, seconds]) => ({ dateKey, seconds }));
}

/** Heatmap: pomodoros-completed counts bucketed by hour-of-day (0..23). */
export function pomodorosByHour(sessions: SessionLogEntry[]): number[] {
  const out = new Array<number>(24).fill(0);
  for (const s of sessions) {
    if (s.phase !== "work") continue;
    const hr = new Date(s.completedAt).getHours();
    if (hr >= 0 && hr < 24) {
      out[hr] = (out[hr] ?? 0) + 1;
    }
  }
  return out;
}
