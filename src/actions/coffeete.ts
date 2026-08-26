"use server";

export interface Donation {
  id: number;
  amountRial: number;
  amountToman: number;
  supporterName: string | null;
  isAnonymous: boolean;
  showAnonymousBadge: boolean;
  donateFor: string;
  giftLabel: string | null;
  giftIcon: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

export async function getRecentDonations(): Promise<Donation[]> {
  const apiKey = process.env.COFFEETE_API_KEY;
  if (!apiKey) {
    console.error("COFFEETE_API_KEY is missing");
    return [];
  }

  try {
    const res = await fetch(`https://www.coffeete.ir/api/v1/me/donations?page=1&pageSize=5&_t=${Math.floor(Date.now() / 1000)}`, {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    if (!res.ok) {
      console.error("Failed to fetch donations:", await res.text());
      return [];
    }

    const data = await res.json();
    return data as Donation[];
  } catch (error) {
    console.error("Error fetching donations:", error);
    return [];
  }
}
