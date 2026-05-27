import { useCallback, useMemo } from "react";
import type { SessionLogEntry } from "../types/focus";
import {
  computeDailyStats,
  pomodorosPerDay,
  focusSecondsPerDay,
  pomodorosByHour,
} from "../lib/stats";
import { drawBarChart, drawLineChart, drawHourHeatmap } from "../lib/charts";
import { useCanvasChart } from "../hooks/useCanvasChart";
import { formatDurationHuman, shortDayLabel } from "../lib/time";

interface StatsScreenProps {
  sessions: SessionLogEntry[];
}

export function StatsScreen({ sessions }: StatsScreenProps) {
  const stats = useMemo(() => computeDailyStats(sessions), [sessions]);

  const perDay = useMemo(() => pomodorosPerDay(sessions, 30), [sessions]);
  const secPerDay = useMemo(() => focusSecondsPerDay(sessions, 30), [sessions]);
  const byHour = useMemo(() => pomodorosByHour(sessions), [sessions]);

  const barData = useMemo(
    () => perDay.map((d) => ({ label: shortDayLabel(d.dateKey), value: d.count })),
    [perDay],
  );
  const lineData = useMemo(
    () =>
      secPerDay.map((d) => ({
        label: shortDayLabel(d.dateKey),
        value: Math.round(d.seconds / 60), // minutes for chart
      })),
    [secPerDay],
  );

  const drawBar = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => drawBarChart(ctx, barData, w, h),
    [barData],
  );
  const drawLine = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => drawLineChart(ctx, lineData, w, h),
    [lineData],
  );
  const drawHeat = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => drawHourHeatmap(ctx, byHour, w, h),
    [byHour],
  );

  const barRef = useCanvasChart(drawBar);
  const lineRef = useCanvasChart(drawLine);
  const heatRef = useCanvasChart(drawHeat);

  const totalPomodoros = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.phase === "work" ? 1 : 0), 0),
    [sessions],
  );

  // Latest 8 sessions (newest first)
  const recent = useMemo(
    () =>
      sessions
        .filter((s) => s.phase === "work")
        .slice()
        .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))
        .slice(0, 8),
    [sessions],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Today summary */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Today" value={stats.pomodorosToday.toString()} sub="pomodoros" />
        <StatCard label="Focus" value={formatDurationHuman(stats.focusSecondsToday)} sub="today" />
        <StatCard label="Streak" value={stats.streakDays.toString()} sub={stats.streakDays === 1 ? "day" : "days"} />
      </div>

      {/* Total */}
      <div
        className="rounded-xl px-4 py-3 text-sm"
        style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--muted)" }}
      >
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>
          {totalPomodoros}
        </span>{" "}
        pomodoros completed all-time
      </div>

      {/* Pomodoros per day */}
      <ChartCard title="Pomodoros per day" subtitle="Last 30 days">
        <canvas ref={barRef} className="absolute inset-0" />
      </ChartCard>

      {/* Focus minutes per day */}
      <ChartCard title="Focus minutes per day" subtitle="Last 30 days">
        <canvas ref={lineRef} className="absolute inset-0" />
      </ChartCard>

      {/* Hour-of-day */}
      <ChartCard title="When you focus" subtitle="Hour of day, all-time" height={96}>
        <canvas ref={heatRef} className="absolute inset-0" />
      </ChartCard>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
            Recent sessions
          </h3>
          <ul className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
            {recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate" style={{ color: "var(--ink)" }}>
                    {s.taskTitle ?? "(no task)"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {new Date(s.completedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {formatDurationHuman(s.durationSec)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <div className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div
        className="font-serif text-2xl"
        style={{ color: "var(--ink)", fontWeight: 600, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        {sub}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  height = 160,
  children,
}: {
  title: string;
  subtitle?: string;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-medium" style={{ color: "var(--ink)" }}>
          {title}
        </h3>
        {subtitle && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {subtitle}
          </span>
        )}
      </div>
      <div className="relative" style={{ height }}>
        {children}
      </div>
    </div>
  );
}
