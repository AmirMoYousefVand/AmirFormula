"use client";

import { useState, useRef, useCallback } from "react";
import { useEditMode } from "./EditModeProvider";
import { useLocale } from "next-intl";
import { updateTranslationAction } from "@/actions/translations";

interface EditableTextProps {
  namespace: string;
  tKey: string;
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "a" | "div";
  className?: string;
}

export default function EditableText({
  namespace,
  tKey,
  text,
  as: Tag = "span",
  className = "",
}: EditableTextProps) {
  const { isEditMode } = useEditMode();
  const locale = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fullKey = `${namespace}.${tKey}`;

  const handleBlur = useCallback(async () => {
    setIsEditing(false);
    const newText = ref.current?.textContent || "";
    if (newText !== text) {
      setCurrentText(newText);
      setSaving(true);
      await updateTranslationAction(fullKey, locale, newText);
      setSaving(false);
    }
  }, [text, fullKey, locale]);

  if (!isEditMode) {
    return <Tag className={className}>{currentText}</Tag>;
  }

  return (
    <div
      className={`${className} inline-block cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all relative ${
        isEditing ? "ring-2 ring-primary" : ""
      } ${saving ? "opacity-50" : ""}`}
    >
      {saving && (
        <span className="absolute -top-6 left-0 text-[10px] text-primary font-bold">
          ذخیره شد ✓
        </span>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        dir={locale === "fa" ? "rtl" : "ltr"}
        style={{
          unicodeBidi: "plaintext",
          textAlign: locale === "fa" ? "right" : "left",
          minHeight: "1em",
          outline: "none",
        }}
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        dangerouslySetInnerHTML={{ __html: currentText }}
      />
    </div>
  );
}
