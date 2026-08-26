"use client";

import { useMemo, useState, useTransition } from "react";
import {
  deleteStorageFileAction,
  cleanupOrphanedFilesAction,
} from "@/actions/storage";

type StorageFile = {
  name: string;
  size: number;
  createdAt: string;
  inUse: boolean;
};

const FREE_TIER_BYTES = 1024 * 1024 * 1024; // 1 GB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileUrl(name: string) {
  const { createClient } = require("@/lib/supabase/client");
  return createClient().storage.from("covers").getPublicUrl(name).data.publicUrl;
}

export default function StorageManager({
  files,
  totalBytes,
}: {
  files: StorageFile[];
  totalBytes: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "used" | "orphan">("all");

  const usedPercent = Math.min(100, (totalBytes / FREE_TIER_BYTES) * 100);
  const orphanCount = files.filter((f) => !f.inUse).length;

  const visibleFiles = useMemo(() => {
    if (filter === "used") return files.filter((f) => f.inUse);
    if (filter === "orphan") return files.filter((f) => !f.inUse);
    return files;
  }, [files, filter]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function deleteSelected() {
    if (!selected.size) return;
    if (!confirm(`${selected.size} فایل انتخابی حذف شود؟`)) return;

    startTransition(async () => {
      let ok = 0;
      for (const name of selected) {
        const res = await deleteStorageFileAction(name);
        if (!res?.error) ok++;
      }
      setMessage(`${ok} فایل حذف شد`);
      setSelected(new Set());
      window.location.reload();
    });
  }

  function cleanupOrphans() {
    if (
      !confirm(
        `جستجو و حذف خودکار عکس‌های بی‌استفاده انجام شود؟ (${orphanCount} فایل شناسایی شده)`
      )
    )
      return;

    startTransition(async () => {
      const res = await cleanupOrphanedFilesAction();
      if (res?.error) alert(res.error);
      else alert(`پاکسازی کامل شد — ${res?.deleted ?? 0} فایل آزاد شد`);
      window.location.reload();
    });
  }

  function optimize() {
    // Revalidate caches without deleting anything
    startTransition(async () => {
      const res = await fetch("/api/optimize", { method: "POST" });
      if (res.ok) alert("کش سایت پاکسازی شد و صفحات بهینه شدند ✓");
      else alert("خطا در بهینه‌سازی");
    });
  }

  return (
    <div className="space-y-6">
      {/* Usage bar */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold text-navy">فضای مصرفی</h2>
          <span className="text-sm text-body">
            <b className="text-navy">{formatBytes(totalBytes)}</b> از ۱ گیگابایت
          </span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-silver/25">
          <div
            className={`h-full rounded-full transition-all ${
              usedPercent > 85
                ? "bg-red-500"
                : usedPercent > 60
                  ? "bg-primary"
                  : "bg-green-500"
            }`}
            style={{ width: `${Math.max(usedPercent, 1.5)}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-body">
          {usedPercent.toFixed(1)}٪ پر شده — {files.length} فایل، {orphanCount}{" "}
          فایل بی‌استفاده
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={cleanupOrphans}
          disabled={isPending || orphanCount === 0}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          🧹 پاکسازی عکس‌های بی‌استفاده ({orphanCount})
        </button>

        <button
          onClick={optimize}
          disabled={isPending}
          className="rounded-full bg-navy-light px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy disabled:opacity-50"
        >
          ⚡ پاکسازی کش و بهینه‌سازی
        </button>

        {selected.size > 0 && (
          <button
            onClick={deleteSelected}
            disabled={isPending}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            🗑 حذف {selected.size} فایل انتخابی
          </button>
        )}

        {message && <span className="text-xs text-green-700">{message}</span>}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-silver/40 sm:w-fit">
        {(
          [
            ["all", `همه (${files.length})`],
            ["used", `در استفاده (${files.length - orphanCount})`],
            ["orphan", `بی‌استفاده (${orphanCount})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 rounded-md px-4 py-1.5 text-xs font-bold transition-colors ${
              filter === key
                ? "bg-navy text-white"
                : "text-body hover:text-navy"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gallery grid */}
      {!visibleFiles.length ? (
        <div className="rounded-xl bg-white py-16 text-center shadow-sm ring-1 ring-silver/40">
          <p className="text-3xl">📭</p>
          <p className="mt-2 text-sm text-body">فایلی برای نمایش نیست</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleFiles.map((file) => (
            <div
              key={file.name}
              className={`group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 transition-all ${
                selected.has(file.name)
                  ? "ring-2 ring-primary"
                  : "ring-silver/40 hover:-translate-y-0.5"
              }`}
            >
              {/* Selection checkbox */}
              <label className="absolute start-2 top-2 z-10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(file.name)}
                  onChange={() => toggle(file.name)}
                  className="h-5 w-5 cursor-pointer accent-[#FFC71F]"
                />
              </label>

              {/* In-use badge */}
              <span
                className={`absolute end-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  file.inUse
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {file.inUse ? "مصرف‌شده" : "بی‌استفاده"}
              </span>

              <a href={fileUrl(file.name)} target="_blank" rel="noreferrer">
                <img
                  src={fileUrl(file.name)}
                  alt={file.name}
                  loading="lazy"
                  className="aspect-square w-full bg-silver/10 object-cover"
                />
              </a>

              <div className="p-3">
                <p className="truncate text-xs font-medium text-navy" dir="ltr">
                  {file.name}
                </p>
                <p className="mt-1 text-[11px] text-body">
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
