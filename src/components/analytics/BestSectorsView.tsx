"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import { Trophy, Download } from "lucide-react";
import BestSectors, { type BestSectorsData } from "./BestSectors";

// ──────── Types ────────
interface SessionData {
  year: number; gp: string; session: string; circuit: string;
  bestSectors?: BestSectorsData | null;
}
interface CachedSession {
  filename: string; year: number; gp: string; session: string;
  circuit: string; drivers: string[]; lapCount: number;
}

// ──────── Main ────────
export default function BestSectorsView() {
  const locale = useLocale();
  const contentRef = useRef<HTMLDivElement>(null);
  const [cachedSessions, setCachedSessions] = useState<CachedSession[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedGP, setSelectedGP] = useState("");
  const [selectedSession, setSelectedSession] = useState("R");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/data/telemetry/index.json")
      .then((r) => r.json())
      .then((d) => setCachedSessions(d.sessions || []))
      .catch(() => setCachedSessions([]));
  }, []);

  // Available years
  const availableYears = useMemo(() => {
    const set = new Set(cachedSessions.map((s) => s.year));
    return Array.from(set).sort();
  }, [cachedSessions]);

  // GPs for selected year
  const availableGPs = useMemo(() => {
    if (!selectedYear) return [];
    const map = new Map<string, { gp: string; year: number }>();
    for (const s of cachedSessions) {
      if (s.year === selectedYear) {
        const k = `${s.year}_${s.gp}`;
        if (!map.has(k)) map.set(k, { gp: s.gp, year: s.year });
      }
    }
    return Array.from(map.values());
  }, [cachedSessions, selectedYear]);

  const availableSessions = useMemo(
    () => cachedSessions.filter((s) => s.year === selectedYear && s.gp === selectedGP).map((s) => s.session),
    [cachedSessions, selectedYear, selectedGP],
  );

  // Auto-select first year
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === "") setSelectedYear(availableYears[availableYears.length - 1]);
  }, [availableYears, selectedYear]);

  // Auto-select first GP when year changes
  useEffect(() => {
    if (availableGPs.length > 0) {
      const match = availableGPs.find((g) => g.gp === selectedGP);
      if (!match) setSelectedGP(availableGPs[0].gp);
    }
  }, [availableGPs, selectedGP]);

  // Auto-select first session when GP changes
  useEffect(() => {
    if (availableSessions.length > 0 && !availableSessions.includes(selectedSession)) {
      setSelectedSession(availableSessions[availableSessions.length - 1]);
    }
  }, [availableSessions, selectedSession]);

  const loadSession = useCallback(async () => {
    if (!selectedGP || !selectedYear) return;
    setLoading(true);
    setError("");
    setSessionData(null);
    try {
      const c = cachedSessions.find(
        (s) => s.year === selectedYear && s.gp === selectedGP && s.session === selectedSession,
      );
      if (!c) throw new Error("Session not cached");
      const res = await fetch(`/data/telemetry/${c.filename}`);
      if (!res.ok) throw new Error("File not found");
      let text: string;
      if (c.filename.endsWith(".gz")) {
        const ds = new DecompressionStream("gzip");
        const reader = res.body!.pipeThrough(ds).getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const totalLen = chunks.reduce((s, c) => s + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
        text = new TextDecoder().decode(merged);
      } else {
        text = await res.text();
      }
      const data = JSON.parse(text);
      setSessionData({
        year: data.year, gp: data.gp, session: data.session, circuit: data.circuit,
        bestSectors: data.bestSectors ?? null,
      });
    } catch (e: any) { setError(e.message); setSessionData(null); }
    finally { setLoading(false); }
  }, [selectedGP, selectedSession, selectedYear, cachedSessions]);

  useEffect(() => { if (selectedGP && selectedSession && selectedYear) loadSession(); }, [selectedGP, selectedSession, selectedYear, loadSession]);

  const downloadPNG = useCallback(async () => {
    if (!contentRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(contentRef.current, { background: "#1B2A4A", useCORS: true } as any);
      const link = document.createElement("a");
      link.download = `best-sectors-${selectedGP}-${selectedSession}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e: any) { setError(e.message); }
    finally { setDownloading(false); }
  }, [selectedGP, selectedSession, downloading]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-5 py-1.5 text-sm font-bold text-primary">
          <Trophy className="h-4 w-4" /> Best Sectors
        </span>
        <h1 className="mt-3 text-3xl font-black text-navy md:text-4xl">
          {locale === "fa" ? "بهترین سکتورهای رانندگان" : "Best Driver Sectors"}
        </h1>
      </div>

      {/* Selector */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-silver/30">
        <div className="flex flex-wrap items-end gap-4">
          {/* Year */}
          <div>
            <label className="mb-1 block text-xs font-bold text-navy">Year</label>
            <div className="flex gap-1">
              {availableYears.map((y) => (
                <button key={y} onClick={() => { setSelectedYear(y); setSelectedGP(""); }}
                  className={`rounded-lg px-3 py-2 text-xs font-bold font-en transition-colors ${selectedYear === y ? "bg-navy text-white" : "bg-silver/15 text-body hover:bg-silver/30"}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* GP */}
          <div className="flex-1 min-w-[220px]">
            <label className="mb-1 block text-xs font-bold text-navy">Grand Prix</label>
            <select value={selectedGP} onChange={(e) => setSelectedGP(e.target.value)} disabled={!availableGPs.length}
              className="w-full rounded-lg border border-silver/50 bg-white px-4 py-2.5 text-sm text-navy outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-silver/5">
              <option value="">{!selectedYear ? (locale === "fa" ? "ابتدا سال را انتخاب کنید" : "Select year first") : (locale === "fa" ? "انتخاب GP" : "Select GP")}</option>
              {availableGPs.map((g) => <option key={`${g.year}_${g.gp}`} value={g.gp}>{g.gp}</option>)}
            </select>
          </div>

          {/* Session */}
          <div>
            <label className="mb-1 block text-xs font-bold text-navy">Session</label>
            <div className="flex gap-1">
              {["FP1", "FP2", "FP3", "Q", "SQ", "S", "R"].map((s) => {
                const ok = availableSessions.includes(s);
                return (
                  <button key={s} onClick={() => ok && setSelectedSession(s)} disabled={!ok}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${selectedSession === s ? "bg-navy text-white" : ok ? "bg-silver/15 text-body hover:bg-silver/30" : "bg-silver/5 text-silver/50 cursor-not-allowed"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">{error}</div>}
      {loading && <div className="mb-6 rounded-lg bg-silver/10 p-4 text-sm text-body">{locale === "fa" ? "در حال بارگذاری..." : "Loading..."}</div>}

      {sessionData && (
        <div>
          {/* Download button */}
          <div className="mb-4 flex justify-end">
            <button onClick={downloadPNG} disabled={downloading}
              className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-light disabled:opacity-50">
              <Download size={16} /> {downloading ? (locale === "fa" ? "در حال دانلود..." : "Downloading...") : (locale === "fa" ? "دانلود PNG" : "Download PNG")}
            </button>
          </div>
          <div ref={contentRef}>
            <BestSectors bestSectors={sessionData.bestSectors} gp={sessionData.gp} session={sessionData.session} locale={locale} />
          </div>
        </div>
      )}

      {!sessionData && !loading && (
        <div className="rounded-2xl bg-white p-16 text-center ring-1 ring-silver/30">
          <Trophy className="mx-auto mb-4 h-16 w-16 text-silver/30" />
          <h3 className="mb-2 text-lg font-bold text-navy">{locale === "fa" ? "بهترین سکتورهای رانندگان" : "Best Driver Sectors"}</h3>
          <p className="mx-auto max-w-md text-sm text-body">{locale === "fa" ? "GP مورد نظر رو انتخاب کنید." : "Select a GP and session to view."}</p>
        </div>
      )}
    </div>
  );
}
