"use client";

import { useEffect } from "react";

export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed-${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch(`/api/views/${encodeURIComponent(slug)}`, { method: "POST" }).catch(
      () => {}
    );
  }, [slug]);

  return null;
}
