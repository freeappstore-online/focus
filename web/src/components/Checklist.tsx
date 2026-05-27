import { useState } from "react";

const ITEMS: ReadonlyArray<string> = [
  "Phone face-down or in another room",
  "Close non-essential browser tabs",
  "Mute notifications (Slack, email, chat)",
  "Water and snack within reach",
  "Single, clear task picked",
];

interface ChecklistProps {
  onStart: () => void;
  onSkip: () => void;
}

export function Checklist({ onStart, onSkip }: ChecklistProps) {
  const [checked, setChecked] = useState<boolean[]>(() => new Array(ITEMS.length).fill(false));

  const toggle = (i: number) =>
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const allChecked = checked.every((v) => v);

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <h3
        className="mb-3 font-serif text-lg"
        style={{ color: "var(--ink)", fontWeight: 600 }}
      >
        Before you start
      </h3>
      <ul className="flex flex-col gap-2">
        {ITEMS.map((item, i) => (
          <li key={item}>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={checked[i] ?? false}
                onChange={() => toggle(i)}
                className="h-4 w-4 cursor-pointer"
                style={{ accentColor: "var(--accent)" }}
              />
              <span
                style={{
                  color: checked[i] ? "var(--muted)" : "var(--ink)",
                  textDecoration: checked[i] ? "line-through" : "none",
                }}
              >
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onStart}
          className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          {allChecked ? "Start focusing" : "Start anyway"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg px-3 py-2.5 text-sm font-medium"
          style={{
            background: "var(--panel)",
            color: "var(--muted)",
            border: "1px solid var(--line)",
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
