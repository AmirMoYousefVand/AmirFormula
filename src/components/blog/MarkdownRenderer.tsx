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

  // 0. Replace Tiptap's markdown hard breaks (\ followed by newline)
  //    with standard Markdown hard breaks (two spaces followed by newline).
  //    This keeps blockquotes intact when users use Shift+Enter in the editor.
  cleanContent = cleanContent.replace(/\\\n/g, "  \n");

  // 0.1 Clean up any hard breaks that ended up directly before a heading
  //    so the heading isn't swallowed
  cleanContent = cleanContent.replace(/  \n(?=[ \t]*#{1,6})/g, "\n\n");

  // 1. Separate headings that are stuck to the end of another element on the same line
  // Example: `![alt](url)### Heading` -> `![alt](url)\n\n### Heading`
  cleanContent = cleanContent.replace(/([^\n\s\xA0​‍﻿])[\s\xA0​‍﻿]*(#{1,6})/g, "$1\n\n$2");

  // 2. Remove spaces and zero-width characters at the START of a line before a hash
  cleanContent = cleanContent.replace(/^[\s\xA0​‍﻿]+(#{1,6})/gm, "$1");

  // 3. Normalize line endings to standard \n
  cleanContent = cleanContent.replace(/\r\n/g, "\n");

  // 4. Fix heading hashes first: ensure there is exactly one space after hashes
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

  // 5. Ensure headings have a blank line before them.
  //    Matches any non-newline character, followed by exactly one newline,
  //    followed by a heading, and replaces the single newline with a double newline.
  cleanContent = cleanContent.replace(/([^\n])\n(#{1,6} )/g, "$1\n\n$2");

  // 6. Ensure HTML blocks (like figures if serialized as HTML) are separated from text
  cleanContent = cleanContent.replace(/(<\/figure>|<\/div>|<img[^>]*>)\n([^\n])/gi, "$1\n\n$2");

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