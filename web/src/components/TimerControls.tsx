import type { TimerStatus } from "../types/focus";

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({ status, onStart, onPause, onReset, onSkip }: TimerControlsProps) {
  const isRunning = status === "running";

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onReset}
        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium"
        style={{
          background: "var(--panel)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
        }}
        aria-label="Reset timer (R)"
        title="Reset (R)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>

      <button
        type="button"
        onClick={isRunning ? onPause : onStart}
        className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-sm transition-transform active:scale-95"
        style={{ background: "var(--accent)" }}
        aria-label={isRunning ? "Pause (Space)" : "Start (Space)"}
        title={isRunning ? "Pause (Space)" : "Start (Space)"}
      >
        {isRunning ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7-11-7z" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium"
        style={{
          background: "var(--panel)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
        }}
        aria-label="Skip phase (S)"
        title="Skip (S)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4l10 8-10 8V4z" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      </button>
    </div>
  );
}
