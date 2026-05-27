// --- 20 motivational quotes shown during breaks ---

export const QUOTES: ReadonlyArray<{ text: string; author: string }> = [
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Concentrate all your thoughts upon the work in hand.", author: "Alexander Graham Bell" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "You can do anything, but not everything.", author: "David Allen" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
  { text: "Slow is smooth, smooth is fast.", author: "Navy SEAL adage" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
  { text: "Productivity is never an accident.", author: "Paul J. Meyer" },
  { text: "The shorter way to do many things is to do only one thing at a time.", author: "Mozart" },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
  { text: "Lost time is never found again.", author: "Benjamin Franklin" },
  { text: "Begin while others are procrastinating. Work while others are wishing.", author: "William Arthur Ward" },
];

export function quoteForIndex(i: number): { text: string; author: string } {
  const safe = ((i % QUOTES.length) + QUOTES.length) % QUOTES.length;
  // safe is guaranteed in-bounds; coerce to non-undefined for noUncheckedIndexedAccess.
  return QUOTES[safe] ?? QUOTES[0]!;
}
