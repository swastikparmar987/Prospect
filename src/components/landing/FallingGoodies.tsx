"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export interface FallingGoodiesProps {
  /** Optional custom position for the floating trigger button */
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
  leftPercent: number; // 5% to 88%
  spawnDelayMs: number;
  durationSec: number;
  rotStartDeg: number;
  rotEndDeg: number;
  swayX1: number;
  swayX2: number;
  swayX3: number;
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
      ctx.close().catch(() => {});
    }, 150);
  } catch {
    // Audio context may be restricted before user gesture; gracefully ignore
  }
}

// ============================================================================
// MAIN EXPORT 1: FallingGoodies
// ============================================================================

export function FallingGoodies({
  buttonPosition = "bottom-left",
  autoDrift = true,
  includeCompanion = false,
  onPop,
  className = "",
}: FallingGoodiesProps) {
  const [activeGoodies, setActiveGoodies] = useState<ActiveFallingGoodie[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [poppedCount, setPoppedCount] = useState<number>(0);
  const [isRolling, setIsRolling] = useState<boolean>(false);
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
  // Spawn Goodies Logic (Strictly 6-8 seconds auto-cleanup)
  // --------------------------------------------------------------------------
  const spawnGoodiesBatch = useCallback((isFullCelebration = true) => {
    const now = Date.now();
    const templates = isFullCelebration
      ? [...REQUIRED_GOODIES, BONUS_GOODIES[Math.floor(Math.random() * BONUS_GOODIES.length)]]
      : [REQUIRED_GOODIES[Math.floor(Math.random() * REQUIRED_GOODIES.length)]];

    const newGoodies: ActiveFallingGoodie[] = templates.map((tmpl, idx) => {
      // Stagger spawn delay and spread horizontally
      const stagger = idx * 130;
      const basePercent = isFullCelebration
        ? 6 + ((idx * 86) / templates.length) + (Math.random() * 6 - 3)
        : 10 + Math.random() * 80;

      return {
        id: `goodie-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        template: tmpl,
        leftPercent: Math.max(4, Math.min(88, basePercent)),
        spawnDelayMs: stagger,
        durationSec: 5.2 + Math.random() * 1.8, // 5.2s - 7.0s tumble
        rotStartDeg: -22 + Math.random() * 44,
        rotEndDeg: -18 + Math.random() * 36,
        swayX1: -18 + Math.random() * 36,
        swayX2: -24 + Math.random() * 48,
        swayX3: -16 + Math.random() * 32,
        createdAt: now,
      };
    });

    setActiveGoodies((prev) => [...prev, ...newGoodies]);

    // Guaranteed Auto-cleanup after 7.2s (strictly within 6-8 second brief requirement)
    setTimeout(() => {
      const cutoff = Date.now() - 7200;
      setActiveGoodies((prev) => prev.filter((g) => g.createdAt > cutoff));
    }, 7400);
  }, []);

  // Background gentle drifting goodie every 18 seconds if autoDrift is active
  useEffect(() => {
    if (!autoDrift) return;
    const interval = setInterval(() => {
      // Only spawn a background single item if not crowded
      setActiveGoodies((prev) => {
        if (prev.length < 3) {
          spawnGoodiesBatch(false);
        }
        return prev;
      });
    }, 18000);
    return () => clearInterval(interval);
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
    setPoppedCount((c) => c + 1);

    // Audio tone
    playPopTone();

    // Confetti explosion
    spawnConfetti(clientX, clientY, 32);

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

  // Trigger button roll action
  const handleTriggerClick = () => {
    setIsRolling(true);
    playPopTone();
    spawnGoodiesBatch(true);
    setTimeout(() => setIsRolling(false), 600);
  };

  // Button position class
  const getButtonPositionClasses = () => {
    switch (buttonPosition) {
      case "bottom-right":
        return "fixed bottom-6 right-6 z-40";
      case "top-right":
        return "fixed top-20 right-6 z-40";
      case "none":
        return "hidden";
      case "bottom-left":
      default:
        return "fixed bottom-6 left-6 z-40";
    }
  };

  return (
    <>
      {/* Self-contained CSS for smooth GPU keyframe physics */}
      <style>{`
        @keyframes tumbleDownKeyframe {
          0% {
            transform: translateY(-80px) rotate(var(--rot-start, -15deg)) scale(0.9);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(12vh) translateX(var(--sway-1, 10px)) rotate(var(--rot-mid1, 8deg)) scale(1);
          }
          35% {
            transform: translateY(38vh) translateX(var(--sway-2, -18px)) rotate(var(--rot-mid2, -10deg)) scale(1.02);
          }
          65% {
            transform: translateY(68vh) translateX(var(--sway-3, 14px)) rotate(var(--rot-mid1, 12deg)) scale(1);
          }
          85% {
            transform: translateY(88vh) translateX(var(--sway-2, -10px)) rotate(var(--rot-end, -6deg)) scale(0.98);
            opacity: 1;
          }
          96% {
            transform: translateY(96vh) translateX(var(--sway-1, 4px)) rotate(var(--rot-end, -6deg)) scale(1.02);
            opacity: 0.85;
          }
          100% {
            transform: translateY(105vh) translateX(0px) rotate(var(--rot-end, -6deg)) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes floatingRewardPop {
          0% {
            opacity: 0;
            transform: translate(-50%, 0) scale(0.7);
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -24px) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -55px) scale(0.9);
          }
        }

        @keyframes diceShake {
          0%, 100% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-18deg) scale(1.1); }
          40% { transform: rotate(18deg) scale(1.1); }
          60% { transform: rotate(-12deg) scale(1.05); }
          80% { transform: rotate(8deg) scale(1.02); }
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

      {/* Falling Badges Container (badges themselves are interactive pointer-events-auto) */}
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
                animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                animationFillMode: "forwards",
                animationName: "tumbleDownKeyframe",
                "--rot-start": `${goodie.rotStartDeg}deg`,
                "--rot-mid1": `${goodie.rotStartDeg * -0.6}deg`,
                "--rot-mid2": `${goodie.rotEndDeg * 0.8}deg`,
                "--rot-end": `${goodie.rotEndDeg}deg`,
                "--sway-1": `${goodie.swayX1}px`,
                "--sway-2": `${goodie.swayX2}px`,
                "--sway-3": `${goodie.swayX3}px`,
              } as React.CSSProperties
            }
            className="absolute pointer-events-auto cursor-pointer select-none goodie-falling-badge group transition-transform duration-150 hover:scale-110 active:scale-95"
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
            title="Click or hover to pop!"
          >
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 ${goodie.template.border} ${goodie.template.bg} ${goodie.template.shadow} ${goodie.template.textColor} font-technical font-bold text-xs sm:text-sm tracking-tight`}
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

      {/* Neo-Brutalist Floating Interactive Trigger Button */}
      {buttonPosition !== "none" && (
        <div className={`${getButtonPositionClasses()} ${className}`}>
          <button
            type="button"
            onClick={handleTriggerClick}
            aria-label="Drop Career Goodies"
            className={`group relative flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-[#E0FB66] text-[#080808] border-2 border-black shadow-[4px_4px_0px_#080808] font-technical font-bold text-xs sm:text-sm tracking-tight transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#080808] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#080808] focus:outline-none focus:ring-2 focus:ring-black ${
              isRolling ? "animate-[diceShake_0.6s_ease-in-out]" : ""
            }`}
          >
            <span className="text-base sm:text-lg leading-none transition-transform group-hover:rotate-12">
              🎲
            </span>
            <span className="font-technical font-bold">Drop Career Goodies</span>

            {/* Sparkle badge or popped count pill */}
            <span className="flex items-center justify-center bg-black text-[#E0FB66] text-[10px] font-mono px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#080808] min-w-[20px]">
              {poppedCount > 0 ? `+${poppedCount}` : "✦"}
            </span>

            {/* Subtle pulse ring indicator */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-black" />
          </button>
        </div>
      )}

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

  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);
  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);
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
        // Max travel distance inside the eye socket (5px)
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

  // Click Companion: Wiggle + Cycle Playful Speech Bubble
  const handleClick = () => {
    setIsWiggling(true);
    playPopTone();

    // Advance quote
    setQuoteIndex((prev) => (prev + 1) % quotes.length);
    setShowBubble(true);

    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
    }
    // Auto-dismiss speech bubble after 3.8s
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
    }, 3800);

    setTimeout(() => setIsWiggling(false), 450);

    if (onClick) onClick();
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "fixed bottom-6 left-6 z-40";
      case "custom":
        return "";
      case "bottom-right":
      default:
        return "fixed bottom-6 right-6 z-40";
    }
  };

  return (
    <>
      <style>{`
        @keyframes companionSpeechBounce {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.85);
          }
          60% {
            opacity: 1;
            transform: translateY(-2px) scale(1.04);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes mascotWiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-9deg) scale(1.08); }
          50% { transform: rotate(9deg) scale(1.08); }
          75% { transform: rotate(-4deg) scale(1.03); }
        }
      `}</style>

      <div className={`${getPositionClasses()} ${className} select-none`}>
        <div className="relative flex flex-col items-end sm:items-center">
          {/* Neo-Brutalist Comic Speech Bubble */}
          {showBubble && (
            <div
              style={{
                animation: "companionSpeechBounce 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
              }}
              className="absolute bottom-[calc(100%+14px)] right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-50 pointer-events-none"
            >
              <div className="relative bg-white text-[#080808] border-2 border-black shadow-[4px_4px_0px_#080808] rounded-xl px-3.5 py-2 font-technical font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-1.5">
                <span className="text-[#080808]">{quotes[quoteIndex]}</span>
                {/* Pointer triangle tail */}
                <div className="absolute -bottom-2.5 right-6 sm:left-1/2 sm:-translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black" />
                <div className="absolute -bottom-2 right-[25px] sm:left-1/2 sm:-translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-white" />
              </div>
            </div>
          )}

          {/* Goofy Mascot Sticker Badge */}
          <button
            type="button"
            onClick={handleClick}
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
                  {/* Shiny catchlight reflection */}
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
                  {/* Shiny catchlight reflection */}
                  <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5" />
                </div>
              </div>
            </div>

            {/* Cute Cheeky Mouth & Blush */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 -mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF8080]" />
                {/* Cheerful curved SVG smile */}
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
