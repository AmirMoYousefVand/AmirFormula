import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

export default function MarkdownRenderer({ content }: { content: string }) {
  // Pre-process markdown content to fix common issues
  const cleanContent = content
    // Remove zero-width spaces and other invisible RTL characters that break markdown parsing
    .replace(/[​-‍﻿]/g, "")
    // Ensure headings have an exact ASCII space after the hashes
    // Handles missing space, regular space, NBSP (\xA0), and Persian half-space (‌ ZWNJ)
    .replace(/^([ \t]*)(#{1,6})[ \t\xA0‌]*([^#\s].*)$/gm, "$1$2 $3")
    // Ensure headings have a blank line before them (handling \r\n properly)
    .replace(/([^\r\n])\r?\n([ \t]*#{1,6}\s)/g, "$1\n\n$2");

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node, ...props }) => (
            <figure className="my-8 flex flex-col items-center">
              <span className="block relative w-full aspect-video max-w-4xl rounded-xl overflow-hidden shadow-md">
                <Image
                  src={typeof props.src === "string" ? props.src : ""}
                  alt={props.alt || ""}
                  fill
                  className="object-cover"
                />
              </span>
              {props.title && (
                <figcaption className="mt-3 text-sm text-silver text-center italic">
                  {props.title}
                </figcaption>
              )}
            </figure>
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}
