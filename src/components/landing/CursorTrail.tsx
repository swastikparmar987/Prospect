"use client";

import React, { useEffect, useRef } from "react";

export interface CursorTrailProps {
  /** Optional override to force enable/disable */
  enabled?: boolean;
  /** Primary glow color (defaults to electric lime #E0FB66) */
  primaryColor?: string;
  /** Secondary glow color (defaults to soft lavender #C084FC) */
  secondaryColor?: string;
  /** Sparkle burst particle count per click (default ~10-12) */
  sparkleCount?: number;
  /** Extra CSS class names */
  className?: string;
}

interface TrailNode {
  x: number;
  y: number;
}

interface SparkleParticle {
  type: "star" | "bubble" | "dust";
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  glowColor: string;
  glowBlur: number;
  gravity: number;
  friction: number;
  life: number; // 1 -> 0
}

const LIME = "#E0FB66";
const LAVENDER_LIGHT = "#E9D5FF";
const LAVENDER_MID = "#C084FC";
const LAVENDER_SOFT = "#DDD6FE";
const WHITE = "#FFFFFF";

const COLOR_PALETTE = [LIME, LIME, LAVENDER_MID, LAVENDER_LIGHT, LAVENDER_SOFT, WHITE];

/**
 * Draws a crisp 4-pointed sparkle star (✦) with customizable inner/outer radii.
 */
function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number
) {
  const spikes = 4;
  let rot = (Math.PI / 2) * 3 + rotation;
  const step = Math.PI / spikes;

  ctx.beginPath();
  let x = cx + Math.cos(rot) * outerRadius;
  let y = cy + Math.sin(rot) * outerRadius;
  ctx.moveTo(x, y);

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.closePath();
}

/**
 * Draws a soft glassy bubble with delicate specular rim & highlight.
 */
function drawSoftBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, Math.max(1, radius), 0, Math.PI * 2);

  // Translucent body fill
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.28;
  ctx.fill();

  // Subtle bright rim
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha * 0.85;
  ctx.stroke();

  // Glass specular highlight reflection in upper-left corner
  if (radius > 3) {
    ctx.beginPath();
    ctx.arc(x - radius * 0.35, y - radius * 0.35, Math.max(0.6, radius * 0.25), 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.globalAlpha = alpha * 0.9;
    ctx.fill();
  }
  ctx.restore();
}

export function CursorTrail({
  enabled = true,
  primaryColor = LIME,
  secondaryColor = LAVENDER_MID,
  sparkleCount = 11,
  className = "",
}: CursorTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Guard against SSR, disabled prop, touch devices, and prefers-reduced-motion
    if (!enabled || typeof window === "undefined") return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const hasTouch = "ontouchstart" in window && !window.matchMedia("(pointer: fine)").matches;

    if (reducedMotionQuery.matches || coarsePointerQuery.matches || hasTouch) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // 2. High-DPI Canvas Resizing
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });

    // 3. State: Mouse tracking, physics trail nodes, particles
    const mouse = { x: -100, y: -100, prevX: -100, prevY: -100, isOver: false };
    let lastMoveTime = performance.now();
    let isLoopRunning = false;
    let rafId: number | null = null;

    // Smooth ribbon trail nodes
    const TRAIL_LENGTH = 14;
    const trailNodes: TrailNode[] = Array.from({ length: TRAIL_LENGTH }, () => ({
      x: -100,
      y: -100,
    }));

    // Dynamic active particles pool (sparkles, bubbles, dust)
    const particles: SparkleParticle[] = [];

    // Helper to start the animation loop when interaction occurs
    const wakeLoop = () => {
      if (!isLoopRunning) {
        isLoopRunning = true;
        rafId = requestAnimationFrame(animate);
      }
    };

    // 4. Mouse and Pointer Events
    const handlePointerMove = (e: MouseEvent) => {
      const now = performance.now();
      const currentX = e.clientX;
      const currentY = e.clientY;

      if (!mouse.isOver) {
        mouse.x = currentX;
        mouse.y = currentY;
        mouse.prevX = currentX;
        mouse.prevY = currentY;
        mouse.isOver = true;
        // Warm up trail nodes to current position
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          trailNodes[i].x = currentX;
          trailNodes[i].y = currentY;
        }
      } else {
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.x = currentX;
        mouse.y = currentY;
      }

      lastMoveTime = now;

      // Spawn subtle glowing dust particles along the trajectory if moving fast enough
      const dx = mouse.x - mouse.prevX;
      const dy = mouse.y - mouse.prevY;
      const dist = Math.hypot(dx, dy);

      if (dist > 3) {
        // Emit 1-2 trailing micro-particles
        const count = Math.min(Math.floor(dist / 14) + 1, 3);
        for (let i = 0; i < count; i++) {
          const ratio = (i + 1) / (count + 1);
          const px = mouse.prevX + dx * ratio + (Math.random() - 0.5) * 6;
          const py = mouse.prevY + dy * ratio + (Math.random() - 0.5) * 6;
          const isLime = Math.random() > 0.45;
          const chosenColor = isLime ? primaryColor : secondaryColor;

          particles.push({
            type: "dust",
            x: px,
            y: py,
            vx: -dx * 0.08 + (Math.random() - 0.5) * 0.9,
            vy: -dy * 0.08 + (Math.random() - 0.5) * 0.9,
            size: Math.random() * 2.8 + 1.2,
            maxSize: 3.5,
            color: chosenColor,
            alpha: 0.85,
            decay: Math.random() * 0.035 + 0.025,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            glowColor: isLime ? primaryColor : secondaryColor,
            glowBlur: 6,
            gravity: 0.02,
            friction: 0.94,
            life: 1.0,
          });
        }
      }

      wakeLoop();
    };

    const handleMouseLeave = () => {
      mouse.isOver = false;
    };

    const handlePointerDown = (e: MouseEvent) => {
      const originX = e.clientX;
      const originY = e.clientY;
      const count = Math.max(8, sparkleCount);

      // Distribute particles: ~60% sparkle stars (✦) and ~40% soft bubbles
      const starCount = Math.round(count * 0.6);
      const bubbleCount = count - starCount;

      // 1. Neon Sparkle Stars (✦)
      for (let i = 0; i < starCount; i++) {
        const angle = (Math.PI * 2 * i) / starCount + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 4.5 + 2.5; // velocity burst
        const starSize = Math.random() * 7 + 6; // outer radius
        const isLime = i % 2 === 0;
        const color = isLime ? primaryColor : COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];

        particles.push({
          type: "star",
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.5,
          vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 1.5,
          size: starSize,
          maxSize: starSize,
          color,
          alpha: 1.0,
          decay: Math.random() * 0.022 + 0.016, // lasts ~40-60 frames
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.22,
          glowColor: color,
          glowBlur: 10,
          gravity: 0.08, // gentle downward drift
          friction: 0.92, // smooth dampening
          life: 1.0,
        });
      }

      // 2. Soft Floating Bubbles
      for (let i = 0; i < bubbleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.2 + 1.2;
        const bubbleRadius = Math.random() * 6 + 4;
        const bubbleColor = Math.random() > 0.4 ? secondaryColor : primaryColor;

        particles.push({
          type: "bubble",
          x: originX + (Math.random() - 0.5) * 8,
          y: originY + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2, // slight initial upward burst
          size: bubbleRadius,
          maxSize: bubbleRadius,
          color: bubbleColor,
          alpha: 0.95,
          decay: Math.random() * 0.02 + 0.014,
          rotation: 0,
          rotationSpeed: 0,
          glowColor: bubbleColor,
          glowBlur: 6,
          gravity: -0.04, // delicate upward buoyancy
          friction: 0.95,
          life: 1.0,
        });
      }

      wakeLoop();
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mousedown", handlePointerDown, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // 5. Physics & Render Loop
    const animate = () => {
      const now = performance.now();
      const idleTime = now - lastMoveTime;

      // Clear the canvas
      ctx.clearRect(0, 0, width, height);

      // --- A. Smooth Ribbon Physics (Node Follower) ---
      if (mouse.isOver) {
        // First node smoothly springs towards target mouse
        const lead = trailNodes[0];
        lead.x += (mouse.x - lead.x) * 0.48;
        lead.y += (mouse.y - lead.y) * 0.48;

        // Successive nodes smoothly trail behind predecessor
        for (let i = 1; i < TRAIL_LENGTH; i++) {
          const prev = trailNodes[i - 1];
          const curr = trailNodes[i];
          const factor = Math.max(0.24, 0.42 - i * 0.018);
          curr.x += (prev.x - curr.x) * factor;
          curr.y += (prev.y - curr.y) * factor;
        }

        // Only draw ribbon if mouse has been moved recently
        if (idleTime < 2400) {
          const fadeAlpha = Math.max(0, 1 - idleTime / 2400);

          // Draw the smooth connected trail segments
          for (let i = 0; i < TRAIL_LENGTH - 1; i++) {
            const p0 = trailNodes[i];
            const p1 = trailNodes[i + 1];
            const dist = Math.hypot(p0.x - p1.x, p0.y - p1.y);
            if (dist < 0.5) continue;

            const t = i / (TRAIL_LENGTH - 1);
            const nodeAlpha = (1 - t * 0.85) * fadeAlpha * 0.7;
            const nodeWidth = Math.max(0.8, (1 - t) * 4.2);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineCap = "round";
            ctx.lineWidth = nodeWidth;

            // Interpolate color from Electric Lime at head to Soft Lavender at tail
            if (t < 0.4) {
              ctx.strokeStyle = primaryColor;
              ctx.shadowColor = primaryColor;
              ctx.shadowBlur = 8;
            } else {
              ctx.strokeStyle = secondaryColor;
              ctx.shadowColor = secondaryColor;
              ctx.shadowBlur = 5;
            }
            ctx.globalAlpha = nodeAlpha;
            ctx.stroke();
            ctx.restore();
          }

          // Subtle lead follower orb at cursor tip
          ctx.save();
          ctx.beginPath();
          ctx.arc(lead.x, lead.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = primaryColor;
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = 10;
          ctx.globalAlpha = fadeAlpha * 0.95;
          ctx.fill();

          // Subtle neon lavender outer aura
          ctx.beginPath();
          ctx.arc(lead.x, lead.y, 6.5, 0, Math.PI * 2);
          ctx.strokeStyle = secondaryColor;
          ctx.lineWidth = 1.2;
          ctx.shadowColor = secondaryColor;
          ctx.shadowBlur = 6;
          ctx.globalAlpha = fadeAlpha * 0.65;
          ctx.stroke();
          ctx.restore();
        }
      }

      // --- B. Active Particles (Sparkle Stars, Bubbles, Dust) ---
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Apply physics
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const currentAlpha = Math.max(0, p.alpha * p.life);

        if (p.type === "star") {
          // Render 4-pointed neon sparkle star ✦
          const currentOuter = p.size * (0.4 + p.life * 0.6);
          const currentInner = currentOuter * 0.28;

          ctx.save();
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = p.glowBlur * p.life;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          drawFourPointStar(ctx, p.x, p.y, currentOuter, currentInner, p.rotation);
          ctx.fill();

          // Bright white center core for intense neon glint
          if (currentOuter > 4) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.8, currentInner * 0.6), 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.globalAlpha = currentAlpha * 0.95;
            ctx.fill();
          }
          ctx.restore();
        } else if (p.type === "bubble") {
          // Render soft translucent bubble
          const currentRadius = p.size * (0.6 + (1 - p.life) * 0.4); // gentle expansion before pop
          drawSoftBubble(ctx, p.x, p.y, currentRadius, p.color, currentAlpha);
        } else {
          // Render micro glowing dust particle
          const radius = Math.max(0.6, p.size * p.life);
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = p.glowBlur;
          ctx.globalAlpha = currentAlpha;
          ctx.fill();
          ctx.restore();
        }
      }

      // --- C. Smart Low-Power Sleep Check ---
      // If no particles exist and mouse has been idle > 2.5s, pause the loop to preserve CPU/battery
      if (particles.length === 0 && idleTime > 2500) {
        isLoopRunning = false;
        rafId = null;
        return;
      }

      rafId = requestAnimationFrame(animate);
    };

    // Cleanup when component unmounts
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [enabled, primaryColor, secondaryColor, sparkleCount]);

  // If disabled, render nothing
  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[9999] ${className}`}
      aria-hidden="true"
      style={{
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}

export default CursorTrail;
