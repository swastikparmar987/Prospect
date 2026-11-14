import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import React from "react";
import { FallingGoodies, GoofyEyeCompanion } from "../components/landing/FallingGoodies";
import DefaultFallingGoodies from "../components/landing/FallingGoodies";

test("Landing Mascot and Falling Elements Refactoring Suite", async (t) => {
  await t.test("1. Exports: Both FallingGoodies and GoofyEyeCompanion exist and are functions", () => {
    assert.equal(typeof FallingGoodies, "function", "FallingGoodies must be exported as a function");
    assert.equal(typeof DefaultFallingGoodies, "function", "FallingGoodies must have a default export");
    assert.equal(typeof GoofyEyeCompanion, "function", "GoofyEyeCompanion must be exported as a function");
    assert.equal(FallingGoodies, DefaultFallingGoodies, "Default export should match named export");
  });

  await t.test("2. Floating trigger button: 'Drop Career Goodies' button is completely removed", () => {
    const filePath = path.join(process.cwd(), "src/components/landing/FallingGoodies.tsx");
    assert.ok(fs.existsSync(filePath), "FallingGoodies.tsx must exist");
    const source = fs.readFileSync(filePath, "utf-8");

    // The floating trigger button and its dice shake animation must not be rendered
    assert.ok(!source.includes("Drop Career Goodies</button>"), "Drop Career Goodies button text must not be rendered");
    assert.ok(!source.includes("aria-label=\"Drop Career Goodies\""), "aria-label for Drop Career Goodies must be removed");
    assert.ok(!source.includes("diceShake"), "diceShake animation should be removed");
  });

  await t.test("3. Falling Physics: Soft gravity, graceful float, and smooth drift without abrupt tumbling", () => {
    const filePath = path.join(process.cwd(), "src/components/landing/FallingGoodies.tsx");
    const source = fs.readFileSync(filePath, "utf-8");

    // Keyframe uses softFloatDown
    assert.ok(source.includes("@keyframes softFloatDown"), "Must implement softFloatDown keyframe");
    assert.ok(!source.includes("tumbleDownKeyframe"), "tumbleDownKeyframe must be replaced with softFloatDown");

    // Smooth duration and gentle physics
    assert.ok(source.includes("softFloatDown"), "Must assign softFloatDown animation name");
    assert.ok(source.includes("driftX"), "Must track gentle driftX");
    assert.ok(source.includes("autoDrift"), "Must support autoDrift prop for gentle ambient drift");
  });

  await t.test("4. GoofyEyeCompanion: Comic speech bubble directly centered with guaranteed screen bounds", () => {
    const filePath = path.join(process.cwd(), "src/components/landing/FallingGoodies.tsx");
    const source = fs.readFileSync(filePath, "utf-8");

    // Centered above PAL button
    assert.ok(
      source.includes("left-1/2") && source.includes("-translate-x-1/2"),
      "Speech bubble must use left-1/2 and -translate-x-1/2 centering pattern"
    );

    // High z-index
    assert.ok(source.includes("z-[80]") || source.includes("z-50"), "Speech bubble must have prominent z-index");

    // Screen bounds detection and clamping
    assert.ok(source.includes("viewportWidth") || source.includes("innerWidth"), "Must check viewport width");
    assert.ok(source.includes("horizontalShift") || source.includes("adjustBounds"), "Must implement dynamic bounds adjustment");

    // Clear and prominent styling
    assert.ok(source.includes("PAL"), "Must include PAL mascot badge");
    assert.ok(source.includes("Resume: 10/10 vibes"), "Must include cheerful default quotes");
  });

  await t.test("5. Prospect Logo: All headers, navbars, and footers link cleanly to landing page", () => {
    // 5a. LandingExperience header logo
    const landingPath = path.join(process.cwd(), "src/components/landing/LandingExperience.tsx");
    const landingSource = fs.readFileSync(landingPath, "utf-8");
    assert.ok(
      landingSource.includes("<ProspectLogo") && landingSource.includes("href=\"/\""),
      "LandingExperience header must have link to landing page"
    );

    // 5b. ProspectFooter logo
    const footerPath = path.join(process.cwd(), "src/components/landing/ProspectFooter.tsx");
    const footerSource = fs.readFileSync(footerPath, "utf-8");
    assert.ok(
      footerSource.includes("<ProspectLogo") && footerSource.includes("href=\"/\""),
      "ProspectFooter must have link to landing page"
    );

    // 5c. Sidebar brand lockup
    const sidebarPath = path.join(process.cwd(), "src/components/Sidebar.tsx");
    const sidebarSource = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(
      sidebarSource.includes("handleNavClick(\"landing\", \"home\")"),
      "Sidebar brand logo must navigate to landing page"
    );

    // 5d. Navbar brand lockup
    const navbarPath = path.join(process.cwd(), "src/components/Navbar.tsx");
    const navbarSource = fs.readFileSync(navbarPath, "utf-8");
    assert.ok(
      navbarSource.includes("onSelectTab(\"landing\")"),
      "Navbar brand logo must link to landing page"
    );
  });

  await t.test("6. SSR React element creation executes cleanly without errors", () => {
    const goodiesEl = React.createElement(FallingGoodies, { autoDrift: false });
    assert.ok(goodiesEl !== null, "FallingGoodies element creates cleanly");

    const companionEl = React.createElement(GoofyEyeCompanion, { position: "bottom-right" });
    assert.ok(companionEl !== null, "GoofyEyeCompanion element creates cleanly");
  });
});
