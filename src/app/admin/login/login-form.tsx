"use client";

import { useActionState, useEffect, useState } from "react";
import { loginAction } from "@/actions/auth";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    null
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Fetch logo client-side to avoid pulling server-only code into the bundle
  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient()
        .from("site_settings")
        .select("value")
        .eq("key", "site_logo_url")
        .maybeSingle()
        .then(({ data }) => setLogoUrl(data?.value || null));
    });
  }, []);

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-silver/40">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 w-fit">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="لوگو"
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-black text-navy">
              A
            </span>
          )}
        </div>
        <h1 className="text-xl font-black text-navy">ورود به پنل مدیریت</h1>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-bold text-navy">ایمیل</label>
          <input
            name="email"
            type="email"
            required
            autoFocus
            className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-navy">رمز عبور</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        {state?.error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </div>
  );
}
