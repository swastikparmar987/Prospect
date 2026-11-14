"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export interface FallingGoodiesProps {
  /** Optional custom position (trigger button removed per design requirements) */
  buttonPosition?: "bottom-left" | "bottom-right" | "top-right" | "none";
  /** Whether to periodically spawn a gentle drifting goodie in background (default true) */
  autoDrift?: boolean;
  /** Whether to also render the GoofyEyeCompanion sticker (default false, exported separately) */
  includeCompanion?: boolean;
  /** Optional callback when a goodie is popped */
  onPop?: (text: string) => void;
  /** Optional extra classes */
  className?: string;
}

export interface GoofyEyeCompanionProps {
  /** Optional fixed corner position (default bottom-right) */
  position?: "bottom-right" | "bottom-left" | "custom";
  /** Optional custom speech bubble messages */
  customQuotes?: string[];
  /** Optional extra classes */
  className?: string;
  /** Optional click callback */
  onClick?: () => void;
}

/** Neo-Brutalist badge definitions strictly matching project requirements */
interface GoodieTemplate {
  text: string;
  bg: string;
  border: string;
  textColor: string;
  shadow: string;
  reward: string;
}

const REQUIRED_GOODIES: GoodieTemplate[] = [
  {
    text: "✦ 100% Match",
    bg: "bg-[#E0FB66]", // Electric lime
    border: "border-black",
    textColor: "text-[#080808]",
    shadow: "shadow-[4px_4px_0px_#080808]",
    reward: "+100% Fit! 🎯",
  },
  {
    text: "💼 Offer Letter",
    bg: "bg-[#FEF189]", // Warm canary yellow
    border: "border-black",
    textColor: "text-[#080808]",
    shadow: "shadow-[4px_4px_0px_#080808]",
    reward: "Offer Signed! 💼",
  },
  {
    text: "🚀 $180k Base",
    bg: "bg-[#EAE2FA]", // Soft lavender
    border: "border-black",
    textColor: "text-[#080808]",
    shadow: "shadow-[4px_4px_0px_#080808]",
    reward: "Secured $180k! 🚀",
  },
  {
    text: "☕ Free Coffee",
    bg: "bg-[#FFFFFF]", // Clean ivory
    border: "border-black",
    textColor: "text-[#080808]",
    shadow: "shadow-[4px_4px_0px_#080808]",
    reward: "Cold Brew On Tap! ☕",
  },
  {
    text: "🛡️ Seniority Shield Active",
    bg: "bg-[#BAE6FD]", // Sky cyan
    border: "border-black",
    textColor: "text-[#080808]",
    shadow: "shadow-[4px_4px_0px_#080808]",
    reward: "Zero Junior Bias! 🛡️",
  },
  {
    text: "🥑 Tech Lead Approved",
    bg: "bg-[#A3F7BF]", // Pastel mint
    border: "border-black",
    textColor: "text-[#080808]",
    shadow: "shadow-[4px_4px_0px_#080808]",
    reward: "LGTM Approved! 🥑",
  },
  {
    text: "(◕‿◕) Hired!",
    bg: "bg-[#FED7AA]", // Pastel peach
    border: "border-black",
    textColor: "text-[#080808]",
    shadow: "shadow-[4px_4px_0px_#080808]",
    reward: "Welcome Aboard! 🎉",
  },
];

/** Bonus Easter Egg goodies for repeated rolls */
const BONUS_GOODIES: GoodieTemplate[] = [
  {
    text: "✨ Zero Ghost Jobs",
    bg: "bg-[#E0FB66]",
    border: "border-black",
    textColor: "text-[#080808]",
    shadow: "shadow-[4px_4px_0px_#080808]",
    reward: "100% Real Leads! ✨",
  },
  {
    text: "🌴 Unlimited PTO",
    bg: "bg-[#FEF189]",
    border: "border-black",
    textColor: "text-[#080808]",
    shadow: "shadow-[4px_4px_0px_#080808]",
    reward: "OOTO Mode On! 🌴",
  },
  {
    text: "📈 Equity Granted",
    bg: "bg-[#EAE2FA]",
    border: "border-black",
    textColor: "text-[#080808]",
    shadow: "shadow-[4px_4px_0px_#080808]",
    reward: "Moonshot Shares! 📈",
  },
];

interface ActiveFallingGoodie {
  id: string;
  template: GoodieTemplate;
  leftPercent: number; // 6% to 86%
  spawnDelayMs: number;
  durationSec: number;
  rotStartDeg: number;
  rotEndDeg: number;
  driftX: number;
  createdAt: number;
}

interface FloatingReaction {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  shape: "square" | "circle" | "star";
  life: number;
  maxLife: number;
}

// Subtle cheerful web audio blip on pop/click
function playPopTone() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    setTimeout(() => {
      try {
        ctx.close().catch(() => {});
      } catch {
        // gracefully ignore
      }
    }, 150);
  } catch {
    // Audio context may be restricted before user gesture; gracefully ignore
  }
}

// ============================================================================
// MAIN EXPORT 1: FallingGoodies
// ============================================================================

export function FallingGoodies({
  autoDrift = true,
  includeCompanion = false,
  onPop,
}: FallingGoodiesProps) {
  const [activeGoodies, setActiveGoodies] = useState<ActiveFallingGoodie[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiParticlesRef = useRef<ConfettiParticle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  // --------------------------------------------------------------------------
  // Confetti Canvas Particle Engine (High-Performance 60FPS RAF)
  // --------------------------------------------------------------------------
  const startConfettiLoop = useCallback(() => {
    if (animationFrameIdRef.current !== null) return;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameIdRef.current = null;
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameIdRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = confettiParticlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.32; // Gravity
        p.vx *= 0.96; // Air drag
        p.vy *= 0.96;
        p.rotation += p.rotSpeed;
        p.life -= 1;
        p.alpha = Math.max(0, p.life / p.maxLife);

        if (p.life <= 0 || p.y > canvas.height + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;

        if (p.shape === "square") {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.75);
          ctx.strokeStyle = "#080808";
          ctx.lineWidth = 1;
          ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.75);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.strokeStyle = "#080808";
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // 4-pointed neon sparkle star ✦
          const r = p.size;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.quadraticCurveTo(0, 0, r, 0);
          ctx.quadraticCurveTo(0, 0, 0, r);
          ctx.quadraticCurveTo(0, 0, -r, 0);
          ctx.quadraticCurveTo(0, 0, 0, -r);
          ctx.closePath();
          ctx.fillStyle = p.color;
          ctx.fill();
        }

        ctx.restore();
      }

      if (particles.length > 0) {
        animationFrameIdRef.current = requestAnimationFrame(render);
      } else {
        animationFrameIdRef.current = null;
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(render);
  }, []);

  const spawnConfetti = useCallback(
    (originX: number, originY: number, count = 28) => {
      const colors = [
        "#E0FB66", // Neon Lime
        "#FEF189", // Lemon Yellow
        "#EAE2FA", // Lavender
        "#BAE6FD", // Sky Blue
        "#A3F7BF", // Mint
        "#FF80BF", // Hot Pink
        "#080808", // Neo-Brutalist Ink
      ];
      const shapes: ("square" | "circle" | "star")[] = ["square", "star", "circle"];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 4 + Math.random() * 9.5;
        confettiParticlesRef.current.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 2.5, // slight upward pop bias
          size: 6 + Math.random() * 7,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.28,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          life: 45 + Math.floor(Math.random() * 25),
          maxLife: 70,
        });
      }

      startConfettiLoop();
    },
    [startConfettiLoop]
  );

  // Resize canvas to cover window with DPR
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = window.innerWidth * dpr;
      canvasRef.current.height = window.innerHeight * dpr;
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.resetTransform?.();
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --------------------------------------------------------------------------
  // Gentle, Smooth Falling Physics (Soft Drift, Graceful Float, Zero Tumbling)
  // --------------------------------------------------------------------------
  const spawnGoodiesBatch = useCallback((isFullCelebration = false) => {
    const now = Date.now();
    const templates = isFullCelebration
      ? [...REQUIRED_GOODIES, BONUS_GOODIES[Math.floor(Math.random() * BONUS_GOODIES.length)]]
      : [REQUIRED_GOODIES[Math.floor(Math.random() * REQUIRED_GOODIES.length)]];

    const newGoodies: ActiveFallingGoodie[] = templates.map((tmpl, idx) => {
      const stagger = idx * 220;
      const basePercent = isFullCelebration
        ? 8 + ((idx * 80) / templates.length) + (Math.random() * 4 - 2)
        : 12 + Math.random() * 74;

      return {
        id: `goodie-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        template: tmpl,
        leftPercent: Math.max(6, Math.min(86, basePercent)),
        spawnDelayMs: stagger,
        durationSec: 10 + Math.random() * 3.5, // 10s - 13.5s smooth, gentle, serene float
        rotStartDeg: -2 + Math.random() * 4, // subtle -2deg to +2deg
        rotEndDeg: -2 + Math.random() * 4,
        driftX: -8 + Math.random() * 16, // soft -8px to +8px drift over entire travel
        createdAt: now,
      };
    });

    setActiveGoodies((prev) => [...prev, ...newGoodies]);

    // Safe cleanup after item has gracefully completed floating offscreen
    setTimeout(() => {
      const cutoff = Date.now() - 14500;
      setActiveGoodies((prev) => prev.filter((g) => g.createdAt > cutoff));
    }, 15000);
  }, []);

  // Background gentle drifting goodie every 18 seconds if autoDrift is active
  useEffect(() => {
    if (!autoDrift) return;

    // Gentle initial ambient drift after page loads
    const initialTimeout = setTimeout(() => {
      spawnGoodiesBatch(false);
    }, 3500);

    const interval = setInterval(() => {
      setActiveGoodies((prev) => {
        // Keep background ambient and non-distracting: at most 2 items at once
        if (prev.length < 2) {
          spawnGoodiesBatch(false);
        }
        return prev;
      });
    }, 18000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [autoDrift, spawnGoodiesBatch]);

  // Click or Hover to POP with confetti!
  const handlePopGoodie = (
    goodieId: string,
    clientX: number,
    clientY: number,
    rewardText: string,
    goodieText: string
  ) => {
    // Remove from active goodies immediately
    setActiveGoodies((prev) => prev.filter((g) => g.id !== goodieId));

    // Audio tone
    playPopTone();

    // Confetti explosion
    spawnConfetti(clientX, clientY, 28);

    // Floating reward pill
    const rxId = `rx-${Date.now()}-${Math.random()}`;
    setReactions((prev) => [
      ...prev,
      {
        id: rxId,
        text: rewardText,
        x: clientX,
        y: clientY,
        color: "#E0FB66",
      },
    ]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== rxId));
    }, 900);

    if (onPop) onPop(goodieText);
  };

  return (
    <>
      {/* Self-contained CSS for smooth, soft, gentle gravity float */}
      <style>{`
        @keyframes softFloatDown {
          0% {
            transform: translateY(-70px) translateX(0px) rotate(var(--rot-start, 0deg));
            opacity: 0;
          }
          8% {
            opacity: 1;
            transform: translateY(10vh) translateX(calc(var(--drift-x, 0px) * 0.15)) rotate(var(--rot-start, 0deg));
          }
          85% {
            opacity: 1;
            transform: translateY(90vh) translateX(calc(var(--drift-x, 0px) * 0.85)) rotate(var(--rot-end, 0deg));
          }
          100% {
            transform: translateY(106vh) translateX(var(--drift-x, 0px)) rotate(var(--rot-end, 0deg));
            opacity: 0;
          }
        }

        @keyframes floatingRewardPop {
          0% {
            opacity: 0;
            transform: translate(-50%, 0) scale(0.8);
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -20px) scale(1.05);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50px) scale(0.95);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .goodie-falling-badge {
            animation: none !important;
            display: none !important;
          }
        }
      `}</style>

      {/* Confetti Fullscreen Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[60]"
        style={{ width: "100vw", height: "100vh" }}
      />

      {/* Falling Badges Container - Smooth, gentle floating physics */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {activeGoodies.map((goodie) => (
          <div
            key={goodie.id}
            style={
              {
                left: `${goodie.leftPercent}%`,
                top: 0,
                animationDelay: `${goodie.spawnDelayMs}ms`,
                animationDuration: `${goodie.durationSec}s`,
                animationTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)",
                animationFillMode: "forwards",
                animationName: "softFloatDown",
                "--rot-start": `${goodie.rotStartDeg}deg`,
                "--rot-end": `${goodie.rotEndDeg}deg`,
                "--drift-x": `${goodie.driftX}px`,
              } as React.CSSProperties
            }
            className="absolute pointer-events-auto cursor-pointer select-none goodie-falling-badge group transition-transform duration-200 hover:scale-105 active:scale-95"
            onClick={(e) =>
              handlePopGoodie(
                goodie.id,
                e.clientX,
                e.clientY,
                goodie.template.reward,
                goodie.template.text
              )
            }
            onMouseEnter={(e) =>
              handlePopGoodie(
                goodie.id,
                e.clientX,
                e.clientY,
                goodie.template.reward,
                goodie.template.text
              )
            }
            title="Catch the goodie!"
          >
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 ${goodie.template.border} ${goodie.template.bg} ${goodie.template.shadow} ${goodie.template.textColor} font-technical font-bold text-xs sm:text-sm tracking-tight transition-shadow hover:shadow-[5px_5px_0px_#080808]`}
            >
              <span>{goodie.template.text}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-black text-[#E0FB66] px-1 rounded ml-1 font-mono">
                POP!
              </span>
            </div>
          </div>
        ))}

        {/* Floating Reward Reaction Pills on Pop */}
        {reactions.map((rx) => (
          <div
            key={rx.id}
            style={{
              left: `${rx.x}px`,
              top: `${rx.y}px`,
              animation: "floatingRewardPop 0.85s ease-out forwards",
            }}
            className="absolute pointer-events-none z-[65] font-technical font-bold text-xs sm:text-sm bg-black text-[#E0FB66] px-3 py-1 rounded-lg border-2 border-[#E0FB66] shadow-[3px_3px_0px_#080808] whitespace-nowrap"
          >
            {rx.text}
          </div>
        ))}
      </div>

      {/* Note: The floating "Drop Career Goodies" button has been completely removed per requirements */}

      {/* Companion rendered if explicitly requested in FallingGoodies */}
      {includeCompanion && <GoofyEyeCompanion />}
    </>
  );
}

// ============================================================================
// MAIN EXPORT 2: GoofyEyeCompanion
// ============================================================================

const DEFAULT_GOOFY_QUOTES = [
  "Resume: 10/10 vibes",
  "Zero ghost jobs detected",
  "Looking sharp!",
  "Tech lead approved 🥑",
  "Seniority shield active 🛡️",
  "Salary: $180k Base unlocked 🚀",
  "(◕‿◕) Hired!",
];

export function GoofyEyeCompanion({
  position = "bottom-right",
  customQuotes,
  className = "",
  onClick,
}: GoofyEyeCompanionProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [horizontalShift, setHorizontalShift] = useState(0);

  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);
  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const quotes = customQuotes && customQuotes.length > 0 ? customQuotes : DEFAULT_GOOFY_QUOTES;

  // Real-time Googly Eye Cursor Tracking (Math.atan2 + clamped vector offset)
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const updateEyePupil = (
        eyeEl: HTMLDivElement | null,
        pupilEl: HTMLDivElement | null
      ) => {
        if (!eyeEl || !pupilEl) return;
        const rect = eyeEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const angle = Math.atan2(dy, dx);
        // Max travel distance inside the eye socket (4.5px)
        const dist = Math.min(Math.hypot(dx, dy) / 14, 4.5);
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;

        pupilEl.style.transform = `translate(${px}px, ${py}px)`;
      };

      updateEyePupil(leftEyeRef.current, leftPupilRef.current);
      updateEyePupil(rightEyeRef.current, rightPupilRef.current);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  // Periodic Cute Cartoon Blink (every 4.5 - 7 seconds)
  useEffect(() => {
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    };

    const interval = setInterval(triggerBlink, 5000 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, []);

  // Guaranteed Screen Bounds Clamping for Comic Speech Bubble
  useEffect(() => {
    if (!showBubble) {
      setHorizontalShift(0);
      return;
    }

    const adjustBounds = () => {
      if (!bubbleRef.current || !buttonRef.current) return;
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const bubbleRect = bubbleRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const safePadding = 20;

      // The unshifted center of the speech bubble is aligned to the center of the PAL button
      const buttonCenter = buttonRect.left + buttonRect.width / 2;
      const bubbleHalfWidth = bubbleRect.width / 2;

      // Expected unshifted left and right in viewport coordinates
      const unshiftedRight = buttonCenter + bubbleHalfWidth;
      const unshiftedLeft = buttonCenter - bubbleHalfWidth;

      let shift = 0;
      if (unshiftedRight > viewportWidth - safePadding) {
        shift = (viewportWidth - safePadding) - unshiftedRight;
      } else if (unshiftedLeft < safePadding) {
        shift = safePadding - unshiftedLeft;
      }

      setHorizontalShift(shift);
    };

    const frameId = requestAnimationFrame(adjustBounds);
    window.addEventListener("resize", adjustBounds);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", adjustBounds);
    };
  }, [showBubble, quoteIndex]);

  // Click Companion: Wiggle + Cycle Playful Speech Bubble
  const handleClick = () => {
    setIsWiggling(true);
    setQuoteIndex((prev) => (prev + 1) % quotes.length);
    setShowBubble(true);

    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
    }
    // Auto-dismiss speech bubble after 4.5s
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
    }, 4500);

    setTimeout(() => setIsWiggling(false), 450);

    try {
      playPopTone();
    } catch {
      // AudioContext may be restricted; ignore
    }

    if (onClick) onClick();
  };

  const handleMouseEnter = () => {
    if (!showBubble) {
      setShowBubble(true);
      if (bubbleTimeoutRef.current) {
        clearTimeout(bubbleTimeoutRef.current);
      }
      bubbleTimeoutRef.current = setTimeout(() => {
        setShowBubble(false);
      }, 4500);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "fixed bottom-6 left-6 sm:bottom-8 sm:left-10 z-[80]";
      case "custom":
        return "";
      case "bottom-right":
      default:
        return "fixed bottom-6 right-6 sm:bottom-8 sm:right-10 md:right-12 z-[80]";
    }
  };

  return (
    <>
      <style>{`
        @keyframes companionSpeechBounce {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.9);
          }
          60% {
            opacity: 1;
            transform: translateY(-2px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes mascotWiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-8deg) scale(1.06); }
          50% { transform: rotate(8deg) scale(1.06); }
          75% { transform: rotate(-4deg) scale(1.02); }
        }
      `}</style>

      <div className={`${getPositionClasses()} ${className} select-none`}>
        <div className="relative flex flex-col items-center">
          {/* Neo-Brutalist Comic Speech Bubble - Directly centered above PAL mascot button with high z-index and guaranteed screen bounds */}
          {showBubble && (
            <div
              ref={bubbleRef}
              style={{
                transform: `translateX(calc(-50% + ${horizontalShift}px))`,
              }}
              className="absolute bottom-[calc(100%+14px)] left-1/2 z-[90] pointer-events-none transition-transform duration-100 ease-out"
            >
              <div
                style={{
                  animation: "companionSpeechBounce 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                }}
                className="relative bg-white text-[#080808] border-2 border-black shadow-[4px_4px_0px_#080808] rounded-xl px-4 py-2 font-technical font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-1.5 select-none"
              >
                <span className="text-[#080808] font-bold">{quotes[quoteIndex]}</span>
                {/* Pointer triangle tail anchored dynamically so it always points directly down at the PAL mascot button center */}
                <div
                  style={{
                    left: `clamp(18px, calc(50% - ${horizontalShift}px), calc(100% - 18px))`,
                  }}
                  className="absolute -bottom-2.5 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"
                />
                <div
                  style={{
                    left: `clamp(18px, calc(50% - ${horizontalShift}px), calc(100% - 18px))`,
                  }}
                  className="absolute -bottom-2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-white"
                />
              </div>
            </div>
          )}

          {/* Goofy Mascot Sticker Badge */}
          <button
            ref={buttonRef}
            type="button"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            aria-label="Click goofy career companion"
            title="Click for vibes!"
            className={`group relative flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#E0FB66] border-2 border-black shadow-[4px_4px_0px_#080808] cursor-pointer transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#080808] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#080808] focus:outline-none focus:ring-2 focus:ring-black ${
              isWiggling ? "animate-[mascotWiggle_0.45s_ease-in-out]" : ""
            }`}
          >
            {/* Googly Eyes Container */}
            <div className="flex items-center gap-1">
              {/* Left Eye */}
              <div
                ref={leftEyeRef}
                className={`w-6 h-6 rounded-full bg-white border-2 border-black flex items-center justify-center relative overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] transition-transform duration-100 ${
                  isBlinking ? "scale-y-[0.1]" : "scale-y-100"
                }`}
              >
                <div
                  ref={leftPupilRef}
                  className="w-3 h-3 rounded-full bg-black relative flex items-center justify-center transition-transform duration-75 ease-out"
                >
                  <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5" />
                </div>
              </div>

              {/* Right Eye */}
              <div
                ref={rightEyeRef}
                className={`w-6 h-6 rounded-full bg-white border-2 border-black flex items-center justify-center relative overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] transition-transform duration-100 ${
                  isBlinking ? "scale-y-[0.1]" : "scale-y-100"
                }`}
              >
                <div
                  ref={rightPupilRef}
                  className="w-3 h-3 rounded-full bg-black relative flex items-center justify-center transition-transform duration-75 ease-out"
                >
                  <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5" />
                </div>
              </div>
            </div>

            {/* Cute Cheeky Mouth & Blush */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 -mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF8080]" />
                <svg
                  className="w-3.5 h-2 text-black fill-none stroke-current stroke-[2.2] stroke-linecap-round"
                  viewBox="0 0 16 8"
                >
                  <path d="M 2 2 Q 8 8 14 2" />
                </svg>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF8080]" />
              </div>
              <span className="font-technical font-bold text-[9px] tracking-wider uppercase bg-black text-[#E0FB66] px-1 py-0.2 rounded mt-0.5">
                PAL
              </span>
            </div>

            {/* Cute star accessory badge */}
            <span className="text-xs group-hover:rotate-45 transition-transform duration-200">
              ✦
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

export default FallingGoodies;
