import { useState } from "react";
import type { FocusStore } from "../hooks/useFocusStore";
import { TimerRing } from "./TimerRing";
import { TimerControls } from "./TimerControls";
import { QuoteCard } from "./QuoteCard";
import { Checklist } from "./Checklist";

interface TimerScreenProps {
  store: FocusStore;
  onNewTask: () => void;
}

const PHASE_TINT: Record<string, string> = {
  work: "var(--tint-work)",
  short: "var(--tint-short)",
  long: "var(--tint-long)",
};

export function TimerScreen({ store, onNewTask }: TimerScreenProps) {
  const {
    phase,
    status,
    remainingSec,
    totalSec,
    completedCycles,
    start,
    pause,
    reset,
    skip,
    tasks,
    activeTaskId,
    setActiveTaskId,
    settings,
  } = store;

  // Pre-session checklist shown only when idle, at the very start of a work phase, and the user hasn't dismissed it.
  const [showChecklist, setShowChecklist] = useState(false);

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;
  const cyclesInRound = completedCycles % Math.max(1, settings.cyclesBeforeLongBreak);
  const cycleDots = Math.max(1, settings.cyclesBeforeLongBreak);

  const tint = PHASE_TINT[phase] ?? "transparent";

  const handlePrimaryStart = () => {
    // If this is the start of a work phase and the timer is idle, surface the checklist first.
    if (status === "idle" && phase === "work" && !showChecklist) {
      setShowChecklist(true);
      return;
    }
    start();
  };

  return (
    <div
      className="phase-tint flex flex-col items-center gap-6 rounded-3xl p-6"
      style={{ background: tint }}
    >
      {/* Cycle dots */}
      <div className="flex items-center gap-1.5" aria-label={`${cyclesInRound} of ${cycleDots} cycles complete`}>
        {Array.from({ length: cycleDots }, (_, i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full"
            style={{
              background: i < cyclesInRound ? "var(--accent)" : "var(--line-strong)",
              opacity: i < cyclesInRound ? 1 : 0.5,
            }}
          />
        ))}
      </div>

      <TimerRing phase={phase} remainingSec={remainingSec} totalSec={totalSec} />

      <TimerControls
        status={status}
        onStart={handlePrimaryStart}
        onPause={pause}
        onReset={reset}
        onSkip={skip}
      />

      {/* Active task selector */}
      <div className="w-full">
        {activeTask ? (
          <div
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Working on
              </div>
              <div className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                {activeTask.title}
              </div>
              <div className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                {activeTask.completedPomodoros} / {activeTask.estimatedPomodoros} pomodoros
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTaskId(null)}
              className="text-xs font-medium"
              style={{ color: "var(--muted)" }}
              aria-label="Clear active task"
            >
              clear
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onNewTask}
            className="w-full rounded-xl py-3 text-sm font-medium"
            style={{
              background: "transparent",
              color: "var(--muted)",
              border: "1px dashed var(--line-strong)",
            }}
          >
            + Pick or add a task (N)
          </button>
        )}
      </div>

      {/* Break-time quote */}
      {(phase === "short" || phase === "long") && (
        <QuoteCard seed={completedCycles} />
      )}

      {/* Pre-session checklist (modal-ish inline) */}
      {showChecklist && phase === "work" && status === "idle" && (
        <Checklist
          onStart={() => {
            setShowChecklist(false);
            start();
          }}
          onSkip={() => setShowChecklist(false)}
        />
      )}
    </div>
  );
}
