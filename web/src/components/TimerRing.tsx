import type { Phase } from "../types/focus";
import { formatMMSS } from "../lib/time";

interface TimerRingProps {
  phase: Phase;
  remainingSec: number;
  totalSec: number;
  size?: number;
}

const PHASE_LABEL: Record<Phase, string> = {
  work: "Focus",
  short: "Short Break",
  long: "Long Break",
};

export function TimerRing({
  phase,
  remainingSec,
  totalSec,
  size = 280,
}: TimerRingProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSec > 0 ? remainingSec / totalSec : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`${PHASE_LABEL[phase]} timer`}
      role="timer"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 250ms linear" }}
        />
      </svg>

      <div className="flex flex-col items-center justify-center gap-1">
        <span
          className="text-xs font-medium uppercase tracking-[0.18em]"
          style={{ color: "var(--muted)" }}
        >
          {PHASE_LABEL[phase]}
        </span>
        <span
          className="font-serif tabular-nums"
          style={{
            color: "var(--ink)",
            fontSize: size * 0.22,
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {formatMMSS(remainingSec)}
        </span>
      </div>
    </div>
  );
}
