"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useCallback } from "react";

export default function ImageFigure({
  node,
  updateAttributes,
  selected,
}: ReactNodeViewProps) {
  const handleAltChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAttributes({ alt: e.target.value });
    },
    [updateAttributes]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAttributes({ title: e.target.value });
    },
    [updateAttributes]
  );

  const attrs = node.attrs as { src: string; alt: string; title: string };

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
          alt={attrs.alt || ""}
          className="w-full h-auto rounded-xl"
        />
      </div>

      {/* Inline caption & alt editor */}
      <div className="mt-2 space-y-1 px-1">
        <input
          type="text"
          value={attrs.alt || ""}
          onChange={handleAltChange}
          placeholder="متن جایگزین (Alt text)..."
          dir="rtl"
          className="w-full text-xs px-3 py-1.5 rounded-lg border border-silver/30 bg-gray-50 text-body placeholder:text-silver/60 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors"
        />
        <input
          type="text"
          value={attrs.title || ""}
          onChange={handleTitleChange}
          placeholder="کپشن تصویر..."
          dir="rtl"
          className="w-full text-xs px-3 py-1.5 rounded-lg border border-silver/30 bg-gray-50 text-silver placeholder:text-silver/60 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors italic"
        />
      </div>
    </NodeViewWrapper>
  );
}
