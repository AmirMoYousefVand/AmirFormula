"use client";

import { useActionState, useRef, useState } from "react";
import { saveSiteSettingAction } from "@/actions/storage";
import { uploadImageToSupabase } from "@/lib/supabase/storage";

export default function SiteSettingsForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const [state, formAction, isPending] = useActionState(saveSiteSettingAction, null);
  const [faviconUrl, setFaviconUrl] = useState(initial.favicon_url || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Favicons should be small — compress to 256px max via same pipeline
    setUploading(true);
    const { url, error } = await uploadImageToSupabase("covers", file);
    setUploading(false);

    if (error || !url) {
      alert("خطا در آپلود فاوآیکون: " + (error || ""));
      return;
    }
    setFaviconUrl(url);
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          ✓ {state.success}
        </p>
      )}
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-silver/40">
        <label className="mb-1 block text-sm font-bold text-navy">نام سایت</label>
        <input
          name="site_name"
          defaultValue={initial.site_name || "Amir Formula"}
          maxLength={100}
          className="mb-4 w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        <label className="mb-1 block text-sm font-bold text-navy">
          توضیح کوتاه سایت
        </label>
        <textarea
          name="site_description"
          defaultValue={initial.site_description || ""}
          rows={2}
          maxLength={300}
          placeholder="مقالات و تحلیل‌های داده‌محور دنیای فرمول ۱"
          className="w-full resize-y rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Favicon */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-silver/40">
        <label className="mb-2 block text-sm font-bold text-navy">فاوآیکون سایت</label>
        <input type="hidden" name="favicon_url" value={faviconUrl} />
        <input
          type="file"
          ref={fileRef}
          accept="image/png,image/jpeg,image/webp,image/x-icon,image/svg+xml"
          className="hidden"
          onChange={handleFavicon}
        />

        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-silver/50 bg-silver/10">
            {faviconUrl ? (
              <img src={faviconUrl} alt="Favicon" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl text-silver">🌐</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-fit rounded-full bg-primary px-5 py-2 text-xs font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {uploading ? "در حال آپلود..." : "انتخاب فایل آیکون"}
            </button>
            {faviconUrl && (
              <button
                type="button"
                onClick={() => setFaviconUrl("")}
                className="text-xs font-bold text-red-500 hover:text-red-700"
              >
                حذف آیکون فعلی
              </button>
            )}
            <p className="text-[11px] leading-relaxed text-body">
              مربع و حداقل ۱۲۸×۱۲۸ پیکسل پیشنهاد می‌شود
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending ? "در حال ذخیره..." : "ذخیره تنظیمات"}
      </button>
    </form>
  );
}
