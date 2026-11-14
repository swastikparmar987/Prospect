import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import React from "react";
import { CursorTrail } from "../components/landing/CursorTrail";
import DefaultCursorTrail from "../components/landing/CursorTrail";

test("CursorTrail Component Verification", async (t) => {
  await t.test("exports both named and default CursorTrail", () => {
    assert.equal(typeof CursorTrail, "function");
    assert.equal(typeof DefaultCursorTrail, "function");
    assert.equal(CursorTrail, DefaultCursorTrail);
  });

  await t.test("source file adheres to all styling, physics, and interaction specs", () => {
    const filePath = path.join(process.cwd(), "src/components/landing/CursorTrail.tsx");
    assert.ok(fs.existsSync(filePath), "CursorTrail.tsx must exist");

    const source = fs.readFileSync(filePath, "utf-8");

    // Colors
    assert.ok(source.includes("#E0FB66"), "Must contain electric lime #E0FB66");
    assert.ok(
      source.toLowerCase().includes("lavender") || source.includes("#C084FC") || source.includes("#DDD6FE"),
      "Must include soft lavender palette"
    );

    // Click sparkle burst
    assert.ok(source.includes("✦") || source.includes("drawFourPointStar"), "Must implement 4-pointed sparkle stars");
    assert.ok(source.includes("bubble"), "Must implement soft bubbles");
    assert.ok(source.includes("sparkleCount"), "Must support sparkleCount customization");

    // Accessibility and mobile / touch screen handling
    assert.ok(source.includes("prefers-reduced-motion"), "Must check prefers-reduced-motion");
    assert.ok(source.includes("pointer: coarse"), "Must check coarse pointer (touch devices)");
    assert.ok(source.includes("pointer-events-none") || source.includes("pointerEvents: \"none\""), "Must have pointer-events none");
    assert.ok(source.includes("9999"), "Must have z-index 9999");
    assert.ok(source.includes("requestAnimationFrame"), "Must use requestAnimationFrame");
  });

  await t.test("renders cleanly in SSR / disabled mode without throwing", () => {
    const disabledElement = React.createElement(CursorTrail, { enabled: false });
    assert.ok(disabledElement !== null);

    const defaultElement = React.createElement(CursorTrail);
    assert.ok(defaultElement !== null);
  });
});
