import type { Task, SessionLogEntry, FocusSettings } from "../types/focus";
import { DEFAULT_SETTINGS } from "../types/focus";

const KEYS = {
  tasks: "focus_tasks",
  sessions: "focus_sessions",
  settings: "focus_settings",
  activeTaskId: "focus_active_task_id",
  completedCycles: "focus_completed_cycles",
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Tasks ---
export function loadTasks(): Task[] {
  return load<Task[]>(KEYS.tasks, []);
}
export function saveTasks(tasks: Task[]): void {
  save(KEYS.tasks, tasks);
}

// --- Sessions ---
export function loadSessions(): SessionLogEntry[] {
  return load<SessionLogEntry[]>(KEYS.sessions, []);
}
export function saveSessions(sessions: SessionLogEntry[]): void {
  save(KEYS.sessions, sessions);
}

// --- Settings ---
export function loadSettings(): FocusSettings {
  const stored = load<Partial<FocusSettings>>(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}
export function saveSettings(settings: FocusSettings): void {
  save(KEYS.settings, settings);
}

// --- Active task id ---
export function loadActiveTaskId(): string | null {
  return load<string | null>(KEYS.activeTaskId, null);
}
export function saveActiveTaskId(id: string | null): void {
  save(KEYS.activeTaskId, id);
}

// --- Completed cycles (resets each long break) ---
export function loadCompletedCycles(): number {
  return load<number>(KEYS.completedCycles, 0);
}
export function saveCompletedCycles(n: number): void {
  save(KEYS.completedCycles, n);
}
