// --- Canvas chart primitives for the Focus app. All draw with theme-aware colors. ---

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v.length > 0 ? v : fallback;
}

export interface BarDatum {
  label: string;
  value: number;
}

/** Vertical bar chart — pomodoros-per-day. */
export function drawBarChart(
  ctx: CanvasRenderingContext2D,
  data: BarDatum[],
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);
  if (data.length === 0) return;

  const padTop = 16;
  const padBottom = 22;
  const padLeft = 8;
  const padRight = 8;

  const innerW = w - padLeft - padRight;
  const innerH = h - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const gap = 2;
  const barW = Math.max(2, innerW / data.length - gap);

  const accent = cssVar("--accent", "#7c3aed");
  const muted = cssVar("--muted", "#6b7280");
  const line = cssVar("--line", "#e5e7eb");

  // baseline
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop + innerH + 0.5);
  ctx.lineTo(padLeft + innerW, padTop + innerH + 0.5);
  ctx.stroke();

  data.forEach((d, i) => {
    const x = padLeft + i * (barW + gap);
    const bh = (d.value / max) * innerH;
    const y = padTop + innerH - bh;
    ctx.fillStyle = d.value > 0 ? accent : line;
    const r = Math.min(3, barW / 2);
    roundRect(ctx, x, y, barW, Math.max(1, bh), r);
    ctx.fill();
  });

  // sparse x-axis labels (first, middle, last) to avoid clutter
  ctx.fillStyle = muted;
  ctx.font = "10px Manrope, system-ui, sans-serif";
  ctx.textBaseline = "top";
  const showAt = new Set([0, Math.floor(data.length / 2), data.length - 1]);
  data.forEach((d, i) => {
    if (!showAt.has(i)) return;
    const x = padLeft + i * (barW + gap) + barW / 2;
    ctx.textAlign = i === 0 ? "left" : i === data.length - 1 ? "right" : "center";
    ctx.fillText(d.label, x, padTop + innerH + 4);
  });
}

/** Line chart — focus time per day. value is arbitrary unit (we pass minutes). */
export function drawLineChart(
  ctx: CanvasRenderingContext2D,
  data: BarDatum[],
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);
  if (data.length === 0) return;

  const padTop = 16;
  const padBottom = 22;
  const padLeft = 12;
  const padRight = 8;
  const innerW = w - padLeft - padRight;
  const innerH = h - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.value));

  const accent = cssVar("--accent", "#7c3aed");
  const muted = cssVar("--muted", "#6b7280");
  const line = cssVar("--line", "#e5e7eb");

  // baseline
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop + innerH + 0.5);
  ctx.lineTo(padLeft + innerW, padTop + innerH + 0.5);
  ctx.stroke();

  // build path
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padLeft + i * stepX,
    y: padTop + innerH - (d.value / max) * innerH,
  }));

  // area fill
  ctx.beginPath();
  if (points.length > 0) {
    const first = points[0]!;
    const last = points[points.length - 1]!;
    ctx.moveTo(first.x, padTop + innerH);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.lineTo(last.x, padTop + innerH);
    ctx.closePath();
    ctx.fillStyle = accent + "22"; // ~13% alpha
    ctx.fill();
  }

  // stroke
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  // dots
  ctx.fillStyle = accent;
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // labels
  ctx.fillStyle = muted;
  ctx.font = "10px Manrope, system-ui, sans-serif";
  ctx.textBaseline = "top";
  const showAt = new Set([0, Math.floor(data.length / 2), data.length - 1]);
  data.forEach((d, i) => {
    if (!showAt.has(i)) return;
    const x = padLeft + i * stepX;
    ctx.textAlign = i === 0 ? "left" : i === data.length - 1 ? "right" : "center";
    ctx.fillText(d.label, x, padTop + innerH + 4);
  });
}

/** Heatmap — pomodoros by hour-of-day (24 cells in a single row, or wrapped). */
export function drawHourHeatmap(
  ctx: CanvasRenderingContext2D,
  values: number[],
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);
  if (values.length === 0) return;

  const cols = 24;
  const padTop = 18;
  const padBottom = 16;
  const padLeft = 4;
  const padRight = 4;
  const innerW = w - padLeft - padRight;
  const innerH = h - padTop - padBottom;
  const gap = 2;
  const cellW = (innerW - gap * (cols - 1)) / cols;
  const cellH = Math.max(12, Math.min(28, innerH));
  const y = padTop + (innerH - cellH) / 2;

  const max = Math.max(1, ...values);
  const accent = cssVar("--accent", "#7c3aed");
  const muted = cssVar("--muted", "#6b7280");
  const line = cssVar("--line", "#e5e7eb");

  for (let i = 0; i < cols; i += 1) {
    const v = values[i] ?? 0;
    const x = padLeft + i * (cellW + gap);
    if (v === 0) {
      ctx.fillStyle = line;
    } else {
      const t = v / max;
      // Tint the accent color with variable alpha to convey intensity.
      ctx.fillStyle = accent + alphaHex(0.18 + 0.82 * t);
    }
    roundRect(ctx, x, y, cellW, cellH, 2);
    ctx.fill();
  }

  // hour ticks every 6
  ctx.fillStyle = muted;
  ctx.font = "10px Manrope, system-ui, sans-serif";
  ctx.textBaseline = "top";
  [0, 6, 12, 18, 23].forEach((hr) => {
    const x = padLeft + hr * (cellW + gap) + cellW / 2;
    ctx.textAlign = hr === 0 ? "left" : hr === 23 ? "right" : "center";
    ctx.fillText(hr === 23 ? "11p" : labelForHour(hr), x, y + cellH + 4);
  });
}

function labelForHour(h: number): string {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}

function alphaHex(a: number): string {
  const clamped = Math.max(0, Math.min(1, a));
  const byte = Math.round(clamped * 255);
  return byte.toString(16).padStart(2, "0");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
