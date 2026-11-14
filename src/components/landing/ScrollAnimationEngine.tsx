"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Safe SSR layout effect to avoid hydration mismatches
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Global singleton flag to prevent redundant GSAP plugin registrations
 */
let isPluginRegistered = false;

/**
 * Safely register GSAP + ScrollTrigger in client-side environment
 */
export function registerScrollTrigger(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (!isPluginRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    // Configure default ScrollTrigger behavior
    ScrollTrigger.config({
      limitCallbacks: true,
      ignoreMobileResize: true,
    });
    isPluginRegistered = true;
  }
  return true;
}

// Auto-register immediately when loaded in the browser
if (typeof window !== "undefined") {
  registerScrollTrigger();
}

/**
 * Checks whether user prefers reduced motion
 */
export function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * React hook to reactively track prefers-reduced-motion media query
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    getPrefersReducedMotion()
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Master hook for GSAP ScrollTrigger engine.
 * - Handles registration and ready state
 * - Provides debounced window resize refresh
 * - Provides automatic unmount cleanup for triggers created via the hook
 * - Returns GSAP and ScrollTrigger instances and helper creation methods
 */
export interface UseScrollAnimationEngineOptions {
  /** Whether to listen to window resize with a debounce and trigger ScrollTrigger.refresh() (default true) */
  refreshOnResize?: boolean;
  /** Debounce delay for resize refresh in ms (default 150) */
  resizeDebounceMs?: number;
}

export interface ScrollAnimationEngineInstance {
  isReady: boolean;
  reducedMotion: boolean;
  refresh: () => void;
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  createScrollTrigger: (vars: ScrollTrigger.Vars) => ScrollTrigger | null;
  createTimeline: (vars?: gsap.TimelineVars) => gsap.core.Timeline;
}

export function useScrollAnimationEngine(
  options: UseScrollAnimationEngineOptions = {}
): ScrollAnimationEngineInstance {
  const { refreshOnResize = true, resizeDebounceMs = 150 } = options;
  const [isReady, setIsReady] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const createdTriggersRef = useRef<ScrollTrigger[]>([]);

  // Register and establish ready state
  useIsomorphicLayoutEffect(() => {
    const registered = registerScrollTrigger();
    setIsReady(registered);

    // Initial refresh after microtask / DOM layout stabilizes
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        ScrollTrigger.refresh();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Window resize handler with debounce
  useEffect(() => {
    if (!refreshOnResize || typeof window === "undefined") return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, resizeDebounceMs);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [refreshOnResize, resizeDebounceMs]);

  // Clean up any triggers created specifically through this hook instance on unmount
  useEffect(() => {
    return () => {
      createdTriggersRef.current.forEach((trigger) => {
        if (trigger && typeof trigger.kill === "function") {
          trigger.kill();
        }
      });
      createdTriggersRef.current = [];
    };
  }, []);

  const refresh = useCallback(() => {
    if (typeof window !== "undefined") {
      ScrollTrigger.refresh();
    }
  }, []);

  const createScrollTrigger = useCallback((vars: ScrollTrigger.Vars): ScrollTrigger | null => {
    if (typeof window === "undefined") return null;
    registerScrollTrigger();
    const trigger = ScrollTrigger.create(vars);
    createdTriggersRef.current.push(trigger);
    return trigger;
  }, []);

  const createTimeline = useCallback((vars?: gsap.TimelineVars): gsap.core.Timeline => {
    registerScrollTrigger();
    return gsap.timeline(vars);
  }, []);

  return {
    isReady,
    reducedMotion,
    refresh,
    gsap,
    ScrollTrigger,
    createScrollTrigger,
    createTimeline,
  };
}

// ---------------------------------------------------------------------------
// 1. ScrollReveal Component & Hook
// ---------------------------------------------------------------------------

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

export interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  /** Direction from which element translates. Defaults to 'up' */
  direction?: RevealDirection;
  /** Translation distance in pixels. Defaults to 28 */
  distance?: number;
  /** Initial rotation in degrees. Animates to 0deg. Defaults to -1.5 */
  initialRotation?: number;
  /** Initial scale. Animates to 1. Defaults to 0.95 */
  initialScale?: number;
  /** Initial opacity. Defaults to 0 */
  initialOpacity?: number;
  /** Duration of reveal in seconds. Defaults to 0.75 */
  duration?: number;
  /** Delay in seconds before animation triggers. Defaults to 0 */
  delay?: number;
  /** Stagger interval in seconds when staggering multiple child elements. Defaults to 0.08 */
  stagger?: number | gsap.StaggerVars;
  /** If true, staggers all direct children or elements matching `childSelector`. Defaults to false */
  staggerChildren?: boolean;
  /** CSS selector for targets inside container (e.g. '.reveal-item'). Overrides container target */
  childSelector?: string;
  /** ScrollTrigger start viewport offset. Defaults to 'top 85%' */
  triggerOffset?: string;
  /** Whether animation fires only once. Defaults to true */
  once?: boolean;
  /** Scrub animation smoothly with scroll progress instead of triggering on enter */
  scrub?: boolean | number;
  /** GSAP easing formula. Defaults to 'power3.out' */
  ease?: string;
  /** Optional temporary electric lime shadow pulse when element enters viewport */
  glowPulseOnEnter?: boolean;
  /** Callback fired when element enters viewport */
  onEnter?: () => void;
  /** Callback fired when animation finishes */
  onComplete?: () => void;
}

export const ScrollReveal = forwardRef<HTMLElement, ScrollRevealProps>(function ScrollReveal(
  {
    children,
    className = "",
    as: Component = "div",
    direction = "up",
    distance = 28,
    initialRotation = -1.5,
    initialScale = 0.95,
    initialOpacity = 0,
    duration = 0.75,
    delay = 0,
    stagger = 0.08,
    staggerChildren = false,
    childSelector,
    triggerOffset = "top 85%",
    once = true,
    scrub = false,
    ease = "power3.out",
    glowPulseOnEnter = false,
    onEnter,
    onComplete,
    style,
    ...rest
  },
  forwardedRef
) {
  const containerRef = useRef<HTMLElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useImperativeHandle(forwardedRef, () => containerRef.current as HTMLElement);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    registerScrollTrigger();

    const element = containerRef.current;

    // Graceful fallback for reduced motion: reveal immediately with no jarring animation
    if (reducedMotion) {
      gsap.set(element, { opacity: 1, scale: 1, rotation: 0, x: 0, y: 0 });
      if (childSelector) {
        gsap.set(element.querySelectorAll(childSelector), {
          opacity: 1,
          scale: 1,
          rotation: 0,
          x: 0,
          y: 0,
        });
      }
      return;
    }

    // Determine initial transform vectors
    let fromX = 0;
    let fromY = 0;
    if (direction === "up") fromY = distance;
    if (direction === "down") fromY = -distance;
    if (direction === "left") fromX = distance;
    if (direction === "right") fromX = -distance;

    const ctx = gsap.context(() => {
      // Choose targets: either children matching selector, direct children if staggerChildren, or the container itself
      let targets: Element[] | HTMLElement = element;
      if (childSelector) {
        const found = element.querySelectorAll(childSelector);
        if (found.length > 0) targets = Array.from(found);
      } else if (staggerChildren) {
        targets = Array.from(element.children);
      }

      const tweenVars: gsap.TweenVars = {
        opacity: 1,
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0,
        duration,
        delay,
        ease,
        stagger: (staggerChildren || childSelector) ? (stagger as number | gsap.StaggerVars) : undefined,
        onStart: () => {
          if (glowPulseOnEnter) {
            gsap.fromTo(
              element,
              { boxShadow: "0 0 0px 0px rgba(224, 251, 102, 0)" },
              {
                boxShadow: "0 0 24px 6px rgba(224, 251, 102, 0.65)",
                duration: 0.6,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut",
              }
            );
          }
          if (onEnter) onEnter();
        },
        onComplete: () => {
          if (onComplete) onComplete();
        },
      };

      if (scrub) {
        tweenVars.scrollTrigger = {
          trigger: element,
          start: triggerOffset,
          end: "bottom center",
          scrub: typeof scrub === "number" ? scrub : 0.5,
        };
      } else {
        tweenVars.scrollTrigger = {
          trigger: element,
          start: triggerOffset,
          once,
          toggleActions: once ? "play none none none" : "play reverse play reverse",
        };
      }

      gsap.fromTo(
        targets,
        {
          opacity: initialOpacity,
          scale: initialScale,
          rotation: initialRotation,
          x: fromX,
          y: fromY,
        },
        tweenVars
      );
    }, element);

    return () => {
      ctx.revert();
    };
  }, [
    reducedMotion,
    direction,
    distance,
    initialRotation,
    initialScale,
    initialOpacity,
    duration,
    delay,
    stagger,
    staggerChildren,
    childSelector,
    triggerOffset,
    once,
    scrub,
    ease,
    glowPulseOnEnter,
    onEnter,
    onComplete,
  ]);

  return (
    <Component
      ref={containerRef}
      className={`will-change-[transform,opacity] ${className}`}
      style={{
        // Prevent FOUC before hydration / initial GSAP run
        opacity: reducedMotion ? 1 : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
});

// ---------------------------------------------------------------------------
// 2. ScrollParallax Component & Hook
// ---------------------------------------------------------------------------

export type ParallaxDirection = "vertical" | "horizontal" | "both";

export interface ScrollParallaxProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  /**
   * Parallax speed multiplier.
   * - Positive (e.g. 0.15, 0.2): drifts upward faster than scroll (background depth).
   * - Negative (e.g. -0.2): drifts downward / against scroll (floating foreground).
   * Defaults to 0.15.
   */
  speed?: number;
  /** Parallax motion axis: 'vertical' (default), 'horizontal', or 'both' */
  direction?: ParallaxDirection;
  /** Optional rotational delta in degrees over the scroll range (e.g. 15 -> rotates from -15deg to +15deg) */
  rotate?: number;
  /** Optional scale range tuple [from, to] or target number (e.g. [0.94, 1.0] for zoom-in effects) */
  scale?: number | [number, number];
  /** Custom trigger element ref. If omitted, uses the parallax element itself or parent */
  triggerRef?: React.RefObject<HTMLElement | null>;
  /** ScrollTrigger start position. Defaults to 'top bottom' */
  start?: string;
  /** ScrollTrigger end position. Defaults to 'bottom top' */
  end?: string;
  /** Scrub smoothing in seconds for liquid inertia. Defaults to 0.5 */
  scrub?: boolean | number;
  /** GSAP easing. Defaults to 'none' for uniform parallax */
  ease?: string;
}

export const ScrollParallax = forwardRef<HTMLElement, ScrollParallaxProps>(function ScrollParallax(
  {
    children,
    className = "",
    as: Component = "div",
    speed = 0.15,
    direction = "vertical",
    rotate,
    scale,
    triggerRef,
    start = "top bottom",
    end = "bottom top",
    scrub = 0.5,
    ease = "none",
    style,
    ...rest
  },
  forwardedRef
) {
  const elementRef = useRef<HTMLElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useImperativeHandle(forwardedRef, () => elementRef.current as HTMLElement);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined" || !elementRef.current) return;
    registerScrollTrigger();

    const element = elementRef.current;

    if (reducedMotion) {
      gsap.set(element, { x: 0, y: 0, rotation: 0, scale: 1 });
      return;
    }

    const triggerElement = triggerRef?.current || element;
    const ctx = gsap.context(() => {
      // Calculate travel distances based on speed factor
      // A speed of 0.15 translates to ~60px range across the viewport scroll
      const travel = speed * 400;

      const fromVars: gsap.TweenVars = {};
      const toVars: gsap.TweenVars = {
        ease,
        scrollTrigger: {
          trigger: triggerElement,
          start,
          end,
          scrub: typeof scrub === "number" ? scrub : 0.5,
          invalidateOnRefresh: true,
        },
      };

      if (direction === "vertical" || direction === "both") {
        fromVars.y = travel;
        toVars.y = -travel;
      }
      if (direction === "horizontal" || direction === "both") {
        fromVars.x = travel * 0.75;
        toVars.x = -travel * 0.75;
      }

      if (typeof rotate === "number") {
        fromVars.rotation = -rotate;
        toVars.rotation = rotate;
      }

      if (scale !== undefined) {
        if (Array.isArray(scale)) {
          fromVars.scale = scale[0];
          toVars.scale = scale[1];
        } else {
          fromVars.scale = 1;
          toVars.scale = scale;
        }
      }

      gsap.fromTo(element, fromVars, toVars);
    }, element);

    return () => {
      ctx.revert();
    };
  }, [
    reducedMotion,
    speed,
    direction,
    rotate,
    scale,
    triggerRef,
    start,
    end,
    scrub,
    ease,
  ]);

  return (
    <Component
      ref={elementRef}
      className={`will-change-transform ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
});

// ---------------------------------------------------------------------------
// 3. ScrollBeam Component
// ---------------------------------------------------------------------------

export type BeamOrientation = "horizontal" | "vertical" | "custom";

export interface ScrollBeamProps {
  /** Target container whose scroll progress drives the beam. Defaults to the beam wrapper */
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  /** Layout orientation: 'horizontal' (default), 'vertical', or 'custom' */
  orientation?: BeamOrientation;
  /** Custom SVG path string (e.g. 'M 0 50 Q 250 10 500 50 T 1000 50') */
  path?: string;
  /** Color of active progress line. Defaults to '#E0FB66' (electric lime) */
  strokeColor?: string;
  /** Color of background track guide. Defaults to 'rgba(8, 8, 8, 0.12)' */
  trackColor?: string;
  /** Stroke width in pixels. Defaults to 3 */
  strokeWidth?: number;
  /** Whether to show background track. Defaults to true */
  showTrack?: boolean;
  /** Whether to render glowing filter shadow. Defaults to true */
  glow?: boolean;
  /** Glow shadow color. Defaults to '#E0FB66' */
  glowColor?: string;
  /** Whether to show glowing dot marker riding at the beam's drawing head. Defaults to true */
  headMarker?: boolean;
  /** Color of head marker. Defaults to '#E0FB66' */
  headMarkerColor?: string;
  /** Radius of head marker in pixels. Defaults to 5 */
  headMarkerRadius?: number;
  /** ScrollTrigger start offset. Defaults to 'top 75%' */
  startOffset?: string;
  /** ScrollTrigger end offset. Defaults to 'bottom 35%' */
  endOffset?: string;
  /** Scrub smoothing in seconds. Defaults to 0.4 */
  scrub?: boolean | number;
  /** Callback delivering current scroll progress [0, 1] */
  onProgress?: (progress: number) => void;
  style?: React.CSSProperties;
}

export function ScrollBeam({
  containerRef,
  className = "",
  orientation = "horizontal",
  path,
  strokeColor = "#E0FB66",
  trackColor = "rgba(8, 8, 8, 0.12)",
  strokeWidth = 3,
  showTrack = true,
  glow = true,
  glowColor = "#E0FB66",
  headMarker = true,
  headMarkerColor = "#E0FB66",
  headMarkerRadius = 5,
  startOffset = "top 75%",
  endOffset = "bottom 35%",
  scrub = 0.4,
  onProgress,
  style,
}: ScrollBeamProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const headMarkerRef = useRef<SVGCircleElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Determine path definition
  const isCustom = orientation === "custom" || Boolean(path);
  const isHorizontal = orientation === "horizontal" && !isCustom;
  const isVertical = orientation === "vertical" && !isCustom;

  // Default coordinate paths:
  // For horizontal: drawn across 1000 coordinate units
  // For vertical: drawn down 1000 coordinate units
  const defaultPathD = isHorizontal
    ? "M 0 10 L 1000 10"
    : isVertical
    ? "M 10 0 L 10 1000"
    : path || "M 0 10 L 1000 10";

  const viewBox = isHorizontal
    ? "0 0 1000 20"
    : isVertical
    ? "0 0 20 1000"
    : "0 0 1000 100";

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined" || !pathRef.current) return;
    registerScrollTrigger();

    const pathElement = pathRef.current;
    const triggerElement = containerRef?.current || wrapperRef.current;
    if (!triggerElement) return;

    let totalLength = 1000;
    try {
      totalLength = pathElement.getTotalLength() || 1000;
    } catch {
      totalLength = 1000;
    }

    // Set dash array to match the full length of path
    pathElement.style.strokeDasharray = `${totalLength} ${totalLength}`;

    if (reducedMotion) {
      // Reduced motion: line is fully drawn statically
      pathElement.style.strokeDashoffset = "0";
      if (headMarkerRef.current) {
        headMarkerRef.current.style.opacity = "0";
      }
      return;
    }

    // Initial state: fully hidden
    pathElement.style.strokeDashoffset = `${totalLength}`;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        pathElement,
        {
          strokeDashoffset: totalLength,
        },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: triggerElement,
            start: startOffset,
            end: endOffset,
            scrub: typeof scrub === "number" ? scrub : 0.4,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const progress = self.progress;
              if (onProgress) {
                onProgress(progress);
              }

              // Update head marker position along SVG path
              if (headMarkerRef.current && pathElement) {
                try {
                  const currentDist = progress * totalLength;
                  const point = pathElement.getPointAtLength(
                    Math.min(Math.max(currentDist, 0), totalLength)
                  );
                  headMarkerRef.current.setAttribute("cx", `${point.x}`);
                  headMarkerRef.current.setAttribute("cy", `${point.y}`);
                  // Fade out marker when at absolute boundaries
                  headMarkerRef.current.style.opacity =
                    progress > 0.005 && progress < 0.995 ? "1" : "0.5";
                } catch {
                  // Fallback safely if SVG math fails
                }
              }
            },
          },
        }
      );
    }, wrapperRef.current || undefined);

    return () => {
      ctx.revert();
    };
  }, [
    containerRef,
    reducedMotion,
    startOffset,
    endOffset,
    scrub,
    onProgress,
    defaultPathD,
  ]);

  return (
    <div
      ref={wrapperRef}
      className={`pointer-events-none select-none ${className}`}
      style={style}
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio={isCustom ? "none" : "none"}
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {glow && (
            <filter id="scroll-beam-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor={glowColor}
                floodOpacity="0.85"
              />
            </filter>
          )}
        </defs>

        {/* Faint Guide Track */}
        {showTrack && (
          <path
            d={defaultPathD}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray="4 4"
            fill="none"
          />
        )}

        {/* Active Animated Beam */}
        <path
          ref={pathRef}
          d={defaultPathD}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter={glow ? "url(#scroll-beam-glow)" : undefined}
          fill="none"
          className="transition-[stroke] duration-150"
        />

        {/* Glowing Head Marker / Dot */}
        {headMarker && (
          <circle
            ref={headMarkerRef}
            r={headMarkerRadius}
            fill={headMarkerColor}
            stroke="#080808"
            strokeWidth="1.5"
            style={{
              opacity: 0,
              filter: `drop-shadow(0 0 6px ${glowColor})`,
              transition: "opacity 0.2s ease",
            }}
          />
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Clean exports of all helpers, types, and GSAP instances
// ---------------------------------------------------------------------------

export { gsap, ScrollTrigger };
export default ScrollReveal;
