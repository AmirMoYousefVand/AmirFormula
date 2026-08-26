import { getAllDonationGoals, getModeratedDonors } from "@/actions/donation-goal";

export const dynamic = "force-dynamic";
import { getRecentDonations } from "@/actions/coffeete";
import DonationsManager from "./donations-manager";

export default async function AdminDonationsPage() {
  const [goals, moderated, donations] = await Promise.all([
    getAllDonationGoals(),
    getModeratedDonors(),
    getRecentDonations(),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">مدیریت حمایت مالی</h1>
        <p className="mt-1 text-sm text-body">
          اهداف حمایت مالی و لیست حامیان را مدیریت کنید
        </p>
      </header>

      <DonationsManager
        initialGoals={goals}
        initialDonations={donations}
        initialModerated={moderated}
      />
    </div>
  );
}
