"use client";

import { useMemo } from "react";
import { BarChart3, Trophy } from "lucide-react";

// ──────── Types (mirror fetch_f1_data.py compute_best_sectors output) ────────
interface BestSectorsDriver {
  code: string;
  lastName: string;
  fullName: string;
  team: string;
  color: string;
  headshot: string;
  Sector1: number;
  Sector2: number;
  Sector3: number;
  Ideal: number;
  FastestLap: number | null;
  DeltaToIdeal: number | null;
}
export interface BestSectorsData {
  drivers: BestSectorsDriver[];
}

interface BestSectorsProps {
  bestSectors: BestSectorsData | null | undefined;
  gp: string;
  session: string;
}

// ──────── Helpers (match Python format_time / format_delta) ────────
function fmtTime(s: number | null | undefined): string {
  if (s == null || isNaN(s)) return "-";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s - m * 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  if (ms === 1000) return `${m}:${String(sec + 1).padStart(2, "0")}.000`;
  return `${m}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}
function fmtDelta(s: number | null | undefined): string {
  if (s == null || isNaN(s)) return "-";
  return (s > 0 ? "+" : "") + s.toFixed(3);
}

const FASTEST_COLOR = "#C774E8"; // DARK_PURPLE from best_sectors.py

function Headshot({
  src,
  code,
  color,
  size,
}: {
  src: string;
  code: string;
  color: string;
  size: number;
}) {
  if (!src) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
        style={{ backgroundColor: color, width: size, height: size }}
      >
        {code.slice(0, 3)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={code}
      width={size}
      height={size}
      className="shrink-0 object-contain object-bottom"
      style={{ width: size, height: size }}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

// ──────── Column model ────────
interface Column {
  key: string;
  header: string;
}

const SECTOR_COLUMNS: Column[] = [
  { key: "Sector1", header: "Sector 1" },
  { key: "Sector2", header: "Sector 2" },
  { key: "Sector3", header: "Sector 3" },
  { key: "Ideal", header: "Ideal" },
];

// ──────── One table panel ────────
function SectorTable({
  drivers,
  col,
  variant,
}: {
  drivers: BestSectorsDriver[];
  col: Column;
  variant: "single" | "overall";
}) {
  // Sort by the column value ascending (matches Python sort_values)
  const sorted = useMemo(
    () =>
      [...drivers]
        .filter((d) => (d as any)[col.key] != null)
        .sort((a, b) => (a as any)[col.key] - (b as any)[col.key]),
    [drivers, col.key]
  );
  const fastestVal = sorted.length > 0 ? (sorted[0] as any)[col.key] : null;

  const fastLapFastest =
    variant === "overall"
      ? Math.min(
          ...drivers.map((d) => d.FastestLap ?? Infinity).filter((v) => isFinite(v))
        )
      : null;

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-white/10">
            <th className="px-3 py-2.5 text-start text-xs font-black text-primary">
              Driver
            </th>
            <th className="px-3 py-2.5 text-center text-xs font-black text-primary">
              {col.header}
            </th>
            {variant === "overall" && (
              <>
                <th className="px-2 py-2.5 text-center text-xs font-black text-primary">Fastest</th>
                <th className="px-2 py-2.5 text-center text-xs font-black text-primary">Delta Ideal</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, idx) => {
            const isFastest = fastestVal != null && (d as any)[col.key] === fastestVal;
            const isFastestLapCol =
              variant === "overall" &&
              d.FastestLap != null &&
              fastLapFastest != null &&
              isFinite(fastLapFastest) &&
              d.FastestLap === fastLapFastest;
            const zebra = idx % 2 === 0 ? "bg-white/[0.03]" : "bg-white/[0.07]";
            return (
              <tr key={`${d.code}-${idx}`} className={zebra}>
                <td className="px-0 py-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-full w-1.5 self-stretch py-2.5"
                      style={{ backgroundColor: d.color, minHeight: 36 }}
                    />
                    <Headshot src={d.headshot} code={d.code} color={d.color} size={26} />
                    <span className="pe-3 text-xs font-bold text-white">{d.lastName}</span>
                  </div>
                </td>
                <td
                  className="px-3 py-2.5 text-center font-en text-xs font-bold"
                  style={{ color: isFastest || isFastestLapCol ? FASTEST_COLOR : "#FFFFFF" }}
                >
                  {fmtTime((d as any)[col.key])}
                </td>
                {variant === "overall" && (
                  <>
                    <td
                      className="px-2 py-2.5 text-center font-en text-xs font-bold"
                      style={{ color: isFastestLapCol ? FASTEST_COLOR : "#FFFFFF" }}
                    >
                      {fmtTime(d.FastestLap)}
                    </td>
                    <td className="px-2 py-2.5 text-center font-en text-xs text-white/80">
                      {fmtDelta(d.DeltaToIdeal)}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ──────── Delta bar chart panel (Output 2 / code#5) ────────
function DeltaBarPanel({
  drivers,
  col,
  fastestDriver,
  fastestTime,
}: {
  drivers: BestSectorsDriver[];
  col: Column;
  fastestDriver: string;
  fastestTime: string;
}) {
  // Deltas to fastest (matches Python Delta_X = value - fastest)
  const rows = useMemo(() => {
    const vals = drivers
      .filter((d) => (d as any)[col.key] != null)
      .map((d) => ({ driver: d, value: (d as any)[col.key] as number }));
    const fastest = Math.min(...vals.map((v) => v.value));
    const withDelta = vals.map((v) => ({ ...v, delta: v.value - fastest }));
    withDelta.sort((a, b) => a.delta - b.delta);
    return withDelta;
  }, [drivers, col.key]);

  if (rows.length === 0) return null;

  // set_safe_xlim: right = max + 12% + 0.15 (matches Python)
  const maxDelta = rows[rows.length - 1].delta;
  const xMax = maxDelta + 0.12 * maxDelta + 0.15;

  // get_label_pos: margin 6% of range, pad 1.2% (matches Python)
  const margin = 0.06 * xMax;
  const pad = 0.012 * xMax;

  return (
    <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10">
      <div className="mb-3 text-center">
        <div className="text-sm font-black text-primary">{col.header === "Ideal" ? "Ideal Lap" : col.header}</div>
        <div className="font-en text-[11px] text-white/60">
          ({fastestDriver}) {fastestTime}
        </div>
      </div>
      <div className="space-y-[5px]">
        {rows.map(({ driver, delta }) => {
          const barPct = (delta / xMax) * 100;
          const labelAt = delta + pad;
          const labelPct = (labelAt / xMax) * 100;
          const labelEnd = labelAt >= xMax - margin;
          return (
            <div key={driver.code} className="relative flex h-7 items-center">
              {/* driver abbr + headshot on the left */}
              <div className="absolute -start-1 z-10 flex -translate-x-full items-center gap-1">
                <Headshot src={driver.headshot} code={driver.code} color={driver.color} size={22} />
                <span className="font-en text-[11px] font-bold text-white">{driver.code}</span>
              </div>
              {/* bar track */}
              <div className="relative h-full w-full">
                <div
                  className="absolute inset-y-0 start-0 rounded-e-sm"
                  style={{
                    width: `${Math.max(barPct, delta === 0 ? 0.8 : barPct)}%`,
                    backgroundColor: driver.color,
                    border: "1px solid #181C20",
                  }}
                />
                {/* delta label */}
                <span
                  className="font-en absolute top-1/2 -translate-y-1/2 text-[10px] font-bold text-white"
                  style={
                    labelEnd
                      ? { right: `${100 - (xMax - margin) / xMax * 100}%` }
                      : { left: `${labelPct}%` }
                  }
                >
                  +{delta.toFixed(3)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 border-t border-white/10 pt-1.5 text-center font-en text-[10px] text-white/40">
        Delta to Fastest (s)
      </div>
    </div>
  );
}

// ──────── Main ────────
export default function BestSectors({ bestSectors, gp, session }: BestSectorsProps) {
  if (!bestSectors || !bestSectors.drivers?.length) {
    return (
      <div className="rounded-2xl bg-white p-16 text-center ring-1 ring-silver/30">
        <Trophy className="mx-auto mb-4 h-16 w-16 text-silver/30" />
        <h3 className="mb-2 text-lg font-bold text-navy">داده سکتورها موجود نیست</h3>
        <p className="mx-auto max-w-md text-sm text-body">
          برای این سشن داده bestSectors تولید نشده. با دستور زیر فایل‌های موجود رو غنی کنید:
        </p>
        <code className="mt-3 inline-block rounded-lg bg-navy px-4 py-2 font-en text-xs text-white" dir="ltr">
          python fetch_f1_data.py --add-best-sectors
        </code>
      </div>
    );
  }

  const drivers = bestSectors.drivers;

  // Fastest per column for chart headers
  const fastestInfo = SECTOR_COLUMNS.map((col) => {
    const valid = drivers.filter((d) => (d as any)[col.key] != null);
    const fastest = valid.reduce(
      (best, d) => ((d as any)[col.key] < (best as any)[col.key] ? d : best),
      valid[0]
    );
    return {
      col,
      driver: fastest?.code || "-",
      time: fmtTime((fastest as any)?.[col.key]),
    };
  });

  return (
    <div className="space-y-4 rounded-2xl bg-navy p-4 md:p-6">
      {/* Header bar — like apply_modern_header_footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-base font-black text-white md:text-lg">
            بهترین سکتورها و دور ایده‌آل رانندگان
          </h2>
        </div>
        <span className="font-en text-xs text-white/50">
          {gp} · {session}
        </span>
      </div>

      {/* Output 1: tables */}
      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {SECTOR_COLUMNS.slice(0, 3).map((col) => (
          <SectorTable key={col.key} drivers={drivers} col={col} variant="single" />
        ))}
        <SectorTable drivers={drivers} col={SECTOR_COLUMNS[3]} variant="overall" />
      </div>

      {/* Output 2: delta bar charts */}
      <div className="flex items-center gap-2 pt-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-black text-white">دلتا تا سریع‌ترین</h3>
      </div>
      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {fastestInfo.map(({ col, driver, time }) => (
          <DeltaBarPanel
            key={col.key}
            drivers={drivers}
            col={col}
            fastestDriver={driver}
            fastestTime={time}
          />
        ))}
      </div>
    </div>
  );
}
