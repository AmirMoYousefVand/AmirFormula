import { getRecentDonations, type Donation } from "@/actions/coffeete";
import { Coffee } from "lucide-react";

export default async function Donations() {
  const donations = await getRecentDonations();

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-silver/40">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-navy">
        <Coffee className="h-6 w-6 text-primary" />
        حامیان اخیر من
      </h2>

      {donations.length > 0 ? (
        <div className="space-y-4">
          {donations.map((donation: Donation) => (
            <div
              key={donation.id}
              className="flex items-center justify-between rounded-xl bg-navy-light/5 p-4"
            >
              <div>
                <p className="font-bold text-navy">
                  {donation.isAnonymous || !donation.supporterName
                    ? "ناشناس"
                    : donation.supporterName}
                </p>
                <p className="text-xs text-body mt-1">
                  {new Date(donation.createdAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="text-left">
                <span className="font-bold text-primary">
                  {donation.amountToman.toLocaleString()}
                </span>
                <span className="text-xs text-body ml-1">تومان</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-body text-center py-8">
          در حال حاضر حامی ثبت نشده است.
        </p>
      )}

      <a
        href="https://www.coffeete.ir/Amir_formula"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-navy transition-colors hover:bg-primary-hover"
      >
        <Coffee className="h-5 w-5" />
        همین الان حامی من باش
      </a>
    </div>
  );
}
