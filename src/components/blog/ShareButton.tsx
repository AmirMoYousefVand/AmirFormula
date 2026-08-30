"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({ slug, locale }: { slug: string; locale: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/${locale}/blog/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {}
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full bg-silver/20 px-5 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-silver/30"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          کپی شد!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          اشتراک‌گذاری
        </>
      )}
    </button>
  );
}
