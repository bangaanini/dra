"use client";

import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StreamSource } from "@/lib/drama/types";

interface HlsVideoPlayerProps {
  poster?: string;
  source?: StreamSource;
}

export function HlsVideoPlayer({ poster, source }: HlsVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<{
    sourceUrl: string;
    message: string;
  } | null>(null);

  const status = useMemo(() => {
    if (source && runtimeStatus?.sourceUrl === source.url) {
      return runtimeStatus.message;
    }

    if (!source) {
      return "Pilih episode untuk mulai memutar.";
    }

    if (source.format === "mp4") {
      return "MP4 source ready.";
    }

    return "Preparing HLS source...";
  }, [runtimeStatus, source]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !source) {
      return;
    }

    video.pause();
    video.removeAttribute("src");
    video.load();

    if (source.format === "mp4") {
      video.src = source.url;
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source.url;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
      });

      hls.loadSource(source.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setRuntimeStatus({
          sourceUrl: source.url,
          message: "HLS stream ready.",
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setRuntimeStatus({
            sourceUrl: source.url,
            message: `Video error: ${data.type}`,
          });
          hls.destroy();
        }
      });

      return () => {
        hls.destroy();
      };
    }
  }, [source]);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-950 shadow-[0_24px_80px_rgba(28,25,23,0.18)]">
      <div className="border-b border-white/10 px-5 py-4 text-sm text-stone-300">
        {source ? `${source.label} via internal media proxy` : status}
      </div>
      <div className="aspect-[9/16] bg-black">
        <video
          ref={videoRef}
          className="h-full w-full"
          controls
          playsInline
          poster={poster}
        />
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-xs text-stone-400">
        {source ? status : "Player akan otomatis memakai HLS.js saat dibutuhkan."}
      </div>
    </div>
  );
}
