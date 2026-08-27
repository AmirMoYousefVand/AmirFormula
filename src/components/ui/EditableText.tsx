"use client";

import { useState } from "react";
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

  if (!isEditMode) {
    return <Tag className={className}>{currentText}</Tag>;
  }

  const fullKey = `${namespace}.${tKey}`;

  const handleBlur = async () => {
    setIsEditing(false);
    if (currentText !== text) {
      setSaving(true);
      await updateTranslationAction(fullKey, locale, currentText);
      setSaving(false);
    }
  };

  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    <Tag
      className={`${className} cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${
        isEditing ? "ring-2 ring-primary" : ""
      } ${saving ? "opacity-50" : ""}`}
      dir={dir}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      dangerouslySetInnerHTML={{ __html: currentText }}
      onInput={(e) => setCurrentText((e.target as HTMLElement).textContent || "")}
    />
  );
}
