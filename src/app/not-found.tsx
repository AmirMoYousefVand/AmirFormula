import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-7xl">🏁</div>
      <h1 className="mb-2 text-3xl font-black text-navy">404</h1>
      <p className="mb-6 text-body">
        صفحه پیدا نشد — Page not found
      </p>
      <Link
        href="/fa"
        className="rounded-full bg-primary px-6 py-2.5 font-bold text-navy transition-colors hover:bg-primary-hover"
      >
        خانه / Home
      </Link>
    </div>
  );
}
