import Link from "next/link";
import { DramaExplorer } from "@/components/drama-explorer";

export default function Home() {
  return (
    <main className="flex flex-1 px-6 py-10 text-stone-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="grid gap-6 overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(76,56,35,0.08)] md:grid-cols-[minmax(0,1fr)_280px] md:p-10">
          <div className="flex flex-col gap-6">
            <span className="w-fit rounded-full bg-stone-950 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-stone-50">
              Explorer
            </span>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                Operasikan semua provider drama lewat satu kontrak API.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600 md:text-lg">
                Halaman utama sekarang difokuskan sebagai workspace operasional:
                pilih provider, cek feed, buka detail, uji stream, dan salin
                request normalized yang nanti dipakai dari web lain.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#explorer"
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
              >
                Open Explorer
              </Link>
              <Link
                href="/docs"
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:bg-stone-50"
              >
                Read Docs
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <HeroStat label="Use case" value="Proxy + frontend consumer" />
            <HeroStat label="Contract" value="Ganti provider saja" />
            <HeroStat label="Deploy target" value="Vercel public API" />
          </div>
        </section>

        <div id="explorer">
          <DramaExplorer />
        </div>
      </div>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-5 py-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-stone-900">{value}</div>
    </div>
  );
}
