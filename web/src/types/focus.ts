// --- Core domain types for the Focus / Pomodoro app ---

export type Phase = "work" | "short" | "long";

export type TimerStatus = "idle" | "running" | "paused";

export type TabId = "timer" | "tasks" | "stats" | "settings";

export interface Task {
  id: string;
  title: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  done: boolean;
  createdAt: string; // ISO
}

export interface SessionLogEntry {
  id: string;
  phase: Phase;
  taskId: string | null;
  taskTitle: string | null;
  durationSec: number; // actual duration completed
  startedAt: string; // ISO
  completedAt: string; // ISO
}

export interface FocusSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number; // default 4
  autoStartNext: boolean;
  soundEnabled: boolean;
  tickingEnabled: boolean;
}

export const DEFAULT_SETTINGS: FocusSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartNext: false,
  soundEnabled: true,
  tickingEnabled: false,
};

export interface DailyStats {
  pomodorosToday: number;
  focusSecondsToday: number;
  streakDays: number;
}
