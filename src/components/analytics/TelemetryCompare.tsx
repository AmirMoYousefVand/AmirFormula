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

interface CachedSession {
  filename: string; year: number; gp: string; session: string;
  circuit: string; drivers: string[]; lapCount: number;
}

interface SelectedLap {
  driver: string; lapNumber: number; lapTime: number; color: string;
  isRef: boolean; compound: string; telemetry: TelemetryData;
}

// ──────── Helpers ────────
function fmt(s: number): string {
  if (!s || isNaN(s)) return "--:--.---";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  return `${m}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function fmtDelta(s: number): string {
  if (!s || isNaN(s)) return "0.000";
  return (s > 0 ? "+" : "") + s.toFixed(3);
}

const COMPOUND_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  SOFT: { bg: "#EF4444", text: "white", label: "S" },
  MEDIUM: { bg: "#FACC15", text: "black", label: "M" },
  HARD: { bg: "#E5E7EB", text: "black", label: "H" },
  INTERMEDIATE: { bg: "#22C55E", text: "white", label: "I" },
  WET: { bg: "#3B82F6", text: "white", label: "W" },
};

function CompoundBadge({ compound, size = "sm" }: { compound: string; size?: "sm" | "md" }) {
  const c = COMPOUND_COLORS[compound?.toUpperCase()] || COMPOUND_COLORS.HARD;
  const s = size === "md" ? "h-6 w-6 text-[11px]" : "h-5 w-5 text-[10px]";
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-black ${s}`}
      style={{ backgroundColor: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

const SESSION_LABELS: Record<string, string> = {
  FP1: "Practice 1", FP2: "Practice 2", FP3: "Practice 3",
  Q: "Qualifying", SQ: "Sprint Qualifying", S: "Sprint", R: "Race",
};

// ──────── Build chart data with CORRECT time delta ────────
function buildChartData(selected: SelectedLap[], corners: CornerInfo[]) {
  if (selected.length < 2) return { data: [], cornerAxis: [] };
  const ref = selected.find((s) => s.isRef) || selected[0];
  const maxLen = ref.telemetry.distance.length;

  const cornerAxis = corners.map((c) => ({ distance: c.distance, label: c.number }));

  // Pre-compute reference time array (cumulative seconds from distance)
  const refDist = ref.telemetry.distance;
  const refSpeed = ref.telemetry.speed;
  const refTimeArr: number[] = [0];
  for (let i = 1; i < maxLen; i++) {
    const dd = refDist[i] - refDist[i - 1]; // meters
    const avgSpd = (refSpeed[i - 1] + refSpeed[i]) / 2 / 3.6; // m/s
    refTimeArr.push(refTimeArr[i - 1] + (avgSpd > 0 ? dd / avgSpd : 0));
  }

  const data: Record<string, any>[] = [];
  for (let i = 0; i < maxLen; i++) {
    const dist = refDist[i];
    const pt: Record<string, any> = { distance: Math.round(dist) };

    for (const s of selected) {
      const t = s.telemetry;
      const idx = Math.min(i, t.speed.length - 1);
      pt[`${s.driver}_speed`] = t.speed[idx] ?? 0;
      pt[`${s.driver}_throttle`] = t.throttle[idx] ?? 0;
      pt[`${s.driver}_brake`] = t.brake[idx] ?? 0;
      pt[`${s.driver}_gear`] = t.gear[idx] ?? 0;
      pt[`${s.driver}_rpm`] = t.rpm[idx] ?? 0;

      if (!s.isRef) {
        const refIdx = Math.min(i, refSpeed.length - 1);
        pt[`${s.driver}_speed_delta`] = (t.speed[idx] ?? 0) - (refSpeed[refIdx] ?? 0);

        // Correct time delta: compare time at same distance
        const compDist = t.distance;
        const compSpeed = t.speed;
        const compTimeArr: number[] = [0];
        for (let j = 1; j < compDist.length; j++) {
          const dd = compDist[j] - compDist[j - 1];
          const avgSpd = (compSpeed[j - 1] + compSpeed[j]) / 2 / 3.6;
          compTimeArr.push(compTimeArr[j - 1] + (avgSpd > 0 ? dd / avgSpd : 0));
        }
        // Find time at same distance ratio
        const distRatio = i / maxLen;
        const compIdx = Math.min(Math.round(distRatio * (compDist.length - 1)), compDist.length - 1);
        pt[`${s.driver}_time_delta`] = +(compTimeArr[compIdx] - refTimeArr[i]).toFixed(3);
      }
    }
    data.push(pt);
  }
  return { data, cornerAxis };
}

// ──────── Zoom Hook ────────
function useChartZoom() {
  const [zoomArea, setZoomArea] = useState<{ start: number; end: number } | null>(null);
  const dragRef = useRef<{ start: number | null }>({ start: null });

  const onMouseDown = useCallback((e: any) => {
    if (e?.activeLabel != null) dragRef.current.start = e.activeLabel;
  }, []);

  const onMouseMove = useCallback((e: any) => {
    if (dragRef.current.start != null && e?.activeLabel != null) {
      const s = Math.min(dragRef.current.start, e.activeLabel);
      const en = Math.max(dragRef.current.start, e.activeLabel);
      if (en - s > 50) setZoomArea({ start: s, end: en });
    }
  }, []);

  const onMouseUp = useCallback(() => { dragRef.current.start = null; }, []);
  const resetZoom = useCallback(() => { setZoomArea(null); dragRef.current.start = null; }, []);

  return { zoomArea, onMouseDown, onMouseMove, onMouseUp, resetZoom };
}

// ──────── Telemetry Chart ────────
function TelemetryChart({
  title, icon: Icon, chartColor, unit, chartData, laps, height = 200, domain,
  chartType = "line", dataKeySuffix, zoom, corners, onHover, baselineSolid = false,
}: {
  title: string; icon: any; chartColor: string; unit: string;
  chartData: any[]; laps: SelectedLap[]; height?: number;
  domain?: [number, number]; chartType?: "line" | "area" | "step";
  dataKeySuffix?: string; zoom?: { start: number; end: number } | null;
  corners?: CornerInfo[]; onHover?: (d: number | null) => void;
  baselineSolid?: boolean;
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
      <div>
      <ResponsiveContainer width="100%" height={height}>
        <Comp
          data={displayData}
          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="distance"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
            stroke="rgba(255,255,255,0.1)"
            tickFormatter={(v: number) => {
              if (!corners?.length) return `${(v / 1000).toFixed(1)}k`;
              let closest = corners[0], minD = Math.abs(v - closest.distance);
              for (const c of corners) { const d = Math.abs(v - c.distance); if (d < minD) { closest = c; minD = d; } }
              return minD < 150 ? `T${closest.number}` : "";
            }}
            interval={corners?.length ? Math.max(1, Math.floor(displayData.length / (corners.length * 2))) : "preserveStartEnd"}
          />
          <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} stroke="rgba(255,255,255,0.1)" domain={domain} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1B2A4A", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px", fontSize: "12px", color: "white",
            }}
            labelFormatter={(v: any) => `${Number(v).toLocaleString()}m`}
          />
          {isDelta && (
            <ReferenceLine
              y={0}
              stroke={baselineSolid ? (laps[0]?.color || "#FFC71F") : "rgba(255,255,255,0.3)"}
              strokeWidth={baselineSolid ? 2 : 1}
              strokeDasharray={baselineSolid ? undefined : "3 3"}
            />
          )}
          {zoom && <ReferenceArea x1={zoom.start} x2={zoom.end} fill="rgba(255,199,31,0.08)" />}
          {laps.map((lap) => (
            <Child
              key={`${lap.driver}_${suffix}`}
              type={chartType === "step" ? "stepAfter" : "linear"}
              dataKey={`${lap.driver}_${suffix}`}
              stroke={lap.color}
              fill={lap.color}
              fillOpacity={chartType === "area" ? 0.1 : 0}
              strokeWidth={lap.isRef ? 2.5 : 1.8}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </Comp>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// ──────── Lap Popup ────────
function LapPopup({
  driver, laps, driverFastestTime, color, onSelect, onClose,
}: {
  driver: DriverInfo; laps: LapInfo[]; driverFastestTime: number;
  color: string; onSelect: (lap: LapInfo) => void; onClose: () => void;
}) {
  const sorted = [...laps].sort((a, b) => a.lapNumber - b.lapNumber);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mx-4 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `3px solid ${color}` }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: color }}>
              {driver.code}
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy">{driver.name}</h3>
              <p className="text-xs text-body">{driver.team}</p>
            </div>
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
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors ${
                    isFastest ? "bg-green-50 ring-1 ring-green-300 hover:bg-green-100" : "hover:bg-silver/10"
                  }`}>
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
      setSessionData(await res.json());
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

  const { data: chartData } = useMemo(() => buildChartData(finalLaps, sessionData?.corners || []), [finalLaps, sessionData]);

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
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-5 py-1.5 text-sm font-bold text-primary">
          <GitCompareArrows className="h-4 w-4" /> Telemetry Compare
        </span>
        <h1 className="mt-3 text-3xl font-black text-navy md:text-4xl">مقایسه تله‌متری رانندگان</h1>
      </div>

      {/* Selector */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-silver/30">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="mb-1 block text-xs font-bold text-navy">Grand Prix</label>
            <select value={selectedGP} onChange={(e) => setSelectedGP(e.target.value)}
              className="w-full rounded-lg border border-silver/50 bg-white px-4 py-2.5 text-sm text-navy outline-none focus:border-primary">
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
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${selectedSession === s ? "bg-navy text-white" : ok ? "bg-silver/15 text-body hover:bg-silver/30" : "bg-silver/5 text-silver/50 cursor-not-allowed"}`}
                  title={ok ? SESSION_LABELS[s] : "داده موجود نیست"}>{s}</button>;
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

      {/* Track Maps + Charts */}
      {finalLaps.length >= 2 && (
        <div ref={chartRef} className="space-y-4 rounded-2xl bg-navy p-4">
          {/* Track Maps */}
          <div className="grid gap-4 md:grid-cols-2">
            <TrackMap laps={finalLaps} corners={sessionData?.corners || []} trackRotation={sessionData?.trackRotation || 0}
              hoverDistance={hoverDistance} onHover={setHoverDistance} mode="speed" />
            <TrackMap laps={finalLaps} corners={sessionData?.corners || []} trackRotation={sessionData?.trackRotation || 0}
              hoverDistance={hoverDistance} onHover={setHoverDistance} mode="dominance" />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white/5 px-4 py-3">
            {finalLaps.map((lap) => {
              const delta = lap.isRef ? 0 : lap.lapTime - (finalLaps.find((l) => l.isRef)?.lapTime || 0);
              return (
                <div key={lap.driver} className="flex items-center gap-2">
                  <div className="h-3 w-6 rounded-full" style={{ backgroundColor: lap.color }} />
                  <CompoundBadge compound={lap.compound} />
                  <span className="text-xs font-bold text-white">{driverInfoMap[lap.driver]?.name || lap.driver}</span>
                  <span className="font-mono text-[10px] text-white/50">
                    L{lap.lapNumber} · {fmt(lap.lapTime)}
                    {lap.isRef ? " · REF" : ` · ${fmtDelta(delta)}s`}
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
              <TelemetryChart title="Speed" icon={Gauge} chartColor="#22E6EC" unit="km/h"
                chartData={chartData} laps={finalLaps} height={220} zoom={speedZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} />
              <TelemetryChart title="Speed Delta" icon={GitCompareArrows} chartColor="#FACC15" unit="km/h"
                chartData={chartData} laps={finalLaps.filter((l) => !l.isRef)} height={180}
                dataKeySuffix="speed_delta" zoom={dsZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} baselineSolid />
              <TelemetryChart title="Time Delta" icon={Timer} chartColor="#F97316" unit="s"
                chartData={chartData} laps={finalLaps.filter((l) => !l.isRef)} height={180}
                dataKeySuffix="time_delta" zoom={tdZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} baselineSolid />
              <TelemetryChart title="Throttle" icon={Zap} chartColor="#4ADE80" unit="%"
                chartData={chartData} laps={finalLaps} height={160} domain={[0, 100]}
                zoom={thrZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} />
              <TelemetryChart title="Brake" icon={RotateCcw} chartColor="#EF4444" unit=""
                chartData={chartData} laps={finalLaps} height={100} chartType="step"
                zoom={brkZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} />
              <TelemetryChart title="Gear" icon={Disc} chartColor="#A78BFA" unit=""
                chartData={chartData} laps={finalLaps} height={160} chartType="step" domain={[0, 8]}
                zoom={gearZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} />
              <TelemetryChart title="RPM" icon={Radar} chartColor="#FB923C" unit="rpm"
                chartData={chartData} laps={finalLaps} height={160} zoom={rpmZoom.zoomArea} corners={sessionData?.corners} onHover={setHoverDistance} />
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
