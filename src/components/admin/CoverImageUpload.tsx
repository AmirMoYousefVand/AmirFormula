"use client";

import { useRef, useState } from "react";
import { uploadImageToSupabase } from "@/lib/supabase/storage";

export default function CoverImageUpload({
  initialUrl = "",
}: {
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { url: uploadedUrl, error } = await uploadImageToSupabase("covers", file);
    setUploading(false);

    if (error) {
      alert("خطا در آپلود: " + error);
      return;
    }

    if (uploadedUrl) {
      setUrl(uploadedUrl);
    }
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
      <label className="mb-2 block text-sm font-bold text-navy">
        تصویر کاور مقاله
      </label>

      {/* Hidden input to pass the URL to the parent form action */}
      <input type="hidden" name="cover_image_url" value={url} />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleUpload}
      />

      {url ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-silver/30 bg-silver/10">
          <img src={url} alt="Cover" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute top-2 end-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
            title="حذف"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-silver/50 bg-silver/5 text-sm text-body transition-colors hover:bg-silver/10 disabled:opacity-50"
        >
          {uploading ? (
            <span className="font-bold text-primary">در حال آپلود...</span>
          ) : (
            <>
              <svg className="h-8 w-8 text-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>برای آپلود عکس کلیک کنید</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
