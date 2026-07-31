"use client";

import { useState } from "react";

type Point = { label: string; value: number; dateLabel: string };

const WIDTH = 700;
const HEIGHT = 160;
const PADDING = 20;

export function Sparkline({ points }: { points: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? (WIDTH - PADDING * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    ...p,
    x: PADDING + i * stepX,
    y: HEIGHT - PADDING - (p.value / max) * (HEIGHT - PADDING * 2),
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const active = hover !== null ? coords[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full">
        <line
          x1={PADDING}
          y1={HEIGHT - PADDING}
          x2={WIDTH - PADDING}
          y2={HEIGHT - PADDING}
          className="stroke-neutral-800"
          strokeWidth={1}
        />
        <path
          d={path}
          fill="none"
          className="stroke-accent"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r={hover === i || i === coords.length - 1 ? 4.5 : 0}
              className="fill-accent transition-all"
            />
            <rect
              x={c.x - stepX / 2}
              y={0}
              width={stepX || WIDTH}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-xs uppercase text-neutral-500">
        {points.map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs whitespace-nowrap shadow-lg"
          style={{ left: `${(active.x / WIDTH) * 100}%`, top: `${(active.y / HEIGHT) * 100}%` }}
        >
          <p className="font-medium text-neutral-50">R$ {active.value.toFixed(2)}</p>
          <p className="text-neutral-400">{active.dateLabel}</p>
        </div>
      )}
    </div>
  );
}
