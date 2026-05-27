import { useEffect } from "react";

export interface HotkeyHandlers {
  onToggleStart: () => void; // Space
  onReset: () => void; // R
  onSkip: () => void; // S
  onNewTask: () => void; // N
}

/**
 * Global hotkeys. Ignores key events while typing in form fields.
 */
export function useHotkeys(handlers: HotkeyHandlers): void {
  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    };

    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.code === "Space") {
        e.preventDefault();
        handlers.onToggleStart();
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "r") {
        e.preventDefault();
        handlers.onReset();
        return;
      }
      if (k === "s") {
        e.preventDefault();
        handlers.onSkip();
        return;
      }
      if (k === "n") {
        e.preventDefault();
        handlers.onNewTask();
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers]);
}
