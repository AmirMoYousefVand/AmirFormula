"use client";

import { useEditMode } from "@/components/ui/EditModeProvider";
import { Edit2, Save } from "lucide-react";

export default function AdminEditToggle({ isAdmin }: { isAdmin: boolean }) {
  const { isEditMode, toggleEditMode } = useEditMode();

  if (!isAdmin) return null;

  return (
    <button
      onClick={toggleEditMode}
      className={`fixed bottom-6 end-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 font-bold shadow-xl transition-all hover:scale-105 ${
        isEditMode
          ? "bg-green-500 text-white"
          : "bg-navy text-white ring-2 ring-primary"
      }`}
    >
      {isEditMode ? (
        <>
          <Save size={18} />
          خروج از ویرایش
        </>
      ) : (
        <>
          <Edit2 size={18} className="text-primary" />
          ویرایش درجا
        </>
      )}
    </button>
  );
}
