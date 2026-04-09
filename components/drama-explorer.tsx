"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HlsVideoPlayer } from "@/components/hls-video-player";
import { createDramaApiClient, createDramaApiPath } from "@/lib/drama/sdk";
import type {
  ApiEnvelope,
  DramaDetailPayload,
  DramaSummary,
  ListPayload,
  NormalizedLanguage,
  ProviderName,
  StreamPayload,
} from "@/lib/drama/types";
import { PROVIDERS } from "@/lib/drama/types";

const FEEDS = [
  { id: "home", label: "Home", hint: "Landing feed" },
  { id: "popular", label: "Popular", hint: "Most watched" },
  { id: "latest", label: "Latest", hint: "Fresh releases" },
  { id: "search", label: "Search", hint: "Keyword search" },
] as const;

const api = createDramaApiClient();

function formatJsonPreview(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function pickDefaultLanguage(languages: NormalizedLanguage[]) {
  return (
    languages.find((item) => item.code.toLowerCase() === "en")?.code ||
    languages[0]?.code ||
    "en"
  );
}

function findEpisode(
  detail: DramaDetailPayload | null,
  episodeNumber: number | null,
) {
  if (!detail || episodeNumber === null) {
    return undefined;
  }

  return detail.episodes.find((item) => item.number === episodeNumber);
}

export function DramaExplorer() {
  const [provider, setProvider] = useState<ProviderName>("meloshort");
  const [languages, setLanguages] = useState<NormalizedLanguage[]>([]);
  const [language, setLanguage] = useState("en");
  const [feed, setFeed] = useState<(typeof FEEDS)[number]["id"]>("home");
  const [queryInput, setQueryInput] = useState("love");
  const [items, setItems] = useState<DramaSummary[]>([]);
  const [listEnvelope, setListEnvelope] =
    useState<ApiEnvelope<ListPayload> | null>(null);
  const [detailEnvelope, setDetailEnvelope] =
    useState<ApiEnvelope<DramaDetailPayload> | null>(null);
  const [streamEnvelope, setStreamEnvelope] =
    useState<ApiEnvelope<StreamPayload> | null>(null);
  const [selectedDramaId, setSelectedDramaId] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingStream, setLoadingStream] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const selectedDetail = detailEnvelope?.data ?? null;
  const selectedStream = streamEnvelope?.data ?? null;
  const activeEpisode = findEpisode(selectedDetail, selectedEpisode);
  const selectedFeed = FEEDS.find((item) => item.id === feed) ?? FEEDS[0];

  const listRequestPath = useMemo(() => {
    if (feed === "search") {
      return createDramaApiPath(provider, "search", {
        query: queryInput || "love",
        page: 1,
        lang: language,
      });
    }

    return createDramaApiPath(provider, feed, {
      page: 1,
      lang: language,
    });
  }, [feed, language, provider, queryInput]);

  const endpointExamples = useMemo(() => {
    const activeDramaId = selectedDramaId || "YOUR_DRAMA_ID";
    const activeEpisodeNumber = selectedEpisode ?? 1;

    return [
      {
        label: "Languages",
        path: createDramaApiPath(provider, "languages"),
      },
      {
        label: "Feed",
        path: listRequestPath,
      },
      {
        label: "Detail",
        path: createDramaApiPath(provider, "detail", {
          id: activeDramaId,
          lang: language,
        }),
      },
      {
        label: "Stream",
        path: createDramaApiPath(provider, "stream", {
          id: activeDramaId,
          episode: activeEpisodeNumber,
          lang: language,
        }),
      },
    ];
  }, [language, listRequestPath, provider, selectedDramaId, selectedEpisode]);

  useEffect(() => {
    let cancelled = false;

    async function loadLanguages() {
      setError(null);

      try {
        const payload = await api.getLanguages(provider);
        if (cancelled) {
          return;
        }

        setLanguages(payload.data);
        setLanguage((current) => {
          if (payload.data.some((item) => item.code === current)) {
            return current;
          }

          return pickDefaultLanguage(payload.data);
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load languages",
          );
          setLanguages([]);
        }
      }
    }

    void loadLanguages();

    return () => {
      cancelled = true;
    };
  }, [provider]);

  useEffect(() => {
    if (!language) {
      return;
    }

    let cancelled = false;

    async function loadFeed() {
      setLoadingList(true);
      setError(null);
      setDetailEnvelope(null);
      setStreamEnvelope(null);
      setSelectedDramaId(null);
      setSelectedEpisode(null);

      try {
        const payload =
          feed === "search"
            ? await api.search(provider, {
                query: queryInput || "love",
                page: 1,
                lang: language,
              })
            : feed === "popular"
              ? await api.getPopular(provider, { page: 1, lang: language })
              : feed === "latest"
                ? await api.getLatest(provider, { page: 1, lang: language })
                : await api.getHome(provider, { page: 1, lang: language });

        if (cancelled) {
          return;
        }

        setListEnvelope(payload);
        setItems(payload.data.items);

        if (payload.data.items[0]) {
          setSelectedDramaId(payload.data.items[0].id);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load list",
          );
          setItems([]);
          setListEnvelope(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    }

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, [feed, language, provider, queryInput]);

  useEffect(() => {
    if (!selectedDramaId) {
      return;
    }

    const dramaId = selectedDramaId;
    let cancelled = false;

    async function loadDetail() {
      setLoadingDetail(true);
      setError(null);

      try {
        const payload = await api.getDetail(provider, {
          id: dramaId,
          lang: language,
        });

        if (cancelled) {
          return;
        }

        setDetailEnvelope(payload);
        const unlockedEpisode =
          payload.data.episodes.find((item) => !item.locked)?.number ||
          payload.data.episodes[0]?.number ||
          null;
        setSelectedEpisode(unlockedEpisode);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load detail",
          );
          setDetailEnvelope(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [language, provider, selectedDramaId]);

  useEffect(() => {
    if (!selectedDramaId || selectedEpisode === null) {
      return;
    }

    const dramaId = selectedDramaId;
    const episodeNumber = selectedEpisode;
    let cancelled = false;

    async function loadStream() {
      setLoadingStream(true);
      setError(null);

      try {
        const payload = await api.getStream(provider, {
          id: dramaId,
          episode: episodeNumber,
          lang: language,
        });

        if (!cancelled) {
          setStreamEnvelope(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load stream",
          );
          setStreamEnvelope(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingStream(false);
        }
      }
    }

    void loadStream();

    return () => {
      cancelled = true;
    };
  }, [language, provider, selectedDramaId, selectedEpisode]);

  useEffect(() => {
    if (!copiedPath) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopiedPath(null);
    }, 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copiedPath]);

  async function copyPath(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
    } catch {
      setCopiedPath(null);
    }
  }

  const activeSource = selectedStream?.streams[0];

  return (
    <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_460px]">
      <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <Panel
          eyebrow="Controls"
          title="Explorer"
          description="Pilih provider, bahasa, dan feed. Semua request tetap memakai pola yang sama."
        >
          <div className="space-y-4">
            <Field label="Provider">
              <select
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                value={provider}
                onChange={(event) =>
                  setProvider(event.target.value as ProviderName)
                }
              >
                {PROVIDERS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Language">
              <select
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Search Query">
              <input
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-500"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="love"
              />
            </Field>
          </div>

          <div className="mt-6 grid gap-3">
            {FEEDS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFeed(item.id)}
                className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${
                  feed === item.id
                    ? "border-stone-900 bg-stone-950 text-stone-50 shadow-lg"
                    : "border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50"
                }`}
              >
                <div className="text-sm font-semibold">{item.label}</div>
                <div
                  className={`mt-1 text-xs ${
                    feed === item.id ? "text-stone-300" : "text-stone-500"
                  }`}
                >
                  {item.hint}
                </div>
              </button>
            ))}
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </Panel>

        <Panel
          eyebrow="Request"
          title="Current Feed Call"
          description="Request aktif untuk feed yang sedang ditampilkan."
        >
          <CodeCard
            path={listRequestPath}
            copied={copiedPath === listRequestPath}
            onCopy={copyPath}
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard label="Provider" value={provider} />
            <MetricCard label="Feed" value={selectedFeed.label} />
            <MetricCard label="Items" value={String(items.length)} />
          </div>
        </Panel>

        <Panel
          eyebrow="Need Docs?"
          title="Public Integration"
          description="Buka dokumentasi untuk quickstart, contoh fetch, dan kontrak response."
        >
          <Link
            href="/docs"
            className="inline-flex items-center rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
          >
            Open Docs
          </Link>
        </Panel>
      </aside>

      <div className="space-y-6">
        <Panel
          eyebrow="Results"
          title="Drama Catalog"
          description={
            loadingList
              ? "Memuat daftar drama..."
              : `${items.length} hasil untuk ${selectedFeed.label.toLowerCase()} pada provider ${provider}.`
          }
        >
          <div className="grid gap-4">
            {items.length === 0 && !loadingList ? (
              <EmptyState
                title="Belum ada drama yang tampil"
                description="Coba ganti provider, bahasa, atau feed untuk memuat katalog lain."
              />
            ) : null}

            {items.map((item) => {
              const isActive = item.id === selectedDramaId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedDramaId(item.id)}
                  className={`grid gap-4 rounded-[1.5rem] border p-4 text-left transition md:grid-cols-[110px_minmax(0,1fr)_120px] ${
                    isActive
                      ? "border-stone-900 bg-stone-950 text-stone-50 shadow-lg"
                      : "border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50"
                  }`}
                >
                  <div className="overflow-hidden rounded-[1rem] bg-stone-200">
                    {item.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="aspect-[3/4] h-full w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-[3/4] bg-gradient-to-br from-stone-200 to-stone-100" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="line-clamp-2 text-lg font-semibold">
                        {item.title}
                      </h3>
                      {item.isNew ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          New
                        </span>
                      ) : null}
                    </div>

                    <p
                      className={`mt-2 line-clamp-3 text-sm leading-6 ${
                        isActive ? "text-stone-300" : "text-stone-600"
                      }`}
                    >
                      {item.description || "No description available."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge
                        active={isActive}
                        label={`${item.episodeCount ?? "?"} eps`}
                      />
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} active={isActive} label={tag} />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3 md:items-end">
                    <div
                      className={`text-sm ${
                        isActive ? "text-stone-300" : "text-stone-500"
                      }`}
                    >
                      {item.watchCount || item.likes || item.followCount || "-"}
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive
                          ? "bg-white/10 text-stone-100"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {isActive ? "Selected" : "Open detail"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          eyebrow="Contract"
          title="Common Calls"
          description="Path ini yang nanti paling sering dipakai dari web lain."
        >
          <div className="grid gap-3">
            {endpointExamples.map((example) => (
              <div
                key={example.path}
                className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4"
              >
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  {example.label}
                </div>
                <CodeCard
                  path={example.path}
                  copied={copiedPath === example.path}
                  onCopy={copyPath}
                />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <Panel
          eyebrow="Detail"
          title={selectedDetail?.title || "Select a drama"}
          description={
            loadingDetail
              ? "Memuat detail drama..."
              : selectedDetail
                ? `${selectedDetail.episodes.length} episode siap dipilih`
                : "Pilih drama di kolom tengah untuk membuka detail."
          }
        >
          {selectedDetail ? (
            <>
              <div className="flex flex-wrap gap-2">
                {selectedDetail.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-sm leading-7 text-stone-600">
                {selectedDetail.description || "No description available."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Episodes"
                  value={String(selectedDetail.episodeCount ?? "-")}
                />
                <MetricCard
                  label="Status"
                  value={selectedDetail.isFinished ? "Finished" : "Ongoing"}
                />
                <MetricCard
                  label="Original"
                  value={selectedDetail.originalLanguage || language}
                />
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Player
                  </h3>
                  <span className="text-xs text-stone-500">
                    {loadingStream
                      ? "Loading stream..."
                      : activeEpisode
                        ? `Episode ${activeEpisode.number}`
                        : "No episode"}
                  </span>
                </div>
                <HlsVideoPlayer
                  poster={selectedStream?.posterUrl || selectedDetail.posterUrl}
                  source={activeSource}
                />
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Episodes
                  </h3>
                  <span className="text-xs text-stone-500">
                    Uniform `stream?id=&episode=`
                  </span>
                </div>

                <div className="grid max-h-[24rem] gap-2 overflow-auto pr-1">
                  {selectedDetail.episodes.map((episode) => {
                    const isActive = episode.number === selectedEpisode;

                    return (
                      <button
                        key={`${episode.id}-${episode.number}`}
                        type="button"
                        onClick={() => setSelectedEpisode(episode.number)}
                        className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-stone-900 bg-stone-950 text-stone-50"
                            : "border-stone-200 bg-stone-50 hover:border-stone-400 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">
                              Episode {episode.number}
                            </div>
                            <div
                              className={`mt-1 text-xs ${
                                isActive ? "text-stone-300" : "text-stone-500"
                              }`}
                            >
                              {episode.title || "Stream via normalized route"}
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              episode.locked
                                ? isActive
                                  ? "bg-white/10 text-stone-200"
                                  : "bg-amber-100 text-amber-700"
                                : isActive
                                  ? "bg-white/10 text-stone-200"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {episode.locked ? "Locked" : "Ready"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <JsonDisclosure
                  title="Active Stream Payload"
                  subtitle={
                    loadingStream
                      ? "Memuat payload stream..."
                      : "Payload hasil normalisasi stream."
                  }
                  content={selectedStream}
                />
                <JsonDisclosure
                  title="Detail Payload"
                  subtitle="Payload hasil normalisasi detail."
                  content={selectedDetail}
                />
                <JsonDisclosure
                  title="List Payload"
                  subtitle="Payload hasil normalisasi feed."
                  content={listEnvelope?.data}
                />
              </div>
            </>
          ) : (
            <EmptyState
              title="Belum ada detail"
              description="Setelah Anda memilih drama, panel ini akan menampilkan player, episode, dan payload normalisasi."
            />
          )}
        </Panel>
      </aside>
    </section>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(44,34,24,0.08)] backdrop-blur">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-stone-900">{value}</div>
    </div>
  );
}

function Badge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        active ? "bg-white/10 text-stone-100" : "bg-stone-100 text-stone-700"
      }`}
    >
      {label}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-sm text-stone-500">
      <div className="font-semibold text-stone-700">{title}</div>
      <p className="mt-2 leading-6">{description}</p>
    </div>
  );
}

function CodeCard({
  path,
  copied,
  onCopy,
}: {
  path: string;
  copied: boolean;
  onCopy: (path: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[1.25rem] bg-stone-950 p-3 text-stone-100">
      <code className="min-w-0 flex-1 overflow-x-auto text-sm leading-6">
        {path}
      </code>
      <button
        type="button"
        onClick={() => onCopy(path)}
        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-stone-100 transition hover:bg-white/10"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function JsonDisclosure({
  title,
  subtitle,
  content,
}: {
  title: string;
  subtitle: string;
  content: unknown;
}) {
  return (
    <details className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-stone-900">{title}</div>
            <div className="mt-1 text-xs text-stone-500">{subtitle}</div>
          </div>
          <span className="text-xs uppercase tracking-[0.18em] text-stone-500">
            Raw JSON
          </span>
        </div>
      </summary>
      <pre className="mt-4 overflow-x-auto text-xs leading-6 text-stone-700">
        {formatJsonPreview(content)}
      </pre>
    </details>
  );
}
