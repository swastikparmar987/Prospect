"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

/* -------------------------------------------------------------------------- */
/* 1. ScrollProgressBar                                                       */
/* -------------------------------------------------------------------------- */

export interface ScrollProgressBarProps {
  /** Height of the progress bar in pixels (default: 3) */
  height?: number;
  /** Primary glow color (default: #E0FB66 electric lime) */
  color?: string;
  /** Custom class name for the wrapper */
  className?: string;
  /** Show the moving neon head spark/pip at the tip */
  showHeadGlow?: boolean;
  /** Z-index level (default: 50) */
  zIndex?: number;
}

/**
 * ScrollProgressBar
 * A sleek 3px electric-lime #E0FB66 glow progress bar fixed at the very top of
 * the window (z-50) tracking window scroll progress (window.scrollY / totalHeight).
 *
 * Uses requestAnimationFrame and transform: scaleX for 60-120fps hardware-accelerated performance
 * without causing reflows.
 */
export function ScrollProgressBar({
  height = 3,
  color = "#E0FB66",
  className = "",
  showHeadGlow = true,
  zIndex = 50,
}: ScrollProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number | null>(null);

  const updateProgress = useCallback(() => {
    if (typeof window === "undefined") return;

    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const totalHeight = docHeight - winHeight;

    if (totalHeight <= 0) {
      setProgress(0);
      return;
    }

    const currentProgress = Math.min(Math.max(scrollY / totalHeight, 0), 1);
    setProgress(currentProgress);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      rafId.current = requestAnimationFrame(updateProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial measurement
    updateProgress();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [updateProgress]);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
      className={`fixed top-0 left-0 right-0 pointer-events-none select-none transition-opacity duration-300 ${className}`}
      style={{
        height: `${height}px`,
        zIndex,
        opacity: progress > 0.005 ? 1 : 0,
      }}
    >
      {/* Background Track (Subtle Neo-Brutalist 1px baseline) */}
      <div className="absolute inset-0 bg-black/10 dark:bg-white/10" />

      {/* Progress Bar Fill with Electric Lime Glow */}
      <div
        className="h-full w-full origin-left will-change-transform"
        style={{
          transform: `scaleX(${progress})`,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}, 0 0 20px rgba(224, 251, 102, 0.6), 0 1px 2px rgba(8, 8, 8, 0.3)`,
          transition: "transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* Trailing Neon Spark / Head Glow at tip of progress bar */}
      {showHeadGlow && progress > 0.01 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 will-change-transform pointer-events-none"
          style={{
            left: `${progress * 100}%`,
            transform: "translate(-50%, -50%)",
            transition: "left 0.08s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full border border-[#080808] animate-pulse"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. TiltCard                                                                */
/* -------------------------------------------------------------------------- */

export interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Maximum tilt angle in degrees (default: 8) */
  maxTilt?: number;
  /** Perspective in px (default: 1000) */
  perspective?: number;
  /** Hover scale factor (default: 1.02) */
  scale?: number;
  /** Transition return speed in ms (default: 400) */
  speed?: number;
  /** Whether to show a realistic light glare sheen overlay (default: true) */
  glare?: boolean;
  /** Disable tilt effect (e.g., on specific viewports) */
  disabled?: boolean;
  /** Custom container class */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * TiltCard
 * Reusable 3D interactive tilt wrapper on mouse move with perspective:
 * perspective(1000px) rotateX(...) rotateY(...)
 *
 * Smooth, hardware-accelerated 3D hover physics with spring-like reset,
 * subtle specular glare sheen, and automatic fallback for touch / reduced-motion.
 */
export function TiltCard({
  children,
  maxTilt = 8,
  perspective = 1000,
  scale = 1.02,
  speed = 400,
  glare = true,
  disabled = false,
  className = "",
  style = {},
  onClick,
  ...restProps
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>(
    `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
  );
  const [isHovered, setIsHovered] = useState(false);
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || prefersReducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Relative mouse coordinates from 0 to 1
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Calculate rotation angles (-maxTilt to +maxTilt)
    // Moving up tilts back (negative rotateX), moving right tilts right (positive rotateY)
    const rotateX = Number(((0.5 - y) * (maxTilt * 2)).toFixed(2));
    const rotateY = Number(((x - 0.5) * (maxTilt * 2)).toFixed(2));

    setTransformStyle(
      `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
    );

    if (glare) {
      setGlarePosition({
        x: Math.round(x * 100),
        y: Math.round(y * 100),
      });
    }
  };

  const handleMouseEnter = () => {
    if (disabled || prefersReducedMotion) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (disabled || prefersReducedMotion) return;
    setIsHovered(false);
    setTransformStyle(
      `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
    );
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative will-change-transform ${className}`}
      style={{
        transform: disabled || prefersReducedMotion ? "none" : transformStyle,
        transformStyle: "preserve-3d",
        transition: isHovered
          ? "transform 0.08s ease-out"
          : `transform ${speed}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        ...style,
      }}
      {...restProps}
    >
      {children}

      {/* Dynamic Specular Glare Overlay */}
      {glare && isHovered && !disabled && !prefersReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden transition-opacity duration-300"
          style={{
            opacity: 0.15,
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.8) 0%, rgba(224, 251, 102, 0.25) 40%, transparent 75%)`,
            zIndex: 10,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. useScrollProgress Hook                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Custom hook to monitor normalized window scroll progress (0 to 1).
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId: number | null = null;

    const onScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset;
        const totalHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) {
          setProgress(0);
        } else {
          setProgress(Math.min(Math.max(scrollY / totalHeight, 0), 1));
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return progress;
}

export default ScrollProgressBar;
