"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useCallback } from "react";

export default function ImageFigure({
  node,
  updateAttributes,
  selected,
}: ReactNodeViewProps) {
  const handleAltChangeFa = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAttributes({ altFa: e.target.value });
    },
    [updateAttributes]
  );

  const handleTitleChangeFa = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAttributes({ titleFa: e.target.value });
    },
    [updateAttributes]
  );

  const handleAltChangeEn = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAttributes({ altEn: e.target.value });
    },
    [updateAttributes]
  );

  const handleTitleChangeEn = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAttributes({ titleEn: e.target.value });
    },
    [updateAttributes]
  );

  const attrs = node.attrs as {
    src: string;
    altFa?: string;
    titleFa?: string;
    altEn?: string;
    titleEn?: string;
  };

  return (
    <NodeViewWrapper as="figure" className="my-6 group">
      <div
        className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
          selected
            ? "border-primary shadow-lg"
            : "border-transparent hover:border-silver/30"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attrs.src}
          alt={attrs.altFa || ""}
          className="w-full h-auto rounded-xl"
        />
      </div>

      {/* Inline caption & alt editor - Persian */}
      <div className="mt-2 space-y-1 px-1 border-r-2 border-primary pr-2">
        <span className="text-xs font-bold text-navy mb-1 block">فارسی (FA):</span>
        <input
          type="text"
          value={attrs.altFa || ""}
          onChange={handleAltChangeFa}
          placeholder="متن جایگزین (Alt text)..."
          dir="rtl"
          className="w-full text-xs px-3 py-1.5 rounded-lg border border-silver/30 bg-gray-50 text-body placeholder:text-silver/60 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors"
        />
        <input
          type="text"
          value={attrs.titleFa || ""}
          onChange={handleTitleChangeFa}
          placeholder="کپشن تصویر..."
          dir="rtl"
          className="w-full text-xs px-3 py-1.5 rounded-lg border border-silver/30 bg-gray-50 text-silver placeholder:text-silver/60 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors italic"
        />
      </div>

      {/* Inline caption & alt editor - English */}
      <div className="mt-4 space-y-1 px-1 border-l-2 border-primary pl-2 text-left">
        <span className="text-xs font-bold text-navy mb-1 block">English (EN):</span>
        <input
          type="text"
          value={attrs.altEn || ""}
          onChange={handleAltChangeEn}
          placeholder="Alt text..."
          dir="ltr"
          className="w-full text-xs px-3 py-1.5 rounded-lg border border-silver/30 bg-gray-50 text-body placeholder:text-silver/60 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors text-left"
        />
        <input
          type="text"
          value={attrs.titleEn || ""}
          onChange={handleTitleChangeEn}
          placeholder="Image caption..."
          dir="ltr"
          className="w-full text-xs px-3 py-1.5 rounded-lg border border-silver/30 bg-gray-50 text-silver placeholder:text-silver/60 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors italic text-left"
        />
      </div>
    </NodeViewWrapper>
  );
}
