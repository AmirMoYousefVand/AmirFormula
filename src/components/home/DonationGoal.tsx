import { Coffee } from "lucide-react";
import { getHomepageDonations } from "@/actions/donation-goal";
import EditableText from "@/components/ui/EditableText";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/utils";

export default async function DonationGoal() {
  const { goals, donations } = await getHomepageDonations();
  const t = await getTranslations("home");
  const tn = await getTranslations("nav");

  if (!goals.length && !donations.length) return null;

  return (
    <section className="relative overflow-hidden bg-navy-light">
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 24px)" }} />
      <div className="absolute -end-24 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <EditableText
            namespace="home"
            tKey="ctaBlog"
            text={t("ctaBlog")}
            as="h2"
            className="mb-3 text-2xl font-black text-white md:text-3xl flex items-center justify-center gap-3"
          />
          <EditableText
            namespace="home"
            tKey="heroSubtitle"
            text={t("heroSubtitle")}
            as="p"
            className="mb-8 text-white/60"
          />
        </div>

        {/* Goals */}
        {goals.length > 0 && (
          <div className="mx-auto mb-10 max-w-2xl space-y-4">
            {goals.map((g, i) => (
              <div key={g.id} className="rounded-2xl bg-white/5 p-5 backdrop-blur-sm ring-1 ring-white/10">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-primary">
                    {i + 1}. {g.text}
                  </span>
                  <span className="text-white/80">{g.percent}%</span>
                </div>

                <div className="mb-2 h-4 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-primary to-primary-hover transition-all duration-1000"
                    style={{ width: `${Math.max(g.percent, 1)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="text-primary font-bold text-sm">
                    {g.current.toLocaleString("fa-IR")} تومان
                  </span>
                  <span>از {g.target.toLocaleString("fa-IR")} تومان</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent donations */}
        {donations.length > 0 && (
          <div className="mx-auto mb-8 max-w-xl">
            <EditableText
              namespace="home"
              tKey="featuredAll"
              text="حامیان اخیر"
              as="h3"
              className="mb-4 text-center text-sm font-bold text-white/70"
            />
            <div className="space-y-2">
              {donations.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-black text-primary">
                      {d.isAnonymous ? "؟" : (d.supporterName || "؟").charAt(0)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-white">
                        {d.supporterName || (d.isAnonymous ? "حامی ناشناس" : "حامی")}
                      </span>
                      <span className="text-[11px] text-white/40">
                        {formatDate(d.createdAt, "fa")}
                      </span>
                      {d.message && (
                        <span className="text-xs text-white/50 max-w-[200px] truncate sm:max-w-[300px]">
                          "{d.message}"
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-primary">
                      {d.amountToman.toLocaleString("fa-IR")}
                    </span>
                    <span className="mr-1 text-xs text-white/50">تومان</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <a
            href="https://www.coffeete.ir/Amir_formula"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-black text-navy transition-all hover:scale-105 hover:bg-primary-hover"
          >
            <Coffee className="h-5 w-5" />
            <EditableText
              namespace="nav"
              tKey="sponsor"
              text={tn("sponsor")}
              as="span"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
