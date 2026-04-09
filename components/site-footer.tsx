import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200/70 bg-[rgba(255,252,246,0.9)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
        <p>
          DRA ships one normalized contract for every supported drama provider.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/" className="transition hover:text-stone-900">
            Explorer
          </Link>
          <Link href="/docs" className="transition hover:text-stone-900">
            Docs
          </Link>
        </div>
      </div>
    </footer>
  );
}
