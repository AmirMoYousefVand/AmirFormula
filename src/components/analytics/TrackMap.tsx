"use client";

import { useMemo, useCallback, useRef, useState, useEffect } from "react";

interface SelectedLap {
  driver: string; lapNumber: number; lapTime: number; color: string;
  isRef: boolean; compound: string;
  telemetry: { distance: number[]; speed: number[]; x: number[]; y: number[] };
}

interface TrackMapProps {
  laps: SelectedLap[];
  corners: { number: string; distance: number; x: number; y: number; angle: number }[];
  trackRotation: number;
  hoverDistance: number | null;
  onHover: (distance: number | null) => void;
  mode: "speed" | "dominance";
}

function rotateXY(x: number, y: number, angle: number): [number, number] {
  const rad = (angle * Math.PI) / 180;
  return [x * Math.cos(rad) - y * Math.sin(rad), x * Math.sin(rad) + y * Math.cos(rad)];
}

function resample(x: number[], y: number[], sp: number[], n: number) {
  if (x.length < 2) return { x, y, sp };
  const d = [0];
  for (let i = 1; i < x.length; i++) d.push(d[i - 1] + Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]));
  const total = d[d.length - 1];
  if (total === 0) return { x, y, sp };
  const u = Array.from({ length: n }, (_, i) => (i / (n - 1)) * total);
  const ix = u.map((v) => { let i = 0; while (i < d.length - 1 && d[i + 1] < v) i++; return i >= d.length - 1 ? x[x.length - 1] : x[i] + ((v - d[i]) / (d[i + 1] - d[i] || 1)) * (x[i + 1] - x[i]); });
  const iy = u.map((v) => { let i = 0; while (i < d.length - 1 && d[i + 1] < v) i++; return i >= d.length - 1 ? y[y.length - 1] : y[i] + ((v - d[i]) / (d[i + 1] - d[i] || 1)) * (y[i + 1] - y[i]); });
  const isp = u.map((v) => { let i = 0; while (i < d.length - 1 && d[i + 1] < v) i++; return i >= d.length - 1 ? sp[sp.length - 1] : sp[i] + ((v - d[i]) / (d[i + 1] - d[i] || 1)) * (sp[i + 1] - sp[i]); });
  return { x: ix, y: iy, sp: isp };
}

function speedToColor(speed: number, minSpd: number, maxSpd: number): string {
  const t = Math.max(0, Math.min(1, (speed - minSpd) / (maxSpd - minSpd || 1)));
  // Blue (slow) -> Green -> Yellow -> Red (fast)
  const r = t < 0.5 ? Math.round(t * 2 * 255) : 255;
  const g = t < 0.5 ? 255 : Math.round((1 - (t - 0.5) * 2) * 255);
  const b = t < 0.5 ? Math.round((1 - t * 2) * 255) : 0;
  return `rgb(${r},${g},${b})`;
}

export default function TrackMap({ laps, corners, trackRotation, hoverDistance, onHover, mode }: TrackMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const N = 400;

  const processed = useMemo(() => {
    if (laps.length === 0) return { refPath: null, laps: [] };
    const ref = laps.find((l) => l.isRef) || laps[0];
    const rot = (xa: number[], ya: number[]) => xa.map((x, i) => rotateXY(x, ya[i], trackRotation));
    const rRot = rot(ref.telemetry.x, ref.telemetry.y);
    const refPath = resample(rRot.map((p) => p[0]), rRot.map((p) => p[1]), ref.telemetry.speed, N);

    const lps = laps.map((lap) => {
      const lr = rot(lap.telemetry.x, lap.telemetry.y);
      return { ...lap, ...resample(lr.map((p) => p[0]), lr.map((p) => p[1]), lap.telemetry.speed, N) };
    });
    return { refPath, laps: lps };
  }, [laps, trackRotation]);

  const bounds = useMemo(() => {
    if (!processed.refPath) return { minX: 0, maxX: 1, minY: 0, maxY: 1, w: 1, h: 1 };
    const p = 300;
    const minX = Math.min(...processed.refPath.x) - p, maxX = Math.max(...processed.refPath.x) + p;
    const minY = Math.min(...processed.refPath.y) - p, maxY = Math.max(...processed.refPath.y) + p;
    return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
  }, [processed]);

  const segments = useMemo(() => {
    if (!processed.refPath || processed.laps.length < 2) return [];
    const { x, y } = processed.refPath;
    const segs: { x1: number; y1: number; x2: number; y2: number; color: string; alpha: number }[] = [];

    if (mode === "dominance") {
      // Track Dominance: winner at each point
      for (let i = 0; i < N - 1; i++) {
        let maxSpd = -Infinity, wIdx = 0, secSpd = -Infinity;
        for (let j = 0; j < processed.laps.length; j++) {
          const s = processed.laps[j].sp[i];
          if (s > maxSpd) { secSpd = maxSpd; maxSpd = s; wIdx = j; } else if (s > secSpd) secSpd = s;
        }
        const diff = maxSpd - secSpd;
        const alpha = Math.min(1, Math.max(0.2, diff / 40));
        segs.push({ x1: x[i], y1: y[i], x2: x[i + 1], y2: y[i + 1], color: processed.laps[wIdx].color, alpha });
      }
    } else {
      // Speed Delta: color by speed difference
      const ref = processed.laps.find((l) => l.isRef) || processed.laps[0];
      const other = processed.laps.find((l) => !l.isRef) || processed.laps[1];
      for (let i = 0; i < N - 1; i++) {
        const diff = (other.sp[i] ?? 0) - (ref.sp[i] ?? 0);
        const alpha = Math.min(1, Math.max(0.15, Math.abs(diff) / 30));
        const color = diff > 0 ? other.color : ref.color;
        segs.push({ x1: x[i], y1: y[i], x2: x[i + 1], y2: y[i + 1], color, alpha });
      }
    }
    return segs;
  }, [processed, mode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !processed.refPath) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * bounds.w + bounds.minX;
    const svgY = ((e.clientY - rect.top) / rect.height) * bounds.h + bounds.minY;
    let minD = Infinity, cIdx = 0;
    for (let i = 0; i < processed.refPath.x.length; i++) {
      const d = (svgX - processed.refPath.x[i]) ** 2 + (svgY - processed.refPath.y[i]) ** 2;
      if (d < minD) { minD = d; cIdx = i; }
    }
    if (minD < (bounds.w * 0.08) ** 2) {
      setHoveredIdx(cIdx);
      const refLap = laps.find((l) => l.isRef) || laps[0];
      const ratio = cIdx / (processed.refPath.x.length - 1);
      onHover(ratio * (refLap.telemetry.distance[refLap.telemetry.distance.length - 1] || 0));
    }
  }, [processed, bounds, laps, onHover]);

  useEffect(() => {
    if (hoverDistance === null) { setHoveredIdx(null); return; }
    if (!processed.refPath) return;
    const refLap = laps.find((l) => l.isRef) || laps[0];
    const total = refLap.telemetry.distance[refLap.telemetry.distance.length - 1] || 1;
    const idx = Math.round((hoverDistance / total) * (processed.refPath.x.length - 1));
    setHoveredIdx(Math.max(0, Math.min(idx, processed.refPath.x.length - 1)));
  }, [hoverDistance, processed, laps]);

  const rotCorners = useMemo(() => corners.map((c) => {
    const [rx, ry] = rotateXY(c.x, c.y, trackRotation);
    return { ...c, rx, ry };
  }), [corners, trackRotation]);

  if (!processed.refPath) return null;
  const { x: rx, y: ry } = processed.refPath;

  return (
    <div className="rounded-xl bg-[#0f1724] p-4 ring-1 ring-white/5">
      <h3 className="mb-2 text-sm font-bold text-cyan-400">
        {mode === "dominance" ? "🏁 Track Dominance" : "⚡ Speed Delta"}
      </h3>
      <svg ref={svgRef} viewBox={`${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`}
        className="w-full" style={{ maxHeight: "350px", borderRadius: "8px" }}
        onMouseMove={handleMouseMove} onMouseLeave={() => { setHoveredIdx(null); onHover(null); }}>
        {/* Track shadow */}
        <polyline points={rx.map((x, i) => `${x},${ry[i]}`).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" />
        {/* Segments */}
        {segments.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={s.color} strokeWidth={12} strokeOpacity={s.alpha} strokeLinecap="round" />
        ))}
        {/* Corner markers */}
        {rotCorners.map((c, i) => (
          <g key={i}>
            <circle cx={c.rx} cy={c.ry} r={28} fill="#1B2A4A" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
            <text x={c.rx} y={c.ry} textAnchor="middle" dominantBaseline="central"
              fill="white" fontSize={18} fontWeight="bold" fontFamily="var(--font-space-grotesk)">{c.number}</text>
          </g>
        ))}
        {/* Hover */}
        {hoveredIdx != null && rx[hoveredIdx] != null && (
          <>
            <circle cx={rx[hoveredIdx]} cy={ry[hoveredIdx]} r={16} fill="white" stroke="#FFC71F" strokeWidth={3}
              style={{ filter: "drop-shadow(0 0 8px rgba(255,199,31,0.6))" }} />
            {processed.laps.map((lap, li) => (
              <text key={lap.driver} x={rx[hoveredIdx]} y={ry[hoveredIdx] - 24 - li * 22}
                textAnchor="middle" fill={lap.color} fontSize={15} fontWeight="bold"
                fontFamily="var(--font-space-grotesk)"
                stroke="#0f1724" strokeWidth={3} paintOrder="stroke">
                {lap.driver} {Math.round(lap.sp[hoveredIdx] ?? 0)}
              </text>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}
