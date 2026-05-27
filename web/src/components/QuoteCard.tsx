import { useMemo } from "react";
import { quoteForIndex } from "../lib/quotes";

interface QuoteCardProps {
  /** Stable seed — usually completedCycles, so the same break shows the same quote. */
  seed: number;
}

export function QuoteCard({ seed }: QuoteCardProps) {
  const quote = useMemo(() => quoteForIndex(seed), [seed]);
  return (
    <div
      className="rounded-2xl p-5 text-center"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
      }}
    >
      <p
        className="font-serif text-lg leading-snug"
        style={{ color: "var(--ink)", fontWeight: 500 }}
      >
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
        — {quote.author}
      </p>
    </div>
  );
}
