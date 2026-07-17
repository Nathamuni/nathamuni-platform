"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Story } from "@/lib/stories";
import { SOCIAL_LINKS } from "@/lib/social";
import { ThoughtCard } from "./ThoughtCard";

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Owner-verified quotes (see docs/content-source.md) cycled deterministically
 * through the wall — no Math.random, so static export output is stable.
 */
const THOUGHTS: { quote: string; hue: number }[] = [
  { quote: "Preparedness over prediction.", hue: 262 },
  { quote: "Fear lives in one place only... in your Mind.", hue: 320 },
  {
    quote: "Systems over motivation. Deletion over discipline theatre.",
    hue: 192,
  },
  {
    quote:
      "Yaadhum oore yaavarum kelir — every town is my town, everyone is my kin.",
    hue: 152,
  },
  { quote: "Grew in the silence before exhibiting the process.", hue: 38 },
  { quote: "Tested on myself first.", hue: 340 },
];

const END_CAP = {
  quote: "The archive keeps growing — every story lands here automatically.",
  mark: "⟡ logged for the future",
  hue: 300,
};

type GridItem =
  | { kind: "story"; story: Story; storyIndex: number }
  | {
      kind: "thought";
      key: string;
      quote: string;
      hue: number;
      mark?: string;
      isEndCap?: boolean;
    };

/**
 * Interleaves a ThoughtCard after every 6th story (cycling through the
 * quotes above) and always appends the vibrant end-cap card last. Story
 * indices are tracked independently of grid position so the lightbox
 * prev/next math is unaffected by the interspersed cards.
 */
function buildGridItems(stories: Story[]): GridItem[] {
  const items: GridItem[] = [];
  let thoughtCount = 0;
  stories.forEach((story, storyIndex) => {
    items.push({ kind: "story", story, storyIndex });
    if ((storyIndex + 1) % 6 === 0) {
      const t = THOUGHTS[thoughtCount % THOUGHTS.length];
      items.push({
        kind: "thought",
        key: `thought-${storyIndex}`,
        quote: t.quote,
        hue: t.hue,
      });
      thoughtCount += 1;
    }
  });
  items.push({
    kind: "thought",
    key: "thought-endcap",
    quote: END_CAP.quote,
    hue: END_CAP.hue,
    mark: END_CAP.mark,
    isEndCap: true,
  });
  return items;
}

/** Hover previews loop the first few seconds only — enough to tease the clip. */
const PREVIEW_SECONDS = 5;
/** If playback hasn't started this long after opening, offer Instagram instead. */
const STALL_TIMEOUT_MS = 15_000;

/**
 * Card media: poster by default; on mouse hover (desktop only,
 * reduced-motion-safe) the first PREVIEW_SECONDS of the clip loop muted in
 * place. The video element only mounts while hovered, so the grid never
 * downloads clips on its own.
 */
function MomentCardMedia({ story }: { story: Story }) {
  const [preview, setPreview] = useState(false);

  return (
    <span
      className="moment-card-media"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          return;
        setPreview(true);
      }}
      onPointerLeave={() => setPreview(false)}
    >
      {story.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.poster}
          alt=""
          loading="lazy"
          className="moment-poster"
        />
      ) : (
        <span className="moment-poster bg-gradient-to-br from-violet-600/40 to-pink-500/30 flex items-center justify-center">
          <span aria-hidden className="text-2xl text-white/70">
            ▶
          </span>
        </span>
      )}
      {preview && (
        <video
          src={story.video}
          muted
          playsInline
          autoPlay
          loop
          preload="none"
          className="moment-hover-preview"
          data-testid="moment-hover-preview"
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.currentTime > PREVIEW_SECONDS) v.currentTime = 0;
          }}
        />
      )}
    </span>
  );
}

/**
 * Grid of archived stories with a tap-to-play lightbox. These clips are
 * self-hosted (Instagram deletes stories after 24h, so there is nothing to
 * link out to) — posters load lazily, video only streams on tap.
 */
export function MomentsWall({ stories }: { stories: Story[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? stories[activeIndex] : null;
  const gridItems = useMemo(() => buildGridItems(stories), [stories]);
  const [playbackStarted, setPlaybackStarted] = useState(false);
  const [stalled, setStalled] = useState(false);

  // Slow-connection escape hatch: if the clip hasn't started playing
  // STALL_TIMEOUT_MS after opening (or switching stories), surface an
  // Instagram link instead of leaving the visitor staring at a black box.
  const resetStall = useCallback(() => {
    setPlaybackStarted(false);
    setStalled(false);
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;
    const timer = window.setTimeout(() => setStalled(true), STALL_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex]);

  const goPrev = useCallback(() => {
    resetStall();
    setActiveIndex((i) =>
      i === null ? i : (i - 1 + stories.length) % stories.length,
    );
  }, [stories.length, resetStall]);

  const goNext = useCallback(() => {
    resetStall();
    setActiveIndex((i) => (i === null ? i : (i + 1) % stories.length));
  }, [stories.length, resetStall]);

  const close = useCallback(() => setActiveIndex(null), []);

  const handleEnded = useCallback(() => {
    resetStall();
    setActiveIndex((i) => {
      if (i === null) return i;
      if (i === stories.length - 1) return null;
      return i + 1;
    });
  }, [stories.length, resetStall]);

  useEffect(() => {
    if (activeIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") close();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, goPrev, goNext, close]);

  return (
    <>
      <div className="moments-grid" data-testid="moments-grid">
        {gridItems.map((item) =>
          item.kind === "thought" ? (
            <ThoughtCard
              key={item.key}
              quote={item.quote}
              hue={item.hue}
              mark={item.mark}
              isEndCap={item.isEndCap}
            />
          ) : (
            <button
              key={item.story.id}
              type="button"
              className="moment-card"
              onClick={() => {
                resetStall();
                setActiveIndex(item.storyIndex);
              }}
              aria-label={`Play story from ${formatDate(item.story.date)}`}
            >
              <MomentCardMedia story={item.story} />
              <span className="moment-play" aria-hidden>
                ▶
              </span>
              <span className="moment-date">{formatDate(item.story.date)}</span>
            </button>
          ),
        )}
      </div>

      {/* Portaled to <body>: the page-transition wrapper animates transform,
          which would otherwise become the containing block for this fixed
          overlay and push it off-screen. */}
      {active &&
        createPortal(
          <div
            className="moment-lightbox"
            data-testid="moment-lightbox"
            role="dialog"
            aria-modal="true"
            onClick={close}
          >
            <div
              className="moment-lightbox-inner"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                key={active.id}
                src={active.video}
                poster={active.poster ?? undefined}
                controls
                autoPlay
                playsInline
                onEnded={handleEnded}
                onPlaying={() => setPlaybackStarted(true)}
                className="moment-video"
              />
              {stalled && !playbackStarted && (
                <div className="moment-stall" data-testid="moment-stall">
                  <p>This clip is taking a while to load.</p>
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Watch on Instagram ↗
                  </a>
                </div>
              )}
              {stories.length > 1 && (
                <>
                  <button
                    type="button"
                    className="moment-nav moment-nav-prev"
                    onClick={goPrev}
                    aria-label="Previous moment"
                    data-testid="moment-nav-prev"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="moment-nav moment-nav-next"
                    onClick={goNext}
                    aria-label="Next moment"
                    data-testid="moment-nav-next"
                  >
                    ›
                  </button>
                </>
              )}
              <div className="moment-lightbox-meta">
                <span>{formatDate(active.date)}</span>
                <button type="button" className="moment-close" onClick={close}>
                  ✕ Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
