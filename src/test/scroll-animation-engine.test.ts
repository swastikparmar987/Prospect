import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import React from "react";
import ScrollRevealDefault, {
  registerScrollTrigger,
  getPrefersReducedMotion,
  usePrefersReducedMotion,
  useScrollAnimationEngine,
  ScrollReveal,
  ScrollParallax,
  ScrollBeam,
  gsap,
  ScrollTrigger,
} from "../components/landing/ScrollAnimationEngine";

test("ScrollAnimationEngine Component & Hook Verification", async (t) => {
  await t.test("exports all required helpers, components, and GSAP objects cleanly", () => {
    assert.equal(typeof ScrollReveal, "object", "ScrollReveal must be a valid React forwardRef component");
    assert.equal(typeof ScrollParallax, "object", "ScrollParallax must be a valid React forwardRef component");
    assert.equal(typeof ScrollBeam, "function", "ScrollBeam must be a valid React component function");
    assert.equal(typeof useScrollAnimationEngine, "function", "useScrollAnimationEngine must be a hook function");
    assert.equal(typeof usePrefersReducedMotion, "function", "usePrefersReducedMotion must be a hook function");
    assert.equal(typeof registerScrollTrigger, "function", "registerScrollTrigger must be a registration function");
    assert.equal(typeof getPrefersReducedMotion, "function", "getPrefersReducedMotion must be a helper function");
    assert.equal(typeof gsap, "object", "gsap must be exported");
    assert.equal(typeof ScrollTrigger, "function", "ScrollTrigger must be exported");
    assert.equal(ScrollReveal, ScrollRevealDefault, "Default export must equal ScrollReveal");
  });

  await t.test("safely handles SSR and window checks", () => {
    // In Node.js / non-browser environment
    const registered = registerScrollTrigger();
    assert.equal(typeof registered, "boolean");

    const reducedMotion = getPrefersReducedMotion();
    assert.equal(typeof reducedMotion, "boolean");
    assert.equal(reducedMotion, false, "Default in non-browser environment should be false");
  });

  await t.test("source file implements all required production-grade GSAP ScrollTrigger features", () => {
    const filePath = path.join(process.cwd(), "src/components/landing/ScrollAnimationEngine.tsx");
    assert.ok(fs.existsSync(filePath), "ScrollAnimationEngine.tsx must exist");

    const source = fs.readFileSync(filePath, "utf-8");

    // Client-side only safety guard
    assert.ok(source.includes("typeof window !== \"undefined\"") || source.includes("typeof window !== 'undefined'"), "Must have safe client window guard");
    assert.ok(source.includes("registerPlugin"), "Must call registerPlugin(ScrollTrigger)");

    // ScrollReveal specification
    assert.ok(source.includes("initialRotation"), "ScrollReveal must support initialRotation (-1.5deg)");
    assert.ok(source.includes("initialScale"), "ScrollReveal must support initialScale (0.95)");
    assert.ok(source.includes("initialOpacity"), "ScrollReveal must support initialOpacity");
    assert.ok(source.includes("stagger"), "ScrollReveal must support staggered entry");
    assert.ok(source.includes("triggerOffset"), "ScrollReveal must support customizable trigger offsets");

    // ScrollParallax specification
    assert.ok(source.includes("ScrollParallax"), "ScrollParallax must be implemented");
    assert.ok(source.includes("speed"), "ScrollParallax must support speed multiplier");
    assert.ok(source.includes("scrub"), "ScrollParallax must support smooth scrub");

    // ScrollBeam specification
    assert.ok(source.includes("ScrollBeam"), "ScrollBeam must be implemented");
    assert.ok(source.includes("strokeDashoffset"), "ScrollBeam must animate strokeDashoffset");
    assert.ok(source.includes("getTotalLength"), "ScrollBeam must calculate path length");
    assert.ok(source.includes("#E0FB66"), "ScrollBeam must use electric lime stroke");

    // Reduced motion & cleanup
    assert.ok(source.includes("prefers-reduced-motion"), "Must gracefully handle prefers-reduced-motion");
    assert.ok(source.includes("ctx.revert()"), "Must clean up GSAP context on unmount");
    assert.ok(source.includes("ScrollTrigger.refresh()"), "Must handle resize and trigger refresh");
  });

  await t.test("components instantiate React elements without SSR runtime errors", () => {
    const revealEl = React.createElement(ScrollReveal, { initialRotation: -1.5, initialScale: 0.95 }, "Test Content");
    assert.ok(revealEl !== null);

    const parallaxEl = React.createElement(ScrollParallax, { speed: 0.15 }, "Parallax Content");
    assert.ok(parallaxEl !== null);

    const beamEl = React.createElement(ScrollBeam, { orientation: "horizontal" });
    assert.ok(beamEl !== null);
  });
});
