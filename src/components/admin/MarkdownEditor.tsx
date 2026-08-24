"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

export default function MarkdownEditor({
  value,
  onChange,
  dir = "rtl",
}: {
  value: string;
  onChange: (val: string) => void;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div data-color-mode="light" dir={dir}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={400}
        preview="live"
        previewOptions={{
          className: "markdown-body",
        }}
      />
    </div>
  );
}
