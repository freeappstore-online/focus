import { useCallback, useEffect, useState } from "react";
import type { TabId, Phase } from "./types/focus";
import { useFocusStore } from "./hooks/useFocusStore";
import { useHotkeys } from "./hooks/useHotkeys";
import { TimerScreen } from "./components/TimerScreen";
import { TaskList } from "./components/TaskList";
import { StatsScreen } from "./components/StatsScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { formatMMSS } from "./lib/time";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "timer",
    label: "Timer",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2 2" />
        <path d="M9 2h6" />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h13" />
        <path d="M3 12h13" />
        <path d="M3 18h13" />
        <path d="m19 5 1 1 2-2" />
        <path d="m19 11 1 1 2-2" />
        <path d="m19 17 1 1 2-2" />
      </svg>
    ),
  },
  {
    id: "stats",
    label: "Stats",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 14v4" />
        <path d="M12 9v9" />
        <path d="M17 5v13" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </svg>
    ),
  },
];

const PHASE_TITLE: Record<Phase, string> = {
  work: "Focus",
  short: "Short Break",
  long: "Long Break",
};

export default function App() {
  const store = useFocusStore();
  const [activeTab, setActiveTab] = useState<TabId>("timer");
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  // Hotkey handlers (memoized via direct refs to store actions)
  const onToggleStart = useCallback(() => {
    if (store.status === "running") store.pause();
    else store.start();
  }, [store]);

  const onNewTaskHotkey = useCallback(() => {
    setActiveTab("tasks");
    setNewTaskOpen(true);
  }, []);

  useHotkeys({
    onToggleStart,
    onReset: store.reset,
    onSkip: store.skip,
    onNewTask: onNewTaskHotkey,
  });

  // Document title reflects countdown + phase
  useEffect(() => {
    const base = "Focus Timer";
    if (store.status === "running" || store.status === "paused") {
      document.title = `${formatMMSS(store.remainingSec)} • ${PHASE_TITLE[store.phase]} — ${base}`;
    } else {
      document.title = `${base} — FreeAppStore`;
    }
  }, [store.remainingSec, store.status, store.phase]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--glass)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
            style={{ background: "var(--accent)" }}
            aria-hidden
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>
          <h1 className="font-serif text-lg" style={{ color: "var(--ink)", fontWeight: 600 }}>
            Focus
          </h1>
        </div>
        <div
          className="rounded-lg px-2.5 py-1 text-xs font-medium tabular-nums"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
          }}
        >
          {store.status === "running" || store.status === "paused"
            ? `${formatMMSS(store.remainingSec)}`
            : `${PHASE_TITLE[store.phase]}`}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        {activeTab === "timer" && (
          <TimerScreen
            store={store}
            onNewTask={() => {
              setActiveTab("tasks");
              setNewTaskOpen(true);
            }}
          />
        )}

        {activeTab === "tasks" && (
          <TaskList
            store={store}
            newTaskOpen={newTaskOpen}
            setNewTaskOpen={setNewTaskOpen}
          />
        )}

        {activeTab === "stats" && <StatsScreen sessions={store.sessions} />}

        {activeTab === "settings" && (
          <SettingsScreen settings={store.settings} onUpdate={store.updateSettings} />
        )}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-lg items-center justify-around py-2"
        style={{
          background: "var(--dock)",
          borderTop: "1px solid var(--line)",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
              style={{ color: isActive ? "var(--accent)" : "var(--muted)" }}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
