import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Task,
  SessionLogEntry,
  FocusSettings,
  Phase,
  TimerStatus,
} from "../types/focus";
import {
  loadTasks,
  saveTasks,
  loadSessions,
  saveSessions,
  loadSettings,
  saveSettings,
  loadActiveTaskId,
  saveActiveTaskId,
  loadCompletedCycles,
  saveCompletedCycles,
} from "../lib/storage";
import { playBell, playTick, unlockAudio } from "../lib/audio";

// --- Helpers ---

function phaseDurationSec(phase: Phase, s: FocusSettings): number {
  switch (phase) {
    case "work":
      return Math.max(1, Math.round(s.workMinutes * 60));
    case "short":
      return Math.max(1, Math.round(s.shortBreakMinutes * 60));
    case "long":
      return Math.max(1, Math.round(s.longBreakMinutes * 60));
  }
}

function nextPhase(current: Phase, completedCyclesAfter: number, s: FocusSettings): Phase {
  if (current === "work") {
    // After a work session: long break every Nth, else short.
    return completedCyclesAfter % Math.max(1, s.cyclesBeforeLongBreak) === 0 ? "long" : "short";
  }
  // After any break, return to work.
  return "work";
}

export interface FocusStore {
  // --- Tasks ---
  tasks: Task[];
  activeTaskId: string | null;
  addTask: (title: string, estimatedPomodoros: number) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
  setActiveTaskId: (id: string | null) => void;

  // --- Sessions ---
  sessions: SessionLogEntry[];

  // --- Settings ---
  settings: FocusSettings;
  updateSettings: (updates: Partial<FocusSettings>) => void;

  // --- Timer ---
  phase: Phase;
  status: TimerStatus;
  remainingSec: number;
  totalSec: number;
  completedCycles: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
}

export function useFocusStore(): FocusStore {
  // --- Persistent state ---
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [activeTaskId, setActiveTaskIdState] = useState<string | null>(() => loadActiveTaskId());
  const [sessions, setSessions] = useState<SessionLogEntry[]>(() => loadSessions());
  const [settings, setSettings] = useState<FocusSettings>(() => loadSettings());
  const [completedCycles, setCompletedCycles] = useState<number>(() => loadCompletedCycles());

  // --- Timer state ---
  const [phase, setPhase] = useState<Phase>("work");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [totalSec, setTotalSec] = useState<number>(() => phaseDurationSec("work", loadSettings()));
  const [remainingSec, setRemainingSec] = useState<number>(totalSec);

  // Refs to track timer driving without re-renders
  const endTimestampRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const audioTickIntervalRef = useRef<number | null>(null);
  const sessionStartedAtRef = useRef<string | null>(null);
  const sessionStartTaskRef = useRef<{ id: string | null; title: string | null } | null>(null);
  const startInternalRef = useRef<((forPhase: Phase, durationSec: number) => void) | null>(null);

  // --- Persistence side-effects ---
  useEffect(() => saveTasks(tasks), [tasks]);
  useEffect(() => saveSessions(sessions), [sessions]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveActiveTaskId(activeTaskId), [activeTaskId]);
  useEffect(() => saveCompletedCycles(completedCycles), [completedCycles]);

  // --- If durations change while idle, reflect them in the visible countdown ---
  useEffect(() => {
    if (status !== "idle") return;
    const d = phaseDurationSec(phase, settings);
    setTotalSec(d);
    setRemainingSec(d);
  }, [phase, status, settings]);

  // --- Stop all intervals ---
  const stopIntervals = useCallback(() => {
    if (tickIntervalRef.current !== null) {
      window.clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    if (audioTickIntervalRef.current !== null) {
      window.clearInterval(audioTickIntervalRef.current);
      audioTickIntervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stopIntervals(), [stopIntervals]);

  // --- Internal: complete current phase, log, advance ---
  const completePhase = useCallback(() => {
    stopIntervals();
    endTimestampRef.current = null;

    const completedAt = new Date().toISOString();
    const startedAt = sessionStartedAtRef.current ?? completedAt;
    const taskSnap = sessionStartTaskRef.current ?? { id: null, title: null };
    const durationSec = totalSec;

    // Log entry
    const entry: SessionLogEntry = {
      id: crypto.randomUUID(),
      phase,
      taskId: taskSnap.id,
      taskTitle: taskSnap.title,
      durationSec,
      startedAt,
      completedAt,
    };
    setSessions((prev) => [...prev, entry]);

    // Phase-specific updates
    let newCompletedCycles = completedCycles;
    if (phase === "work") {
      newCompletedCycles = completedCycles + 1;
      setCompletedCycles(newCompletedCycles);

      // bump completedPomodoros on the active task (if any)
      if (taskSnap.id) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskSnap.id ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t,
          ),
        );
      }
    }

    // Bell
    if (settings.soundEnabled) playBell();

    // Advance phase
    const next = nextPhase(phase, newCompletedCycles, settings);
    setPhase(next);
    const nextDur = phaseDurationSec(next, settings);
    setTotalSec(nextDur);
    setRemainingSec(nextDur);

    sessionStartedAtRef.current = null;
    sessionStartTaskRef.current = null;

    // Auto-start next?
    if (settings.autoStartNext) {
      // Defer to next tick so React applies state first; route through the ref
      // so we never close over a stale startInternal.
      window.setTimeout(() => {
        const fn = startInternalRef.current;
        if (fn) fn(next, nextDur);
      }, 60);
    } else {
      setStatus("idle");
    }
  }, [phase, totalSec, completedCycles, settings, stopIntervals]);

  // --- Drive the countdown via animation-frame-ish setInterval (250ms) + endTimestamp ---
  const startTickLoop = useCallback(() => {
    stopIntervals();
    tickIntervalRef.current = window.setInterval(() => {
      const end = endTimestampRef.current;
      if (end === null) return;
      const remainingMs = end - Date.now();
      const newRemaining = Math.max(0, Math.ceil(remainingMs / 1000));
      setRemainingSec(newRemaining);
      if (remainingMs <= 0) {
        completePhase();
      }
    }, 250);
  }, [stopIntervals, completePhase]);

  const startTickAudio = useCallback(() => {
    if (audioTickIntervalRef.current !== null) {
      window.clearInterval(audioTickIntervalRef.current);
      audioTickIntervalRef.current = null;
    }
    if (settings.tickingEnabled && phase === "work") {
      audioTickIntervalRef.current = window.setInterval(() => playTick(), 1000);
    }
  }, [settings.tickingEnabled, phase]);

  // --- Internal start (used both by user action and by auto-advance) ---
  const startInternal = useCallback(
    (forPhase: Phase, durationSec: number) => {
      // Resume audio context (best-effort) — caller should be in a user gesture.
      unlockAudio().catch(() => {});

      const now = Date.now();
      endTimestampRef.current = now + durationSec * 1000;
      sessionStartedAtRef.current = new Date(now).toISOString();
      // Snapshot active task at the moment we start
      const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;
      sessionStartTaskRef.current = activeTask
        ? { id: activeTask.id, title: activeTask.title }
        : { id: null, title: null };

      setPhase(forPhase);
      setTotalSec(durationSec);
      setRemainingSec(durationSec);
      setStatus("running");
      startTickLoop();
      startTickAudio();
    },
    [tasks, activeTaskId, startTickLoop, startTickAudio],
  );

  // Keep the ref pointing at the latest startInternal for auto-advance callbacks.
  useEffect(() => {
    startInternalRef.current = startInternal;
  }, [startInternal]);

  // --- Public timer controls ---

  const start = useCallback(() => {
    if (status === "running") return;
    if (status === "paused") {
      // Resume: re-anchor endTimestamp using the currently-remaining seconds.
      endTimestampRef.current = Date.now() + remainingSec * 1000;
      // sessionStartedAtRef preserved across pause — represents original start.
      setStatus("running");
      startTickLoop();
      startTickAudio();
      unlockAudio().catch(() => {});
      return;
    }
    // idle → fresh start
    startInternal(phase, totalSec);
  }, [status, remainingSec, startTickLoop, startTickAudio, startInternal, phase, totalSec]);

  const pause = useCallback(() => {
    if (status !== "running") return;
    stopIntervals();
    // Freeze remaining based on now
    const end = endTimestampRef.current;
    if (end !== null) {
      const ms = end - Date.now();
      setRemainingSec(Math.max(0, Math.ceil(ms / 1000)));
    }
    endTimestampRef.current = null;
    setStatus("paused");
  }, [status, stopIntervals]);

  const reset = useCallback(() => {
    stopIntervals();
    endTimestampRef.current = null;
    sessionStartedAtRef.current = null;
    sessionStartTaskRef.current = null;
    const d = phaseDurationSec(phase, settings);
    setTotalSec(d);
    setRemainingSec(d);
    setStatus("idle");
  }, [stopIntervals, phase, settings]);

  const skip = useCallback(() => {
    // Skip = advance to next phase without logging current as complete.
    stopIntervals();
    endTimestampRef.current = null;
    sessionStartedAtRef.current = null;
    sessionStartTaskRef.current = null;

    // For skipping a work phase, do NOT count it as a cycle.
    const next = nextPhase(phase, completedCycles, settings);
    setPhase(next);
    const d = phaseDurationSec(next, settings);
    setTotalSec(d);
    setRemainingSec(d);
    setStatus("idle");
  }, [stopIntervals, phase, completedCycles, settings]);

  // --- Tasks ---

  const addTask = useCallback((title: string, estimatedPomodoros: number) => {
    const trimmed = title.trim();
    if (trimmed.length === 0) return;
    const t: Task = {
      id: crypto.randomUUID(),
      title: trimmed,
      estimatedPomodoros: Math.max(1, Math.floor(estimatedPomodoros)),
      completedPomodoros: 0,
      done: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [t, ...prev]);
  }, []);

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    },
    [],
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (activeTaskId === id) {
        setActiveTaskIdState(null);
      }
    },
    [activeTaskId],
  );

  const toggleTaskDone = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const setActiveTaskId = useCallback((id: string | null) => {
    setActiveTaskIdState(id);
  }, []);

  // --- Settings ---

  const updateSettings = useCallback((updates: Partial<FocusSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    tasks,
    activeTaskId,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskDone,
    setActiveTaskId,

    sessions,

    settings,
    updateSettings,

    phase,
    status,
    remainingSec,
    totalSec,
    completedCycles,
    start,
    pause,
    reset,
    skip,
  };
}
