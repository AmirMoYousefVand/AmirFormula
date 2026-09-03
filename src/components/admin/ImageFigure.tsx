"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useCallback } from "react";

export default function ImageFigure({
  node,
  updateAttributes,
  selected,
  extension,
}: ReactNodeViewProps) {
  // Use the editor's dir to determine whether we are in the Persian or English editor
  // ReactNodeViewProps doesn't strongly type editor, so we cast to any to access it
  const dir = (extension as any).editor?.options?.editorProps?.attributes?.dir || "rtl";
  const isEn = dir === "ltr";

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

  const attrs = node.attrs as {
    src: string;
    alt?: string;
    title?: string;
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
          alt={attrs.alt || ""}
          className="w-full h-auto rounded-xl"
        />
      </div>

      {/* Inline caption & alt editor */}
      <div className={`mt-2 space-y-1 px-1 border-${isEn ? 'l' : 'r'}-2 border-primary ${isEn ? 'pl-2 text-left' : 'pr-2'}`}>
        <span className="text-xs font-bold text-navy mb-1 block">
          {isEn ? "English (EN):" : "فارسی (FA):"}
        </span>
        <input
          type="text"
          value={attrs.alt || ""}
          onChange={handleAltChange}
          placeholder={isEn ? "Alt text..." : "متن جایگزین (Alt text)..."}
          dir={dir}
          className={`w-full text-xs px-3 py-1.5 rounded-lg border border-silver/30 bg-gray-50 text-body placeholder:text-silver/60 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors ${isEn ? 'text-left' : ''}`}
        />
        <input
          type="text"
          value={attrs.title || ""}
          onChange={handleTitleChange}
          placeholder={isEn ? "Image caption..." : "کپشن تصویر..."}
          dir={dir}
          className={`w-full text-xs px-3 py-1.5 rounded-lg border border-silver/30 bg-gray-50 text-silver placeholder:text-silver/60 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors italic ${isEn ? 'text-left' : ''}`}
        />
      </div>
    </NodeViewWrapper>
  );
}
