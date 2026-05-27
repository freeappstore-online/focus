import type { FocusSettings } from "../types/focus";

interface SettingsScreenProps {
  settings: FocusSettings;
  onUpdate: (updates: Partial<FocusSettings>) => void;
}

export function SettingsScreen({ settings, onUpdate }: SettingsScreenProps) {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Durations">
        <NumberRow
          label="Work session"
          unit="min"
          min={1}
          max={120}
          value={settings.workMinutes}
          onChange={(v) => onUpdate({ workMinutes: v })}
        />
        <NumberRow
          label="Short break"
          unit="min"
          min={1}
          max={60}
          value={settings.shortBreakMinutes}
          onChange={(v) => onUpdate({ shortBreakMinutes: v })}
        />
        <NumberRow
          label="Long break"
          unit="min"
          min={1}
          max={120}
          value={settings.longBreakMinutes}
          onChange={(v) => onUpdate({ longBreakMinutes: v })}
        />
        <NumberRow
          label="Cycles before long break"
          unit=""
          min={1}
          max={12}
          value={settings.cyclesBeforeLongBreak}
          onChange={(v) => onUpdate({ cyclesBeforeLongBreak: v })}
        />
      </Section>

      <Section title="Behavior">
        <ToggleRow
          label="Auto-start next session"
          description="Skip the manual start between sessions."
          checked={settings.autoStartNext}
          onChange={(v) => onUpdate({ autoStartNext: v })}
        />
      </Section>

      <Section title="Sound">
        <ToggleRow
          label="Bell at phase change"
          description="Gentle two-tone bell when a session or break ends."
          checked={settings.soundEnabled}
          onChange={(v) => onUpdate({ soundEnabled: v })}
        />
        <ToggleRow
          label="Ticking during work"
          description="Soft tick each second while focusing."
          checked={settings.tickingEnabled}
          onChange={(v) => onUpdate({ tickingEnabled: v })}
        />
      </Section>

      <Section title="Keyboard">
        <div
          className="rounded-xl p-4 text-sm"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <KeyRow keys={["Space"]} label="Start / pause" />
          <KeyRow keys={["R"]} label="Reset" />
          <KeyRow keys={["S"]} label="Skip phase" />
          <KeyRow keys={["N"]} label="New task" />
        </div>
      </Section>

      <p className="px-1 text-xs" style={{ color: "var(--muted)" }}>
        All data is stored locally in your browser. Nothing is sent to a server.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2
        className="px-1 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function NumberRow({
  label,
  unit,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <span className="text-sm" style={{ color: "var(--ink)" }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md text-sm"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.floor(n))));
          }}
          className="w-14 rounded-md px-2 py-1 text-center text-sm tabular-nums"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md text-sm"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
        {unit.length > 0 && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-3"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <span className="flex flex-col">
        <span className="text-sm" style={{ color: "var(--ink)" }}>
          {label}
        </span>
        {description && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {description}
          </span>
        )}
      </span>
      <span
        className="relative inline-block h-6 w-10 shrink-0 rounded-full transition-colors"
        style={{ background: checked ? "var(--accent)" : "var(--line-strong)" }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "calc(100% - 1.375rem)" : "0.125rem" }}
        />
      </span>
    </label>
  );
}

function KeyRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span style={{ color: "var(--ink)" }}>{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="rounded-md px-2 py-0.5 font-mono text-xs"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
