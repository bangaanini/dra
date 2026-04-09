import Link from "next/link";

const navItems = [
  { href: "/", label: "Explorer" },
  { href: "/docs", label: "Docs" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[rgba(255,252,246,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-950 text-sm font-semibold text-stone-50">
            DRA
          </div>
          <div>
            <div className="text-sm font-semibold text-stone-900">
              Drama Relay API
            </div>
            <div className="text-xs text-stone-500">
              Unified short drama proxy
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 p-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
