import type { Metadata } from "next";
import Link from "next/link";
import { createDramaApiPath } from "@/lib/drama/sdk";
import { PROVIDERS } from "@/lib/drama/types";

export const metadata: Metadata = {
  title: "Docs | DRA Internal Drama Proxy",
  description:
    "Professional API documentation for the DRA unified short drama proxy.",
};

const endpointDocs = [
  {
    name: "languages",
    description: "Daftar bahasa yang didukung provider.",
    example: createDramaApiPath("meloshort", "languages"),
  },
  {
    name: "home",
    description: "Feed utama provider.",
    example: createDramaApiPath("meloshort", "home", {
      page: 1,
      lang: "en",
    }),
  },
  {
    name: "search",
    description: "Pencarian drama dengan keyword seragam.",
    example: createDramaApiPath("meloshort", "search", {
      query: "love",
      page: 1,
      lang: "en",
    }),
  },
  {
    name: "popular",
    description: "Daftar drama populer provider.",
    example: createDramaApiPath("meloshort", "popular", {
      page: 1,
      lang: "en",
    }),
  },
  {
    name: "latest",
    description: "Daftar rilis terbaru provider.",
    example: createDramaApiPath("meloshort", "latest", {
      page: 1,
      lang: "en",
    }),
  },
  {
    name: "detail",
    description: "Detail drama dan daftar episode dalam bentuk normalisasi.",
    example: createDramaApiPath("meloshort", "detail", {
      id: "YOUR_DRAMA_ID",
      lang: "en",
    }),
  },
  {
    name: "stream",
    description: "Stream episode dengan request seragam untuk semua provider.",
    example: createDramaApiPath("meloshort", "stream", {
      id: "YOUR_DRAMA_ID",
      episode: 1,
      lang: "en",
    }),
  },
];

const quickstart = `const provider = "meloshort";
const baseUrl = "https://YOUR-VERCEL-APP.vercel.app";

const detail = await fetch(
  \`\${baseUrl}/api/drama/\${provider}/detail?id=YOUR_DRAMA_ID&lang=en\`
).then((res) => res.json());

const stream = await fetch(
  \`\${baseUrl}/api/drama/\${provider}/stream?id=YOUR_DRAMA_ID&episode=1&lang=en\`
).then((res) => res.json());`;

const browserExample = `async function getFeed(provider, feed = "home") {
  const url = new URL(\`https://YOUR-VERCEL-APP.vercel.app/api/drama/\${provider}/\${feed}\`);
  url.searchParams.set("page", "1");
  url.searchParams.set("lang", "en");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error("Request failed");
  return response.json();
}`;

const responseShape = `{
  "author": "Aan",
  "provider": "meloshort",
  "message": "success",
  "type": "detail",
  "data": {
    "id": "69ce221a593879d7b7672574",
    "title": "Fated to you,Chosen by me",
    "description": "...",
    "posterUrl": "https://...",
    "episodeCount": 30,
    "tags": ["Anime", "Romance"],
    "performers": [],
    "episodes": [
      {
        "id": "69ce221b593879d7b7672575",
        "number": 1,
        "locked": false,
        "streamUrl": "/api/drama/meloshort/stream?id=...&episode=1&lang=en"
      }
    ]
  }
}`;

export default function DocsPage() {
  return (
    <main className="flex flex-1 px-6 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="grid gap-6 rounded-[2rem] border border-stone-200/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(76,56,35,0.08)] md:grid-cols-[minmax(0,1fr)_280px] md:p-10">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-stone-950 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-stone-50">
              API Documentation
            </span>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 md:text-6xl">
              Unified short drama API for multi-provider integrations.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-stone-600 md:text-lg">
              Dokumentasi ini ditujukan untuk web lain yang akan memanggil API
              hasil deploy Vercel. Kontrak request dibuat konsisten sehingga
              integrasi cukup mengganti `provider`, bukan menyesuaikan query
              khusus tiap source.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
              >
                Open Explorer
              </Link>
              <a
                href="#endpoints"
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-500 hover:bg-stone-50"
              >
                Browse Endpoints
              </a>
            </div>
          </div>

          <div className="grid gap-3">
            <StatCard label="Providers" value={String(PROVIDERS.length)} />
            <StatCard label="Media route" value="/api/drama/media" />
            <StatCard label="CORS" value="Enabled" />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <DocsPanel title="Quick Nav">
              <nav className="grid gap-2 text-sm text-stone-600">
                <a href="#quickstart" className="rounded-xl px-3 py-2 hover:bg-stone-100">
                  Quickstart
                </a>
                <a href="#providers" className="rounded-xl px-3 py-2 hover:bg-stone-100">
                  Providers
                </a>
                <a href="#endpoints" className="rounded-xl px-3 py-2 hover:bg-stone-100">
                  Endpoints
                </a>
                <a href="#response" className="rounded-xl px-3 py-2 hover:bg-stone-100">
                  Response Shape
                </a>
                <a href="#cors" className="rounded-xl px-3 py-2 hover:bg-stone-100">
                  CORS & Media Proxy
                </a>
              </nav>
            </DocsPanel>

            <DocsPanel title="Base Pattern">
              <code className="block overflow-x-auto rounded-2xl bg-stone-950 px-4 py-4 text-sm text-stone-100">
                /api/drama/{`{provider}`}/{`{endpoint}`}
              </code>
            </DocsPanel>
          </aside>

          <div className="space-y-6">
            <DocsPanel id="quickstart" title="Quickstart">
              <div className="grid gap-4 sm:grid-cols-3">
                <StepCard
                  number="1"
                  title="Deploy to Vercel"
                  description="Deploy repo ini dan gunakan domain hasil Vercel sebagai base URL API publik."
                />
                <StepCard
                  number="2"
                  title="Pick provider"
                  description="Ganti hanya segmen provider seperti `meloshort`, `reelshort`, atau `netshort`."
                />
                <StepCard
                  number="3"
                  title="Call normalized routes"
                  description="Gunakan endpoint seragam seperti `detail?id=` dan `stream?id=&episode=`."
                />
              </div>

              <pre className="mt-6 overflow-x-auto rounded-[1.5rem] bg-stone-950 px-5 py-5 text-sm leading-7 text-stone-100">
                {quickstart}
              </pre>
            </DocsPanel>

            <DocsPanel id="providers" title="Supported Providers">
              <div className="flex flex-wrap gap-3">
                {PROVIDERS.map((provider) => (
                  <code
                    key={provider}
                    className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700"
                  >
                    {provider}
                  </code>
                ))}
              </div>
            </DocsPanel>

            <DocsPanel id="endpoints" title="Endpoints">
              <div className="grid gap-4">
                {endpointDocs.map((endpoint) => (
                  <div
                    key={endpoint.name}
                    className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="md:max-w-lg">
                        <h3 className="text-lg font-semibold text-stone-900">
                          {endpoint.name}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                          {endpoint.description}
                        </p>
                      </div>
                      <code className="overflow-x-auto rounded-2xl bg-stone-950 px-4 py-3 text-sm text-stone-100">
                        {endpoint.example}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </DocsPanel>

            <DocsPanel title="Cross-site Fetch Example">
              <pre className="overflow-x-auto rounded-[1.5rem] bg-stone-950 px-5 py-5 text-sm leading-7 text-stone-100">
                {browserExample}
              </pre>
            </DocsPanel>

            <DocsPanel id="response" title="Normalized Response Shape">
              <p className="max-w-3xl text-sm leading-6 text-stone-600">
                Setiap endpoint JSON mengembalikan envelope yang konsisten:
                `author`, `provider`, `message`, `type`, dan `data`. Isi `data`
                memang berbeda per endpoint, tetapi bentuk luarnya stabil untuk
                semua provider.
              </p>

              <pre className="mt-5 overflow-x-auto rounded-[1.5rem] bg-stone-950 px-5 py-5 text-sm leading-7 text-stone-100">
                {responseShape}
              </pre>
            </DocsPanel>

            <DocsPanel id="cors" title="CORS & Media Proxy">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                  <h3 className="text-lg font-semibold text-stone-900">
                    CORS enabled
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Route JSON dan media sudah merespons `OPTIONS` dan
                    mengirimkan `Access-Control-Allow-Origin: *`, sehingga bisa
                    dipanggil dari domain web lain.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
                  <h3 className="text-lg font-semibold text-stone-900">
                    Media stays behind your domain
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Video, subtitle, dan manifest `.m3u8` diteruskan lewat
                    `/api/drama/media`, termasuk rewrite isi HLS manifest.
                  </p>
                </div>
              </div>
            </DocsPanel>
          </div>
        </section>
      </div>
    </main>
  );
}

function DocsPanel({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-[1.75rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(44,34,24,0.08)]"
    >
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-5 py-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
        {label}
      </div>
      <div className="mt-2 break-words text-lg font-semibold text-stone-900">
        {value}
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-950 text-sm font-semibold text-stone-50">
        {number}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
    </div>
  );
}
