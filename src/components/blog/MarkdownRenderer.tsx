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

  // 1. Normalize line endings to standard \n
  cleanContent = cleanContent.replace(/\r\n/g, "\n");

  // 2. Fix heading hashes first: ensure there is exactly one space after hashes
  //    and strip leading invisible characters. This MUST run before the newline regex.
  cleanContent = cleanContent.replace(
    /^[ \t]*(#{1,6})(.*)$/gm,
    (_match, hashes, rest) => {
      const cleanRest = rest
        .replace(/^[\s\xA0​‌‍﻿]+/, "") // Strip leading spaces/invisible chars
        .replace(/[​‍﻿]/g, ""); // Strip invisibles EXCEPT ZWNJ (‌) in text
      return hashes + " " + cleanRest.trim();
    }
  );

  // 3. Ensure headings have a blank line before them.
  //    Matches any non-newline character, followed by exactly one newline,
  //    followed by a heading, and replaces the single newline with a double newline.
  cleanContent = cleanContent.replace(/([^\n])\n(#{1,6} )/g, "$1\n\n$2");

  // 4. Ensure HTML blocks (like figures if serialized as HTML) are separated from text
  cleanContent = cleanContent.replace(/(<\/figure>|<\/div>|<img[^>]*>)\n([^\n])/gi, "$1\n\n$2");

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
