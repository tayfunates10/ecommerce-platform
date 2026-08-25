"use client";

import { useEffect, useRef, useState } from "react";

type VideoSource = {
  src: string;
  type: string;
};

type Props = {
  poster: string;
  sources: VideoSource[];
  ariaLabel: string;
  className?: string;
  muted?: boolean;
  loop?: boolean;
};

export function DeferredVideo({
  poster,
  sources,
  ariaLabel,
  className,
  muted = true,
  loop = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canLoad, setCanLoad] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!("IntersectionObserver" in window)) {
      setCanLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setCanLoad(true);
        observer.disconnect();
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      aria-label={ariaLabel}
      poster={poster}
      preload="none"
      playsInline
      muted={muted}
      loop={loop}
      controls
    >
      {canLoad
        ? sources.map((source) => <source key={`${source.src}:${source.type}`} src={source.src} type={source.type} />)
        : null}
    </video>
  );
}
