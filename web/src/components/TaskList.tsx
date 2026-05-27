import { useState } from "react";
import type { FocusStore } from "../hooks/useFocusStore";
import type { Task } from "../types/focus";

interface TaskListProps {
  store: FocusStore;
  newTaskOpen: boolean;
  setNewTaskOpen: (open: boolean) => void;
}

export function TaskList({ store, newTaskOpen, setNewTaskOpen }: TaskListProps) {
  const { tasks, activeTaskId, addTask, updateTask, deleteTask, toggleTaskDone, setActiveTaskId } = store;

  const [title, setTitle] = useState("");
  const [estimate, setEstimate] = useState(1);

  const handleAdd = () => {
    if (title.trim().length === 0) return;
    addTask(title, estimate);
    setTitle("");
    setEstimate(1);
    setNewTaskOpen(false);
  };

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div className="flex flex-col gap-3">
      {/* Add task */}
      {newTaskOpen ? (
        <div
          className="rounded-xl p-3"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setNewTaskOpen(false);
            }}
            placeholder="What are you working on?"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
              Est. pomodoros
              <input
                type="number"
                min={1}
                max={20}
                value={estimate}
                onChange={(e) => setEstimate(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="w-14 rounded-md px-2 py-1 text-center text-sm"
                style={{
                  background: "var(--paper)",
                  color: "var(--ink)",
                  border: "1px solid var(--line)",
                }}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewTaskOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium"
                style={{
                  background: "transparent",
                  color: "var(--muted)",
                  border: "1px solid var(--line)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                style={{ background: "var(--accent)" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setNewTaskOpen(true)}
          className="rounded-lg py-2.5 text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + New task (N)
        </button>
      )}

      {/* Open tasks */}
      {open.length === 0 && done.length === 0 && (
        <div
          className="rounded-xl p-6 text-center text-sm"
          style={{
            color: "var(--muted)",
            background: "var(--panel)",
            border: "1px dashed var(--line)",
          }}
        >
          No tasks yet. Add one to start tracking your focus on it.
        </div>
      )}

      {open.length > 0 && (
        <div className="flex flex-col gap-2">
          {open.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              isActive={activeTaskId === t.id}
              onActivate={() => setActiveTaskId(t.id)}
              onToggleDone={() => toggleTaskDone(t.id)}
              onDelete={() => deleteTask(t.id)}
              onUpdate={(updates) => updateTask(t.id, updates)}
            />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Done ({done.length})
          </div>
          {done.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              isActive={false}
              onActivate={() => setActiveTaskId(t.id)}
              onToggleDone={() => toggleTaskDone(t.id)}
              onDelete={() => deleteTask(t.id)}
              onUpdate={(updates) => updateTask(t.id, updates)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  isActive: boolean;
  onActivate: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Omit<Task, "id" | "createdAt">>) => void;
}

function TaskRow({ task, isActive, onActivate, onToggleDone, onDelete, onUpdate }: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editEstimate, setEditEstimate] = useState(task.estimatedPomodoros);

  const commit = () => {
    const trimmed = editTitle.trim();
    if (trimmed.length > 0) {
      onUpdate({ title: trimmed, estimatedPomodoros: Math.max(1, editEstimate) });
    }
    setEditing(false);
  };

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{
        background: isActive ? "var(--accent-soft)" : "var(--panel)",
        border: `1px solid ${isActive ? "var(--accent)" : "var(--line)"}`,
      }}
    >
      <button
        type="button"
        onClick={onToggleDone}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{
          border: `2px solid ${task.done ? "var(--accent)" : "var(--line-strong)"}`,
          background: task.done ? "var(--accent)" : "transparent",
        }}
        aria-label={task.done ? "Mark not done" : "Mark done"}
      >
        {task.done && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>

      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="flex-1 rounded-md px-2 py-1 text-sm outline-none"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          />
          <input
            type="number"
            min={1}
            max={20}
            value={editEstimate}
            onChange={(e) => setEditEstimate(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            className="w-12 rounded-md px-2 py-1 text-center text-sm"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          />
          <button
            type="button"
            onClick={commit}
            className="text-xs font-medium"
            style={{ color: "var(--accent)" }}
          >
            save
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !task.done && onActivate()}
          className="min-w-0 flex-1 text-left"
        >
          <div
            className="truncate text-sm font-medium"
            style={{
              color: task.done ? "var(--muted)" : "var(--ink)",
              textDecoration: task.done ? "line-through" : "none",
            }}
          >
            {task.title}
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {task.completedPomodoros} / {task.estimatedPomodoros} pomodoros
            {isActive && (
              <span className="ml-2 font-medium" style={{ color: "var(--accent)" }}>
                • active
              </span>
            )}
          </div>
        </button>
      )}

      {!editing && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md p-1.5 text-xs"
            style={{ color: "var(--muted)" }}
            aria-label="Edit task"
            title="Edit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-xs"
            style={{ color: "var(--muted)" }}
            aria-label="Delete task"
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
