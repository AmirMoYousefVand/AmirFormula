"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();

  const goto = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    router.push(`${pathname}?${sp.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-1">
      <button
        onClick={() => goto(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-2 text-sm text-body hover:text-navy disabled:opacity-30"
      >
        {params.get("locale") === "en" ? "Previous" : "قبلی"}
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => {
          if (totalPages <= 7) return true;
          if (p === 1 || p === totalPages) return true;
          if (Math.abs(p - currentPage) <= 1) return true;
          return false;
        })
        .reduce<(number | "dots")[]>((acc, p, i, arr) => {
          if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("dots");
          acc.push(p);
          return acc;
        }, [])
        .map((item, i) =>
          item === "dots" ? (
            <span key={`d${i}`} className="px-2 text-silver">
              ...
            </span>
          ) : (
            <button
              key={item}
              onClick={() => goto(item)}
              className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                item === currentPage
                  ? "bg-primary text-navy"
                  : "text-body hover:bg-silver/20"
              }`}
            >
              {item}
            </button>
          )
        )}

      <button
        onClick={() => goto(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-2 text-sm text-body hover:text-navy disabled:opacity-30"
      >
        {params.get("locale") === "en" ? "Next" : "بعدی"}
      </button>
    </nav>
  );
}
