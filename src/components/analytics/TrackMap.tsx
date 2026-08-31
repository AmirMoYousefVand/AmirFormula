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

// ─── Rotate GPS coordinates (matches Python rotate()) ───
function rotateXY(x: number, y: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [x * cos - y * sin, x * sin + y * cos];
}

// ─── Resample track to N uniform points (matches Python resample_track()) ───
function resampleTrack(x: number[], y: number[], n: number) {
  if (x.length < 2) return { x, y };
  const dist = [0];
  for (let i = 1; i < x.length; i++) {
    dist.push(dist[i - 1] + Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]));
  }
  const total = dist[dist.length - 1];
  if (total === 0) return { x, y };
  const uniform = Array.from({ length: n }, (_, i) => (i / (n - 1)) * total);
  const interp = (arr: number[]) =>
    uniform.map((d) => {
      let i = 0;
      while (i < dist.length - 1 && dist[i + 1] < d) i++;
      if (i >= dist.length - 1) return arr[arr.length - 1];
      const t = (d - dist[i]) / (dist[i + 1] - dist[i] || 1);
      return arr[i] + t * (arr[i + 1] - arr[i]);
    });
  return { x: interp(x), y: interp(y) };
}

// ─── Project lap onto reference path (matches Python _project_to_reference()) ───
function projectToReference(
  refX: number[], refY: number[],
  lapX: number[], lapY: number[], lapSpeed: number[],
  nBins: number
): number[] | null {
  // Simple nearest-neighbor projection
  const profile = new Array(nBins).fill(NaN);

  for (let i = 0; i < lapX.length; i++) {
    let minD = Infinity, bestIdx = 0;
    for (let j = 0; j < refX.length; j++) {
      const d = (lapX[i] - refX[j]) ** 2 + (lapY[i] - refY[j]) ** 2;
      if (d < minD) { minD = d; bestIdx = j; }
    }
    if (minD <= 400) { // 20m threshold squared
      const bin = bestIdx;
      if (isNaN(profile[bin]) || lapSpeed[i] > profile[bin]) {
        profile[bin] = lapSpeed[i];
      }
    }
  }

  // Fill NaN gaps with interpolation
  const valid = profile.map((v, i) => (!isNaN(v) ? i : -1)).filter((i) => i >= 0);
  if (valid.length < 2) return null;

  for (let i = 0; i < nBins; i++) {
    if (isNaN(profile[i])) {
      // Find nearest valid neighbors
      let lo = valid[0], hi = valid[valid.length - 1];
      for (const v of valid) { if (v <= i) lo = v; if (v >= i && v < hi) hi = v; }
      if (lo === hi) profile[i] = profile[lo];
      else {
        const t = (i - lo) / (hi - lo || 1);
        profile[i] = profile[lo] + t * (profile[hi] - profile[lo]);
      }
    }
  }
  return profile;
}

export default function TrackMap({ laps, corners, trackRotation, hoverDistance, onHover, mode }: TrackMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const N = 500; // Number of track points

  // Process laps: rotate, resample all to reference path
  const processed = useMemo(() => {
    if (laps.length === 0) return null;
    const ref = laps.find((l) => l.isRef) || laps[0];

    // Rotate reference lap
    const refRot = ref.telemetry.x.map((x, i) => rotateXY(x, ref.telemetry.y[i], trackRotation));
    const refXRaw = refRot.map((p) => p[0]);
    const refYRaw = refRot.map((p) => p[1]);
    const refResampled = resampleTrack(refXRaw, refYRaw, N);

    // For each other lap, project onto reference path
    const lapData = laps.map((lap) => {
      const lapRot = lap.telemetry.x.map((x, i) => rotateXY(x, lap.telemetry.y[i], trackRotation));
      const lx = lapRot.map((p) => p[0]);
      const ly = lapRot.map((p) => p[1]);

      // Resample speed onto reference path
      const speedProfile = projectToReference(
        refResampled.x, refResampled.y,
        lx, ly, lap.telemetry.speed, N
      );

      // Fallback: direct resample
      if (!speedProfile) {
        const lapResampled = resampleTrack(lx, ly, N);
        return { ...lap, sx: refResampled.x, sy: refResampled.y, speed: lapResampled.x.map(() => 0) };
      }

      return { ...lap, sx: refResampled.x, sy: refResampled.y, speed: speedProfile };
    });

    return { refX: refResampled.x, refY: refResampled.y, laps: lapData };
  }, [laps, trackRotation]);

  // Compute SVG dimensions from track bounds
  const { viewBox, aspectRatio } = useMemo(() => {
    if (!processed) return { viewBox: "0 0 100 100", aspectRatio: 1 };
    const p = 200;
    const minX = Math.min(...processed.refX) - p;
    const maxX = Math.max(...processed.refX) + p;
    const minY = Math.min(...processed.refY) - p;
    const maxY = Math.max(...processed.refY) + p;
    const w = maxX - minX;
    const h = maxY - minY;
    return { viewBox: `${minX} ${minY} ${w} ${h}`, aspectRatio: w / h };
  }, [processed]);

  // Compute track segments (dominance or speed delta)
  const segments = useMemo(() => {
    if (!processed || processed.laps.length < 2) return [];
    const { refX, refY, laps: lps } = processed;
    const segs: { x1: number; y1: number; x2: number; y2: number; color: string; opacity: number }[] = [];

    if (mode === "dominance") {
      // TRACK DOMINANCE: winner-takes-all with majority voting (matches Python)
      const allSpeeds = lps.map((l) => l.speed);
      const winners = new Array(N).fill(0);

      // Raw winners at each point
      for (let i = 0; i < N; i++) {
        let maxSpd = -Infinity, wIdx = 0;
        for (let j = 0; j < allSpeeds.length; j++) {
          if (allSpeeds[j][i] > maxSpd) { maxSpd = allSpeeds[j][i]; wIdx = j; }
        }
        winners[i] = wIdx;
      }

      // Majority voting with window (matches Python k=13 smoothing)
      const k = Math.min(13, Math.floor(N / 10) * 2 + 1);
      const pad = Math.floor(k / 2);
      const smoothed = [...winners];
      for (let i = 0; i < N; i++) {
        const counts = new Map<number, number>();
        for (let j = i - pad; j <= i + pad; j++) {
          const idx = Math.max(0, Math.min(N - 1, j));
          const w = winners[idx];
          counts.set(w, (counts.get(w) || 0) + 1);
        }
        let maxCount = 0, maxWinner = 0;
        counts.forEach((c, w) => { if (c > maxCount) { maxCount = c; maxWinner = w; } });
        smoothed[i] = maxWinner;
      }

      for (let i = 0; i < N - 1; i++) {
        segs.push({
          x1: refX[i], y1: refY[i], x2: refX[i + 1], y2: refY[i + 1],
          color: lps[smoothed[i]].color, opacity: 1.0,
        });
      }
    } else {
      // SPEED DELTA: opacity based on speed difference (matches Python)
      const allSpeeds = lps.map((l) => l.speed);
      const fastestIdx = new Array(N).fill(0);
      const fastestSpd = new Array(N).fill(0);
      const secondSpd = new Array(N).fill(0);

      for (let i = 0; i < N; i++) {
        const speeds = allSpeeds.map((s) => s[i] ?? 0).sort((a, b) => b - a);
        fastestSpd[i] = speeds[0];
        secondSpd[i] = speeds[1] ?? 0;
        for (let j = 0; j < allSpeeds.length; j++) {
          if ((allSpeeds[j][i] ?? 0) === speeds[0]) { fastestIdx[i] = j; break; }
        }
      }

      const diffs = fastestSpd.map((s, i) => s - secondSpd[i]);
      const maxDiff = Math.max(...diffs, 1);

      for (let i = 0; i < N - 1; i++) {
        const alpha = Math.min(1, Math.max(0.08, diffs[i] / maxDiff));
        segs.push({
          x1: refX[i], y1: refY[i], x2: refX[i + 1], y2: refY[i + 1],
          color: lps[fastestIdx[i]].color, opacity: alpha,
        });
      }
    }
    return segs;
  }, [processed, mode]);

  // Hover handling
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !processed) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * parseFloat(viewBox.split(" ")[2]) + parseFloat(viewBox.split(" ")[0]);
    const svgY = ((e.clientY - rect.top) / rect.height) * parseFloat(viewBox.split(" ")[3]) + parseFloat(viewBox.split(" ")[1]);
    let minD = Infinity, cIdx = 0;
    for (let i = 0; i < processed.refX.length; i++) {
      const d = (svgX - processed.refX[i]) ** 2 + (svgY - processed.refY[i]) ** 2;
      if (d < minD) { minD = d; cIdx = i; }
    }
    const threshold = parseFloat(viewBox.split(" ")[2]) * 0.06;
    if (minD < threshold * threshold) {
      setHoveredIdx(cIdx);
      const refLap = laps.find((l) => l.isRef) || laps[0];
      const ratio = cIdx / (processed.refX.length - 1);
      onHover(ratio * (refLap.telemetry.distance[refLap.telemetry.distance.length - 1] || 0));
    }
  }, [processed, viewBox, laps, onHover]);

  // Sync external hover
  useEffect(() => {
    if (hoverDistance === null) { setHoveredIdx(null); return; }
    if (!processed) return;
    const refLap = laps.find((l) => l.isRef) || laps[0];
    const total = refLap.telemetry.distance[refLap.telemetry.distance.length - 1] || 1;
    const idx = Math.round((hoverDistance / total) * (processed.refX.length - 1));
    setHoveredIdx(Math.max(0, Math.min(idx, processed.refX.length - 1)));
  }, [hoverDistance, processed, laps]);

  // Rotate corners
  const rotCorners = useMemo(() => corners.map((c) => {
    const [rx, ry] = rotateXY(c.x, c.y, trackRotation);
    return { ...c, rx, ry };
  }), [corners, trackRotation]);

  if (!processed) return null;
  const { refX, refY, laps: lps } = processed;

  return (
    <div className="rounded-xl bg-navy-light/50 p-4 ring-1 ring-white/5">
      <h3 className="mb-3 text-sm font-bold text-cyan-400">
        {mode === "dominance" ? "🏁 Track Dominance" : "⚡ Speed Delta Map"}
      </h3>
      <div className="rounded-lg overflow-hidden" style={{ background: "#111827" }}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ display: "block", minHeight: "350px", maxHeight: "550px", aspectRatio: "16/9" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHoveredIdx(null); onHover(null); }}
        >
          {/* Track shadow/background */}
          <polyline
            points={refX.map((x, i) => `${x},${refY[i]}`).join(" ")}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={56}
            strokeLinecap="round" strokeLinejoin="round"
          />

          {/* Track segments */}
          {segments.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke={s.color} strokeWidth={16} strokeOpacity={s.opacity} strokeLinecap="round" />
          ))}

          {/* Corner markers */}
          {rotCorners.map((c, i) => (
            <g key={i}>
              <circle cx={c.rx} cy={c.ry} r={32} fill="#1B2A4A" stroke="rgba(255,255,255,0.6)" strokeWidth={2.5} />
              <text x={c.rx} y={c.ry + 1} textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize={20} fontWeight="bold" fontFamily="var(--font-space-grotesk)">
                {c.number}
              </text>
            </g>
          ))}

          {/* Hover indicator */}
          {hoveredIdx != null && refX[hoveredIdx] != null && (
            <>
              <circle cx={refX[hoveredIdx]} cy={refY[hoveredIdx]} r={14}
                fill="white" stroke="#FFC71F" strokeWidth={3}
                style={{ filter: "drop-shadow(0 0 8px rgba(255,199,31,0.5))" }} />
              {lps.map((lap, li) => (
                <text key={lap.driver} x={refX[hoveredIdx]} y={refY[hoveredIdx] - 20 - li * 20}
                  textAnchor="middle" fill={lap.color} fontSize={14} fontWeight="bold"
                  fontFamily="var(--font-space-grotesk)"
                  stroke="#111827" strokeWidth={4} paintOrder="stroke">
                  {lap.driver} {Math.round(lap.speed[hoveredIdx] ?? 0)} km/h
                </text>
              ))}
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
        {lps.map((lap) => (
          <div key={lap.driver} className="flex items-center gap-1.5">
            <div className="h-3 w-8 rounded-full" style={{ backgroundColor: lap.color }} />
            <span className="text-xs font-medium text-navy">{lap.driver}</span>
          </div>
        ))}
        <span className="text-[10px] text-body">
          {mode === "dominance" ? "هر رنگ = بخشی که اون راننده سریع‌تره" : "شفافیت = اختلاف سرعت"}
        </span>
      </div>
    </div>
  );
}
