import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

export default function MarkdownRenderer({
  content,
  locale = "fa",
}: {
  content: string;
  locale?: string;
}) {
  let cleanContent = content;

  // 1. Fix heading hashes first: ensure there is a space after hashes and strip leading invisible characters.
  //    This must run BEFORE the newline fix below, otherwise headings without spaces won't be recognized.
  cleanContent = cleanContent.replace(
    /^(#{1,6})(.*)$/gm,
    (_match, hashes, rest) => {
      // Strip invisible chars that may surround the hashes (but preserve ZWNJ inside the text itself)
      const cleanRest = rest
        .replace(/^[\s ​‌‍﻿]+/, "")  // leading invisible chars/spaces
        .replace(/[​‍﻿]/g, "");           // remaining invisible chars EXCEPT ZWNJ (‌ / ‌)
      return hashes + " " + cleanRest.trim();
    }
  );

  // 2. Ensure headings have a blank line before them (handling \r\n properly).
  //    If markdown from tiptap output puts a heading immediately after an image `![alt](url)\n### Heading`,
  //    react-markdown considers it part of the same paragraph. This injects the required empty line.
  cleanContent = cleanContent.replace(/([^\r\n])\r?\n([ \t]*#{1,6}\s)/g, "$1\n\n$2");

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node, ...props }) => {
            return (
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
            );
          },
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}
