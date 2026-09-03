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
  // Fix heading lines only — never touch the rest of the text,
  // so Persian ZWNJ (نیم‌فاصله) stays intact throughout the article.
  const cleanContent = content.replace(
    /^(#{1,6})(.*)$/gm,
    (_match, hashes, rest) => {
      // Strip invisible chars that may surround the hashes
      const cleanRest = rest
        .replace(/^[\s ​‌‍﻿]+/, "")  // leading invisible chars
        .replace(/[​‌‍﻿]/g, "");           // any remaining invisible chars in heading text
      return hashes + " " + cleanRest.trim();
    }
  );

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node, ...props }) => {
            // Determine alt and title based on current locale
            // We use data-attributes stored by our custom Tiptap extension
            const altFa = (props as any)["data-alt-fa"] || props.alt || "";
            const altEn = (props as any)["data-alt-en"] || "";
            const titleFa = (props as any)["data-title-fa"] || props.title || "";
            const titleEn = (props as any)["data-title-en"] || "";

            const displayAlt = locale === "en" && altEn ? altEn : altFa;
            const displayTitle = locale === "en" && titleEn ? titleEn : titleFa;

            return (
              <figure className="my-8 flex flex-col items-center">
                <span className="block relative w-full aspect-video max-w-4xl rounded-xl overflow-hidden shadow-md">
                  <Image
                    src={typeof props.src === "string" ? props.src : ""}
                    alt={displayAlt}
                    fill
                    className="object-cover"
                  />
                </span>
                {displayTitle && (
                  <figcaption className="mt-3 text-sm text-silver text-center italic">
                    {displayTitle}
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
