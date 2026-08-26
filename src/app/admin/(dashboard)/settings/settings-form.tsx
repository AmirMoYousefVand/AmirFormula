"use client";

import { useActionState, useRef, useState } from "react";
import { saveSiteSettingAction } from "@/actions/storage";
import { uploadImageToSupabase, compressLogo } from "@/lib/supabase/storage";

export default function SiteSettingsForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const [state, formAction, isPending] = useActionState(saveSiteSettingAction, null);
  const [faviconUrl, setFaviconUrl] = useState(initial.favicon_url || "");
  const [logoUrl, setLogoUrl] = useState(initial.site_logo_url || "");
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  async function handleFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Favicons should be small — compress to 256px max via same pipeline
    setFaviconUploading(true);
    const { url, error } = await uploadImageToSupabase("covers", file);
    setFaviconUploading(false);

    if (error || !url) {
      alert("خطا در آپلود فاوآیکون: " + (error || ""));
      return;
    }
    setFaviconUrl(url);
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Logo: center-crop to square circle-ready WebP
    setLogoUploading(true);
    const { file: cropped, error: cropError } = await compressLogo(file, 256);

    if (cropError || !cropped) {
      setLogoUploading(false);
      alert("خطا در پردازش لوگو: " + (cropError || ""));
      return;
    }

    const { url, error } = await uploadImageToSupabase("covers", cropped);
    setLogoUploading(false);

    if (error || !url) {
      alert("خطا در آپلود لوگو: " + (error || ""));
      return;
    }
    setLogoUrl(url);
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

      {/* Site Logo */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-silver/40">
        <label className="mb-2 block text-sm font-bold text-navy">لوگوی سایت</label>
        <input type="hidden" name="site_logo_url" value={logoUrl} />
        <input
          type="file"
          ref={logoRef}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleLogo}
        />

        <div className="flex items-center gap-5">
          {/* Circular preview — exactly how it renders in header/footer */}
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-silver/50 bg-silver/10">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-silver">A</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={logoUploading}
              onClick={() => logoRef.current?.click()}
              className="w-fit rounded-full bg-primary px-5 py-2 text-xs font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {logoUploading ? "در حال پردازش و آپلود..." : "انتخاب لوگوی جدید"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="text-xs font-bold text-red-500 hover:text-red-700"
              >
                حذف لوگو (بازگشت به حرف A)
              </button>
            )}
            <p className="text-[11px] leading-relaxed text-body">
              هر عکسی انتخاب کنید خودکار به صورت مربع از وسط برش می‌خورد، دایره‌ای نمایش داده می‌شود و به WebP کم‌حجم تبدیل می‌گردد
            </p>
          </div>
        </div>
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
              disabled={faviconUploading}
              onClick={() => fileRef.current?.click()}
              className="w-fit rounded-full bg-primary px-5 py-2 text-xs font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {faviconUploading ? "در حال آپلود..." : "انتخاب فایل آیکون"}
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
