"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, AreaChart, Area,
} from "recharts";
import {
  ChevronDown, ChevronUp, GitCompareArrows,
  Gauge, Zap, Disc, RotateCcw, Radar, Download, X, Timer,
} from "lucide-react";
import TrackMap from "./TrackMap";

// ──────── Types ────────
interface TelemetryData {
  distance: number[]; speed: number[]; throttle: number[]; brake: number[];
  rpm: number[]; gear: number[]; drs: number[]; x: number[]; y: number[];
  time: number[];
}
interface LapInfo {
  driver: string; lapNumber: number; lapTime: number; isFastest: boolean;
  compound: string; tyreLife: number; telemetry: TelemetryData | null;
}
interface DriverInfo { code: string; name: string; team: string; color: string; headshot: string; }
interface CornerInfo { number: string; distance: number; x: number; y: number; angle: number; }
interface SessionData {
  year: number; gp: string; session: string; circuit: string;
  drivers: DriverInfo[]; laps: LapInfo[]; corners: CornerInfo[]; trackRotation: number;
}
interface CachedSession { filename: string; year: number; gp: string; session: string; circuit: string; drivers: string[]; lapCount: number; }
interface SelectedLap {
  driver: string; lapNumber: number; lapTime: number; color: string;
  isRef: boolean; compound: string; telemetry: TelemetryData;
}

// ──────── Helpers ────────
function fmt(s: number): string {
  if (!s || isNaN(s)) return "--:--.---";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000);
  return `${m}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}
function fmtDelta(s: number): string { return (s > 0 ? "+" : "") + s.toFixed(3); }

const COMPOUND_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  SOFT: { bg: "#EF4444", text: "white", label: "S" },
  MEDIUM: { bg: "#FACC15", text: "black", label: "M" },
  HARD: { bg: "#E5E7EB", text: "black", label: "H" },
  INTERMEDIATE: { bg: "#22C55E", text: "white", label: "I" },
  WET: { bg: "#3B82F6", text: "white", label: "W" },
};
function CompoundBadge({ compound }: { compound: string }) {
  const c = COMPOUND_COLORS[compound?.toUpperCase()] || COMPOUND_COLORS.HARD;
  return <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black" style={{ backgroundColor: c.bg, color: c.text }}>{c.label}</span>;
}

// ──────── Python delta_time implementation ────────
// Matches: delta_time(reference_lap, compare_lap) from telemetries_compare.py
// Uses actual Time column from get_car_data, not computed from speed
function computeTimeDelta(
  refDist: number[], refTime: number[],
  compDist: number[], compTime: number[]
): number[] {
  const refLen = refDist.length;
  const compLen = compDist.length;
  if (refLen < 2 || compLen < 2) return new Array(refLen).fill(0);

  // Python: multiplier = ref.Distance.iat[-1] / comp.Distance.iat[-1]
  const multiplier = refDist[refLen - 1] / compDist[compLen - 1];

  // Python: mini_pro extrapolates first/last values
  const compDistExt = [compDist[0] - (compDist[1] - compDist[0]), ...compDist, compDist[compLen - 1] + (compDist[compLen - 1] - compDist[compLen - 2])];
  const compTimeExt = [compTime[0] - (compTime[1] - compTime[0]), ...compTime, compTime[compLen - 1] + (compTime[compLen - 1] - compTime[compLen - 2])];
  const scaledDist = compDistExt.map((d) => d * multiplier);

  // Python: lap_time = np.interp(ref['Distance'], ldistance, ltime)
  // Python: delta = lap_time - ref['Time'].dt.total_seconds()
  const delta = new Array(refLen);
  for (let i = 0; i < refLen; i++) {
    const rd = refDist[i];
    // Linear interpolation in scaledDist -> compTimeExt
    let ct = compTimeExt[0];
    for (let j = 0; j < scaledDist.length - 1; j++) {
      if (rd >= scaledDist[j] && rd <= scaledDist[j + 1]) {
        const t = (rd - scaledDist[j]) / (scaledDist[j + 1] - scaledDist[j] || 1);
        ct = compTimeExt[j] + t * (compTimeExt[j + 1] - compTimeExt[j]);
        break;
      }
    }
    delta[i] = ct - refTime[i];
  }
  return delta;
}

// ──────── Build chart data ────────
function buildChartData(selected: SelectedLap[], corners: CornerInfo[]) {
  if (selected.length < 2) return { data: [], cornerAxis: [] };
  const ref = selected.find((s) => s.isRef) || selected[0];
  const maxLen = ref.telemetry.distance.length;
  const cornerAxis = corners.map((c) => ({ distance: c.distance, label: c.number }));

  // Pre-compute time delta for each non-ref lap (like Python delta_time)
  // Uses actual Time column from JSON (matches Python get_car_data Time)
  const deltaMap = new Map<string, number[]>();
  for (const s of selected) {
    if (s.isRef) continue;
    const refTime = ref.telemetry.time?.length ? ref.telemetry.time : ref.telemetry.distance.map(() => 0);
    const compTime = s.telemetry.time?.length ? s.telemetry.time : s.telemetry.distance.map(() => 0);
    deltaMap.set(s.driver, computeTimeDelta(
      ref.telemetry.distance, refTime,
      s.telemetry.distance, compTime
    ));
  }

  const data: Record<string, any>[] = [];
  for (let i = 0; i < maxLen; i++) {
    const pt: Record<string, any> = { distance: Math.round(ref.telemetry.distance[i]) };
    for (const s of selected) {
      const t = s.telemetry;
      const idx = Math.min(i, t.speed.length - 1);
      pt[`${s.driver}_speed`] = t.speed[idx] ?? 0;
      pt[`${s.driver}_throttle`] = t.throttle[idx] ?? 0;
      pt[`${s.driver}_brake`] = t.brake[idx] ?? 0;
      pt[`${s.driver}_gear`] = t.gear[idx] ?? 0;
      pt[`${s.driver}_rpm`] = t.rpm[idx] ?? 0;

      if (!s.isRef) {
        pt[`${s.driver}_speed_delta`] = (t.speed[idx] ?? 0) - (ref.telemetry.speed[i] ?? 0);
        const dd = deltaMap.get(s.driver);
        pt[`${s.driver}_time_delta`] = dd ? +(dd[i]).toFixed(4) : 0;
      }
    }
    data.push(pt);
  }
  return { data, cornerAxis };
}

// ──────── Zoom via wrapper div ────────
function useChartZoom() {
  const [zoomArea, setZoomArea] = useState<{ start: number; end: number } | null>(null);
  return {
    zoomArea,
    setZoomArea,
    resetZoom: useCallback(() => setZoomArea(null), []),
  };
}

// ──────── Drag selection overlay (like GP Tempo) ────────
function DragOverlay({ preview, chartData }: { preview: { startIdx: number; endIdx: number }; chartData: any[] }) {
  const total = chartData.length;
  if (total < 2) return null;
  const left = (preview.startIdx / total) * 100;
  const width = ((preview.endIdx - preview.startIdx) / total) * 100;
  return (
    <div className="pointer-events-none absolute inset-0 z-20" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="absolute top-0 bottom-0 bg-white/10 border-x border-white/40"
        style={{ left: `${left}%`, width: `${width}%` }} />
    </div>
  );
}

// ──────── Telemetry Chart ────────
function TelemetryChart({
  title, icon: Icon, chartColor, unit, chartData, laps, height = 200, domain,
  chartType = "line", dataKeySuffix, zoom, corners, onHover, refColor,
}: {
  title: string; icon: any; chartColor: string; unit: string;
  chartData: any[]; laps: SelectedLap[]; height?: number;
  domain?: [number, number]; chartType?: "line" | "area" | "step";
  dataKeySuffix?: string; zoom?: { start: number; end: number } | null;
  corners?: CornerInfo[]; onHover?: (d: number | null) => void;
  refColor?: string;
}) {
  const suffix = dataKeySuffix || title.toLowerCase().replace(/\s/g, "_");
  const Comp = chartType === "area" ? AreaChart : LineChart;
  const Child = chartType === "area" ? Area : Line;
  const isDelta = suffix.includes("delta");

  const displayData = useMemo(() => {
    if (!zoom) return chartData;
    return chartData.filter((d) => d.distance >= zoom.start && d.distance <= zoom.end);
  }, [chartData, zoom]);

  return (
    <div className="rounded-xl bg-navy-light/50 p-4 ring-1 ring-white/5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: chartColor }} />
        <h3 className="text-sm font-bold" style={{ color: chartColor }}>{title}</h3>
        {unit && <span className="text-xs text-white/40">{unit}</span>}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <Comp data={displayData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="distance" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
            stroke="rgba(255,255,255,0.1)"
            tickFormatter={(v: number) => {
              if (!corners?.length) return `${(v / 1000).toFixed(1)}k`;
              let closest = corners[0], minD = Math.abs(v - closest.distance);
              for (const c of corners) { const d = Math.abs(v - c.distance); if (d < minD) { closest = c; minD = d; } }
              return minD < 150 ? `T${closest.number}` : "";
            }}
          />
          <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} stroke="rgba(255,255,255,0.1)" domain={domain} />
          <Tooltip contentStyle={{ backgroundColor: "#1B2A4A", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", fontSize: "12px", color: "white" }}
            labelFormatter={(v: any) => `${Number(v).toLocaleString()}m`} />
          {isDelta && (
            <ReferenceLine y={0} stroke={refColor || "#FFC71F"} strokeWidth={2} />
          )}
          {zoom && <ReferenceArea x1={zoom.start} x2={zoom.end} fill="rgba(255,199,31,0.08)" />}
          {laps.map((lap) => (
            <Child key={`${lap.driver}_${suffix}`} type={chartType === "step" ? "stepAfter" : "linear"}
              dataKey={`${lap.driver}_${suffix}`} stroke={lap.color} fill={lap.color}
              fillOpacity={chartType === "area" ? 0.1 : 0} strokeWidth={lap.isRef ? 2.5 : 1.8}
              dot={false} isAnimationActive={false} connectNulls />
          ))}
        </Comp>
      </ResponsiveContainer>
    </div>
  );
}

// ──────── Lap Popup ────────
function LapPopup({ driver, laps, driverFastestTime, color, onSelect, onClose }: {
  driver: DriverInfo; laps: LapInfo[]; driverFastestTime: number;
  color: string; onSelect: (lap: LapInfo) => void; onClose: () => void;
}) {
  const sorted = [...laps].sort((a, b) => a.lapNumber - b.lapNumber);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mx-4 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `3px solid ${color}` }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: color }}>{driver.code}</div>
            <div><h3 className="text-lg font-bold text-navy">{driver.name}</h3><p className="text-xs text-body">{driver.team}</p></div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-body hover:bg-silver/20"><X size={20} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <p className="mb-3 text-xs font-bold text-body">روی دور مورد نظر کلیک کنید ({sorted.length} دور)</p>
          <div className="space-y-1">
            {sorted.map((lap) => {
              const isFastest = Math.abs(lap.lapTime - driverFastestTime) < 0.001;
              return (
                <button key={lap.lapNumber} onClick={() => onSelect(lap)}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors ${isFastest ? "bg-green-50 ring-1 ring-green-300 hover:bg-green-100" : "hover:bg-silver/10"}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-bold text-navy">L{lap.lapNumber}</span>
                    <CompoundBadge compound={lap.compound} />
                    <span className="font-mono text-navy">{fmt(lap.lapTime)}</span>
                  </div>
                  {isFastest && <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">FASTEST</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────── Main ────────
export default function TelemetryCompare() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [cachedSessions, setCachedSessions] = useState<CachedSession[]>([]);
  const [selectedGP, setSelectedGP] = useState("");
  const [selectedSession, setSelectedSession] = useState("R");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [selectedLaps, setSelectedLaps] = useState<SelectedLap[]>([]);
  const [lapPopupDriver, setLapPopupDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedCharts, setExpandedCharts] = useState(true);
  const [hoverDistance, setHoverDistance] = useState<number | null>(null);

  const speedZoom = useChartZoom();
  const dsZoom = useChartZoom();
  const tdZoom = useChartZoom();
  const thrZoom = useChartZoom();
  const brkZoom = useChartZoom();
  const gearZoom = useChartZoom();
  const rpmZoom = useChartZoom();
  const allZooms = [speedZoom, dsZoom, tdZoom, thrZoom, brkZoom, gearZoom, rpmZoom];

  // Zoom drag state
  const dragRef = useRef<{ startX: number | null; chartId: string | null; wrapperEl: HTMLElement | null }>({ startX: null, chartId: null, wrapperEl: null });
  const [dragPreview, setDragPreview] = useState<{ startIdx: number; endIdx: number; chartId: string } | null>(null);

  useEffect(() => {
    fetch("/data/telemetry/index.json").then((r) => r.json()).then((d) => setCachedSessions(d.sessions || [])).catch(() => setCachedSessions([]));
  }, []);

  const availableGPs = useMemo(() => {
    const map = new Map<string, { gp: string; year: number }>();
    for (const s of cachedSessions) { const k = `${s.year}_${s.gp}`; if (!map.has(k)) map.set(k, { gp: s.gp, year: s.year }); }
    return Array.from(map.values());
  }, [cachedSessions]);
  const availableSessions = useMemo(() => cachedSessions.filter((s) => s.gp === selectedGP).map((s) => s.session), [cachedSessions, selectedGP]);
  useEffect(() => { if (availableGPs.length > 0 && !selectedGP) setSelectedGP(availableGPs[0].gp); }, [availableGPs, selectedGP]);
  useEffect(() => { if (availableSessions.length > 0 && !availableSessions.includes(selectedSession)) setSelectedSession(availableSessions[0]); }, [availableSessions, selectedSession]);

  const loadSession = useCallback(async () => {
    if (!selectedGP) return;
    setLoading(true); setError(""); setSelectedLaps([]);
    try {
      const c = cachedSessions.find((s) => s.gp === selectedGP && s.session === selectedSession);
      if (!c) throw new Error("Session not cached");
      const res = await fetch(`/data/telemetry/${c.filename}`);
      if (!res.ok) throw new Error("File not found");
      let text: string;
      if (c.filename.endsWith(".gz")) {
        const ds = new DecompressionStream("gzip");
        const reader = res.body!.pipeThrough(ds).getReader();
        const chunks: Uint8Array[] = [];
        while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
        const totalLen = chunks.reduce((s, c) => s + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
        text = new TextDecoder().decode(merged);
      } else { text = await res.text(); }
      setSessionData(JSON.parse(text));
    } catch (e: any) { setError(e.message); setSessionData(null); } finally { setLoading(false); }
  }, [selectedGP, selectedSession, cachedSessions]);
  useEffect(() => { if (selectedGP && selectedSession) loadSession(); }, [selectedGP, selectedSession, loadSession]);

  const selectLap = (lap: LapInfo) => {
    if (!sessionData || !lapPopupDriver || !lap.telemetry) return;
    setSelectedLaps((prev) => [...prev.filter((s) => s.driver !== lapPopupDriver.code), {
      driver: lapPopupDriver.code, lapNumber: lap.lapNumber, lapTime: lap.lapTime,
      color: lapPopupDriver.color, isRef: false, compound: lap.compound, telemetry: lap.telemetry!,
    }]);
    setLapPopupDriver(null);
  };

  const { finalLaps, driverInfoMap, driverFastestMap } = useMemo(() => {
    if (!sessionData) return { finalLaps: [], driverInfoMap: {}, driverFastestMap: {} };
    const dMap: Record<string, DriverInfo> = {};
    for (const d of sessionData.drivers) dMap[d.code] = d;
    const fastest: Record<string, number> = {};
    for (const l of sessionData.laps) { if (!l.telemetry) continue; const c = fastest[l.driver]; if (!c || l.lapTime < c) fastest[l.driver] = l.lapTime; }
    const gFast = selectedLaps.length > 0 ? Math.min(...selectedLaps.map((l) => l.lapTime)) : Infinity;
    return { finalLaps: selectedLaps.map((l) => ({ ...l, isRef: Math.abs(l.lapTime - gFast) < 0.001 })), driverInfoMap: dMap, driverFastestMap: fastest };
  }, [selectedLaps, sessionData]);

  const refLap = useMemo(() => finalLaps.find((l) => l.isRef) || finalLaps[0], [finalLaps]);
  const chartDataResult = useMemo(() => buildChartData(finalLaps, sessionData?.corners || []), [finalLaps, sessionData]);
  const chartData = chartDataResult.data;

  // Zoom drag handlers — like GP Tempo click-and-drag
  const getChartIndex = useCallback((clientX: number, wrapper: HTMLElement): number | null => {
    // Find the .recharts-wrapper inside the chart-wrapper
    const recharts = wrapper.querySelector(".recharts-wrapper") as HTMLElement;
    if (!recharts) return null;
    const rect = recharts.getBoundingClientRect();
    // Account for margins (left ~10px for YAxis)
    const margin = 30;
    const usableWidth = rect.width - margin;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left - margin) / usableWidth));
    return Math.round(ratio * (chartData.length - 1));
  }, [chartData.length]);

  const handleDragStart = useCallback((e: React.MouseEvent, chartId: string, zoomSetter: (v: { start: number; end: number } | null) => void) => {
    const wrapper = (e.target as HTMLElement).closest(".chart-wrapper") as HTMLElement;
    if (!wrapper) return;
    const idx = getChartIndex(e.clientX, wrapper);
    if (idx != null) {
      dragRef.current = { startX: idx, chartId, wrapperEl: wrapper };
      // Store the zoom setter for this chart
      (wrapper as any).__zoomSetter = zoomSetter;
    }
  }, [getChartIndex]);

  const handleDragMove = useCallback((e: React.MouseEvent, chartId: string) => {
    if (dragRef.current.startX == null || dragRef.current.chartId !== chartId || !dragRef.current.wrapperEl) return;
    const idx = getChartIndex(e.clientX, dragRef.current.wrapperEl);
    if (idx == null) return;
    const s = Math.min(dragRef.current.startX, idx);
    const en = Math.max(dragRef.current.startX, idx);
    if (en - s > 2) {
      setDragPreview({ startIdx: s, endIdx: en, chartId });
    }
  }, [getChartIndex]);

  const handleDragEnd = useCallback(() => {
    if (dragPreview && dragRef.current.wrapperEl) {
      const zoomSetter = (dragRef.current.wrapperEl as any).__zoomSetter;
      if (zoomSetter) {
        const startDist = chartData[dragPreview.startIdx]?.distance;
        const endDist = chartData[dragPreview.endIdx]?.distance;
        if (startDist != null && endDist != null) zoomSetter({ start: startDist, end: endDist });
      }
    }
    dragRef.current = { startX: null, chartId: null, wrapperEl: null };
    setDragPreview(null);
  }, [dragPreview, chartData]);

  const downloadPNG = useCallback(async () => {
    if (!chartRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(chartRef.current, { background: "#1B2A4A", scale: 2 } as any);
    const link = document.createElement("a");
    link.download = `telemetry-${selectedGP}-${selectedSession}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [selectedGP, selectedSession]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-5 py-1.5 text-sm font-bold text-primary"><GitCompareArrows className="h-4 w-4" /> Telemetry Compare</span>
        <h1 className="mt-3 text-3xl font-black text-navy md:text-4xl">مقایسه تله‌متری رانندگان</h1>
      </div>

      {/* Selector */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-silver/30">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="mb-1 block text-xs font-bold text-navy">Grand Prix</label>
            <select value={selectedGP} onChange={(e) => setSelectedGP(e.target.value)} className="w-full rounded-lg border border-silver/50 bg-white px-4 py-2.5 text-sm text-navy outline-none focus:border-primary">
              <option value="">-- انتخاب GP --</option>
              {availableGPs.map((g) => <option key={`${g.year}_${g.gp}`} value={g.gp}>{g.year} {g.gp}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-navy">Session</label>
            <div className="flex gap-1">
              {["FP1", "FP2", "FP3", "Q", "SQ", "S", "R"].map((s) => {
                const ok = availableSessions.includes(s);
                return <button key={s} onClick={() => ok && setSelectedSession(s)} disabled={!ok}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${selectedSession === s ? "bg-navy text-white" : ok ? "bg-silver/15 text-body hover:bg-silver/30" : "bg-silver/5 text-silver/50 cursor-not-allowed"}`}>{s}</button>;
              })}
            </div>
          </div>
          {finalLaps.length >= 2 && (
            <div className="flex gap-2">
              <button onClick={downloadPNG} className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light"><Download size={16} /> دانلود PNG</button>
              {allZooms.some((z) => z.zoomArea) && (
                <button onClick={() => allZooms.forEach((z) => z.resetZoom())} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"><X size={16} /> ریست زوم</button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">{error}</div>}

      {/* Drivers */}
      {sessionData && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-silver/30">
          <h2 className="mb-4 text-lg font-bold text-navy">رانندگان</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10">
            {sessionData.drivers.map((driver) => {
              const sel = finalLaps.find((l) => l.driver === driver.code);
              return (
                <div key={driver.code} className="relative">
                  <button onClick={() => setLapPopupDriver(driver)}
                    className={`w-full flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all ${sel ? "shadow-lg scale-105" : "ring-1 ring-silver/20 hover:ring-silver/40"}`}
                    style={{ backgroundColor: sel ? `${driver.color}15` : "white", border: sel ? `2px solid ${driver.color}` : "1px solid transparent" }}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: driver.color }}>{driver.code}</div>
                    <span className="text-[9px] font-medium text-navy truncate w-full text-center">{driver.name.split(" ").pop()}</span>
                    {sel && <span className="text-[8px] font-mono font-bold" style={{ color: driver.color }}>L{sel.lapNumber}</span>}
                  </button>
                  {sel && <button onClick={(e) => { e.stopPropagation(); setSelectedLaps((p) => p.filter((x) => x.driver !== driver.code)); }}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600 z-10">×</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      {finalLaps.length >= 2 && chartData.length > 0 && (
        <div ref={chartRef} className="space-y-4 rounded-2xl bg-navy p-4">
          {/* Track Maps */}
          <div className="grid gap-4 md:grid-cols-2">
            <TrackMap laps={finalLaps} corners={sessionData?.corners || []} trackRotation={sessionData?.trackRotation || 0} hoverDistance={hoverDistance} onHover={setHoverDistance} mode="speed" />
            <TrackMap laps={finalLaps} corners={sessionData?.corners || []} trackRotation={sessionData?.trackRotation || 0} hoverDistance={hoverDistance} onHover={setHoverDistance} mode="dominance" />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white/5 px-4 py-3">
            {finalLaps.map((lap) => {
              const delta = lap.isRef ? 0 : lap.lapTime - (refLap?.lapTime || 0);
              return (
                <div key={lap.driver} className="flex items-center gap-2">
                  <div className="h-3 w-6 rounded-full" style={{ backgroundColor: lap.color }} />
                  <CompoundBadge compound={lap.compound} />
                  <span className="text-xs font-bold text-white">{driverInfoMap[lap.driver]?.name || lap.driver}</span>
                  <span className="font-mono text-[10px] text-white/50">
                    L{lap.lapNumber} · {fmt(lap.lapTime)}
                    {lap.isRef ? <span className="text-primary"> · REF</span> : <span className="text-red-400"> · {fmtDelta(delta)}s</span>}
                  </span>
                </div>
              );
            })}
            <span className="mr-auto text-[10px] text-white/30">🖱️ کلیک + درگ برای زوم</span>
          </div>

          <button onClick={() => setExpandedCharts(!expandedCharts)} className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
            {expandedCharts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expandedCharts ? "بستن نمودارها" : "باز کردن نمودارها"}
          </button>

          {expandedCharts && (
            <>
              {/* Speed */}
              <div className="chart-wrapper relative cursor-crosshair select-none" onMouseDown={(e) => handleDragStart(e, "speed", speedZoom.setZoomArea)} onMouseMove={(e) => handleDragMove(e, "speed")} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
                <span className="absolute top-2 right-4 z-10 text-[10px] text-white/30">🖱️ Click and drag to zoom</span>
                <TelemetryChart title="Speed" icon={Gauge} chartColor="#22E6EC" unit="km/h" chartData={chartData} laps={finalLaps} height={220}
                  zoom={speedZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} refColor={refLap?.color} />
                {dragPreview?.chartId === "speed" && <DragOverlay preview={dragPreview} chartData={chartData} />}
              </div>
              {/* Speed Delta */}
              <div className="chart-wrapper relative cursor-crosshair select-none" onMouseDown={(e) => handleDragStart(e, "ds", dsZoom.setZoomArea)} onMouseMove={(e) => handleDragMove(e, "ds")} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
                <TelemetryChart title="Speed Delta" icon={GitCompareArrows} chartColor="#FACC15" unit="km/h" chartData={chartData}
                  laps={finalLaps.filter((l) => !l.isRef)} height={180} dataKeySuffix="speed_delta" zoom={dsZoom.zoomArea}
                  corners={sessionData?.corners} onHover={setHoverDistance} refColor={refLap?.color} />
                {dragPreview?.chartId === "ds" && <DragOverlay preview={dragPreview} chartData={chartData} />}
              </div>
              {/* Time Delta */}
              <div className="chart-wrapper relative cursor-crosshair select-none" onMouseDown={(e) => handleDragStart(e, "td", tdZoom.setZoomArea)} onMouseMove={(e) => handleDragMove(e, "td")} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
                <TelemetryChart title="Time Delta" icon={Timer} chartColor="#F97316" unit="s" chartData={chartData}
                  laps={finalLaps.filter((l) => !l.isRef)} height={180} dataKeySuffix="time_delta" zoom={tdZoom.zoomArea}
                  corners={sessionData?.corners} onHover={setHoverDistance} refColor={refLap?.color} />
                {dragPreview?.chartId === "td" && <DragOverlay preview={dragPreview} chartData={chartData} />}
              </div>
              {/* Throttle */}
              <div className="chart-wrapper relative cursor-crosshair select-none" onMouseDown={(e) => handleDragStart(e, "thr", thrZoom.setZoomArea)} onMouseMove={(e) => handleDragMove(e, "thr")} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
                <TelemetryChart title="Throttle" icon={Zap} chartColor="#4ADE80" unit="%" chartData={chartData} laps={finalLaps} height={160}
                  domain={[0, 100]} zoom={thrZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} refColor={refLap?.color} />
                {dragPreview?.chartId === "thr" && <DragOverlay preview={dragPreview} chartData={chartData} />}
              </div>
              {/* Brake */}
              <div className="chart-wrapper relative cursor-crosshair select-none" onMouseDown={(e) => handleDragStart(e, "brk", brkZoom.setZoomArea)} onMouseMove={(e) => handleDragMove(e, "brk")} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
                <TelemetryChart title="Brake" icon={RotateCcw} chartColor="#EF4444" unit="" chartData={chartData} laps={finalLaps} height={100}
                  chartType="step" zoom={brkZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} refColor={refLap?.color} />
                {dragPreview?.chartId === "brk" && <DragOverlay preview={dragPreview} chartData={chartData} />}
              </div>
              {/* Gear */}
              <div className="chart-wrapper relative cursor-crosshair select-none" onMouseDown={(e) => handleDragStart(e, "gear", gearZoom.setZoomArea)} onMouseMove={(e) => handleDragMove(e, "gear")} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
                <TelemetryChart title="Gear" icon={Disc} chartColor="#A78BFA" unit="" chartData={chartData} laps={finalLaps} height={160}
                  chartType="step" domain={[0, 8]} zoom={gearZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} refColor={refLap?.color} />
                {dragPreview?.chartId === "gear" && <DragOverlay preview={dragPreview} chartData={chartData} />}
              </div>
              {/* RPM */}
              <div className="chart-wrapper relative cursor-crosshair select-none" onMouseDown={(e) => handleDragStart(e, "rpm", rpmZoom.setZoomArea)} onMouseMove={(e) => handleDragMove(e, "rpm")} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
                <TelemetryChart title="RPM" icon={Radar} chartColor="#FB923C" unit="rpm" chartData={chartData} laps={finalLaps} height={160}
                  zoom={rpmZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} refColor={refLap?.color} />
                {dragPreview?.chartId === "rpm" && <DragOverlay preview={dragPreview} chartData={chartData} />}
              </div>
            </>
          )}
        </div>
      )}

      {!sessionData && !loading && (
        <div className="rounded-2xl bg-white p-16 text-center ring-1 ring-silver/30">
          <GitCompareArrows className="mx-auto mb-4 h-16 w-16 text-silver/30" />
          <h3 className="mb-2 text-lg font-bold text-navy">مقایسه تله‌متری رانندگان</h3>
          <p className="mx-auto max-w-md text-sm text-body">GP مورد نظر رو انتخاب کنید.</p>
        </div>
      )}

      {lapPopupDriver && sessionData && (
        <LapPopup driver={lapPopupDriver} laps={sessionData.laps.filter((l) => l.driver === lapPopupDriver.code)}
          driverFastestTime={driverFastestMap[lapPopupDriver.code] ?? Infinity} color={lapPopupDriver.color}
          onSelect={selectLap} onClose={() => setLapPopupDriver(null)} />
      )}
    </div>
  );
}
