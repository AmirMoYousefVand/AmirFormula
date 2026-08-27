"use client";

import { useState } from "react";
import { format } from "date-fns-jalali";

type Log = {
  id: string;
  level: "info" | "warn" | "error";
  action: string;
  details: any;
  created_at: string;
  profiles?: { full_name: string | null; email: string } | null;
};

export default function LogsTable({ initialLogs }: { initialLogs: Log[] }) {
  const [filter, setFilter] = useState<"all" | "info" | "warn" | "error">("all");

  const filteredLogs = initialLogs.filter((log) => {
    if (filter === "all") return true;
    return log.level === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
            filter === "all" ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-silver/40 hover:bg-silver/10"
          }`}
        >
          همه
        </button>
        <button
          onClick={() => setFilter("error")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
            filter === "error" ? "bg-red-500 text-white" : "bg-white text-red-600 ring-1 ring-silver/40 hover:bg-red-50"
          }`}
        >
          خطاها
        </button>
        <button
          onClick={() => setFilter("warn")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
            filter === "warn" ? "bg-yellow-500 text-white" : "bg-white text-yellow-600 ring-1 ring-silver/40 hover:bg-yellow-50"
          }`}
        >
          هشدارها
        </button>
        <button
          onClick={() => setFilter("info")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
            filter === "info" ? "bg-blue-500 text-white" : "bg-white text-blue-600 ring-1 ring-silver/40 hover:bg-blue-50"
          }`}
        >
          اطلاعات
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-silver/40">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-silver/15 text-xs text-body border-b border-silver/20">
              <tr>
                <th className="px-4 py-3 text-start font-bold">زمان</th>
                <th className="px-4 py-3 text-center font-bold">نوع</th>
                <th className="px-4 py-3 text-start font-bold">عملیات</th>
                <th className="px-4 py-3 text-start font-bold">کاربر</th>
                <th className="px-4 py-3 text-start font-bold">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/20">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-body">
                    هیچ لاگی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-silver/5 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-body" dir="ltr">
                      {format(new Date(log.created_at), "HH:mm:ss - yyyy/MM/dd")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          log.level === "error"
                            ? "bg-red-100 text-red-700"
                            : log.level === "warn"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-navy">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-body">
                      {log.profiles ? log.profiles.full_name || log.profiles.email : "سیستم"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="max-w-xs md:max-w-md lg:max-w-lg truncate font-mono text-body/80 bg-silver/10 px-2 py-1 rounded" dir="ltr">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
