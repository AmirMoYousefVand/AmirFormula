"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Trophy } from "lucide-react";
import BestSectors, { type BestSectorsData } from "./BestSectors";

// ──────── Types ────────
interface SessionData {
  year: number; gp: string; session: string; circuit: string;
  bestSectors?: BestSectorsData | null;
}
interface CachedSession { filename: string; year: number; gp: string; session: string; circuit: string; drivers: string[]; lapCount: number; }

// ──────── Main ────────
export default function BestSectorsView() {
  const [cachedSessions, setCachedSessions] = useState<CachedSession[]>([]);
  const [selectedGP, setSelectedGP] = useState("");
  const [selectedSession, setSelectedSession] = useState("R");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/data/telemetry/index.json").then((r) => r.json()).then((d) => setCachedSessions(d.sessions || [])).catch(() => setCachedSessions([]));
  }, []);

  const availableGPs = useMemo(() => {
    const map = new Map<string, { gp: string; year: number }>();
    for (const s of cachedSessions) { const k = `${s.year}_${s.gp}`; if (!map.has(k)) map.set(k, { gp: s.gp, year: s.year }); }
    return Array.from(map.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedSessions]);
  const availableSessions = useMemo(() => cachedSessions.filter((s) => s.gp === selectedGP).map((s) => s.session), [cachedSessions, selectedGP]);
  useEffect(() => { if (availableGPs.length > 0 && !selectedGP) setSelectedGP(availableGPs[0].gp); }, [availableGPs, selectedGP]);
  useEffect(() => { if (availableSessions.length > 0 && !availableSessions.includes(selectedSession)) setSelectedSession(availableSessions[0]); }, [availableSessions, selectedSession]);

  const loadSession = useCallback(async () => {
    if (!selectedGP) return;
    setLoading(true); setError(""); setSessionData(null);
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
      const data = JSON.parse(text);
      // Only keep what BestSectors needs — avoids holding full telemetry in memory
      setSessionData({
        year: data.year, gp: data.gp, session: data.session, circuit: data.circuit,
        bestSectors: data.bestSectors ?? null,
      });
    } catch (e: any) { setError(e.message); setSessionData(null); } finally { setLoading(false); }
  }, [selectedGP, selectedSession, cachedSessions]);
  useEffect(() => { if (selectedGP && selectedSession) loadSession(); }, [selectedGP, selectedSession, loadSession]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-5 py-1.5 text-sm font-bold text-primary"><Trophy className="h-4 w-4" /> Best Sectors</span>
        <h1 className="mt-3 text-3xl font-black text-navy md:text-4xl">بهترین سکتورهای رانندگان</h1>
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
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">{error}</div>}
      {loading && <div className="mb-6 rounded-lg bg-silver/10 p-4 text-sm text-body">در حال بارگذاری...</div>}

      {sessionData && (
        <BestSectors bestSectors={sessionData.bestSectors} gp={sessionData.gp} session={sessionData.session} />
      )}

      {!sessionData && !loading && (
        <div className="rounded-2xl bg-white p-16 text-center ring-1 ring-silver/30">
          <Trophy className="mx-auto mb-4 h-16 w-16 text-silver/30" />
          <h3 className="mb-2 text-lg font-bold text-navy">بهترین سکتورهای رانندگان</h3>
          <p className="mx-auto max-w-md text-sm text-body">GP مورد نظر رو انتخاب کنید.</p>
        </div>
      )}
    </div>
  );
}
