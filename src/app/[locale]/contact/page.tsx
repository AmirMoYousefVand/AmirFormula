"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { contactFormSchema } from "@/lib/validation";

export default function ContactPage() {
  const t = useTranslations("contact");
  const locale = useLocale();

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "ok" | "error"
  >("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    // client-side validation
    const parsed = contactFormSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[String(issue.path[0])] = issue.message;
      }
      setErrors(errs);
      return;
    }

    // honeypot check
    if (honeypot) {
      setStatus("ok"); // pretend success for bots
      return;
    }

    setStatus("sending");
    startTransition(async () => {
      try {
        const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID;
        if (!formspreeId) throw new Error("Formspree not configured");

        const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _subject: form.subject,
            name: form.name,
            email: form.email,
            message: form.message,
            _language: locale,
          }),
        });

        if (!res.ok) throw new Error("submit failed");
        setStatus("ok");
        setForm({ name: "", email: "", subject: "", message: "" });
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-black text-navy md:text-4xl">
          {t("title")}
        </h1>
        <p className="text-body">{t("subtitle")}</p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-silver/40 md:p-10"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-navy">
              {t("name")}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={`w-full rounded-lg border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary ${
                errors.name ? "border-red-400" : "border-silver/50"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-navy">
              {t("email")}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={`w-full rounded-lg border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary ${
                errors.email ? "border-red-400" : "border-silver/50"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-bold text-navy">
            {t("subject")}
          </label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            className={`w-full rounded-lg border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary ${
              errors.subject ? "border-red-400" : "border-silver/50"
            }`}
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
          )}
        </div>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-bold text-navy">
            {t("message")}
          </label>
          <textarea
            rows={6}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            className={`w-full resize-y rounded-lg border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary ${
              errors.message ? "border-red-400" : "border-silver/50"
            }`}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-red-500">{errors.message}</p>
          )}
        </div>

        {/* Honeypot */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />

        {status === "ok" && (
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {t("success")}
          </div>
        )}
        {status === "error" && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {t("error")}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full rounded-full bg-primary py-3 font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? t("sending") : t("send")}
        </button>
      </form>
    </div>
  );
}
