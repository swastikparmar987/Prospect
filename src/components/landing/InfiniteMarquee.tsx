"use client";

import React, { useState } from "react";

export interface InfiniteMarqueeProps {
  /** Array of string ticker items or custom nodes */
  items?: string[];
  /** Scrolling speed preset or custom duration in seconds (default: 28) */
  speed?: "slow" | "normal" | "fast" | number;
  /** Scroll direction (default: "left") */
  direction?: "left" | "right";
  /** Pause animation when hovered (default: true) */
  pauseOnHover?: boolean;
  /** Custom wrapper CSS class */
  className?: string;
  /** Custom background color (default: #FDF9F3 warm ivory) */
  backgroundColor?: string;
  /** Star separator symbol or custom node */
  starSymbol?: React.ReactNode;
}

const DEFAULT_MARQUEE_ITEMS = [
  "NO MORE GHOST JOBS",
  "EXPLAINABLE FIT",
  "SENIORITY SHIELD ACTIVE",
  "REAL OPPORTUNITIES",
  "1-CLICK PREP",
  "BUILT FOR BUILDERS",
];

/**
 * InfiniteMarquee
 * A bold, stylish Neo-Brutalist moving ticker banner:
 * '✦ NO MORE GHOST JOBS ✦ EXPLAINABLE FIT ✦ SENIORITY SHIELD ACTIVE ✦ REAL OPPORTUNITIES ✦ 1-CLICK PREP ✦ BUILT FOR BUILDERS ✦'
 *
 * Features:
 * - Warm ivory background (#FDF9F3)
 * - 2px black border (border-y-2 border-[#080808])
 * - Electric lime (#E0FB66) star separators with bold neo-brutalist drop shadow
 * - Infinite seamless CSS marquee animation with hover-pause
 * - Hardware-accelerated GPU transforms (translate3d)
 * - Accessible with prefers-reduced-motion fallback
 */
export function InfiniteMarquee({
  items = DEFAULT_MARQUEE_ITEMS,
  speed = "normal",
  direction = "left",
  pauseOnHover = true,
  className = "",
  backgroundColor = "#FDF9F3",
  starSymbol,
}: InfiniteMarqueeProps) {
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  // Speed calculation in seconds
  const getDuration = (): number => {
    if (typeof speed === "number") return speed;
    switch (speed) {
      case "fast":
        return 18;
      case "slow":
        return 42;
      case "normal":
      default:
        return 28;
    }
  };

  const duration = getDuration();
  const animationName =
    direction === "right"
      ? "marquee-slide-reverse"
      : "marquee-slide-forward";

  // Render the star separator in glowing electric lime with neo-brutalist stroke/shadow
  const renderStar = (index: number) => {
    if (starSymbol) return starSymbol;
    return (
      <span
        key={`star-${index}`}
        className="inline-flex items-center justify-center text-[#E0FB66] text-lg sm:text-xl font-black select-none mx-3 sm:mx-5 transition-transform duration-300 drop-shadow-[1.5px_1.5px_0px_#080808]"
        style={{
          textShadow:
            "0 0 8px rgba(224, 251, 102, 0.7), 1px 1px 0px #080808, -1px -1px 0px #080808, 1px -1px 0px #080808, -1px 1px 0px #080808",
        }}
        aria-hidden="true"
      >
        ✦
      </span>
    );
  };

  // Repeated items track for seamless loop without visual gaps
  const renderTrackGroup = (groupKey: string) => (
    <div
      key={groupKey}
      className="flex shrink-0 items-center justify-around min-w-full py-2.5 sm:py-3"
      aria-hidden={groupKey !== "track-0"}
    >
      {items.map((item, idx) => (
        <span
          key={`${groupKey}-item-${idx}`}
          className="inline-flex items-center whitespace-nowrap group/item cursor-default"
        >
          {renderStar(idx)}
          <span className="font-heading font-black text-xs sm:text-sm md:text-base tracking-widest uppercase text-[#080808] transition-colors duration-150 group-hover/item:text-[#111111]">
            {item}
          </span>
        </span>
      ))}
      {/* Final star to close the loop smoothly */}
      {renderStar(items.length)}
    </div>
  );

  return (
    <div
      className={`w-full overflow-hidden border-y-2 border-[#080808] shadow-[0_4px_0px_#080808] relative select-none ${className}`}
      style={{ backgroundColor }}
      onMouseEnter={() => pauseOnHover && setIsPausedByUser(true)}
      onMouseLeave={() => pauseOnHover && setIsPausedByUser(false)}
      role="region"
      aria-label="Prospect Announcement Banner"
    >
      <style>{`
        @keyframes marquee-slide-forward {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        @keyframes marquee-slide-reverse {
          0% {
            transform: translate3d(-50%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .prospect-marquee-inner {
            animation: none !important;
            transform: none !important;
            overflow-x: auto;
          }
        }
      `}</style>

      {/* Marquee Inner Flex Track */}
      <div
        className="prospect-marquee-inner flex w-max will-change-transform"
        style={{
          animationName,
          animationDuration: `${duration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationPlayState: isPausedByUser ? "paused" : "running",
        }}
      >
        {/* Track 1 & 2 repeated for seamless infinite continuity */}
        {renderTrackGroup("track-0")}
        {renderTrackGroup("track-1")}
      </div>
    </div>
  );
}

export default InfiniteMarquee;
