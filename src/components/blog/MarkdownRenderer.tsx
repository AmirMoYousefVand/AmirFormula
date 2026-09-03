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

  // Ensure headings have a blank line before them (handling \r\n properly)
  // This prevents issues where images followed by double enter still eat the heading
  cleanContent = cleanContent.replace(/([^\r\n])\r?\n([ \t]*#{1,6}\s)/g, "$1\n\n$2");

  // Fix heading lines only — never touch the rest of the text,
  // so Persian ZWNJ (نیم‌فاصله) stays intact throughout the article.
  cleanContent = cleanContent.replace(
    /^(#{1,6})(.*)$/gm,
    (_match, hashes, rest) => {
      // Strip invisible chars that may surround the hashes
      const cleanRest = rest
        .replace(/^[\s ​‌‍﻿]+/, "")  // leading invisible chars
        .replace(/[​‍﻿]/g, "");           // remaining invisible chars in heading text EXCEPT ZWNJ (‌ / ‌)
      return hashes + " " + cleanRest.trim();
    }
  );

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
