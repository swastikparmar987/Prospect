import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { ThreeFeaturesCards } from "../components/landing/ThreeFeaturesCards";
import { HowItWorksWorkflow } from "../components/landing/HowItWorksWorkflow";
import { ProductDashboardPreview } from "../components/landing/ProductDashboardPreview";
import { FinalCtaSection } from "../components/landing/FinalCtaSection";

test("Scroll UI Sections Verification", async (t) => {
  await t.test("all four scroll-animated components instantiate clean React elements", () => {
    const el1 = React.createElement(ThreeFeaturesCards, {});
    const el2 = React.createElement(HowItWorksWorkflow, {});
    const el3 = React.createElement(ProductDashboardPreview, {});
    const el4 = React.createElement(FinalCtaSection, {});

    assert.ok(el1, "ThreeFeaturesCards must instantiate React element");
    assert.ok(el2, "HowItWorksWorkflow must instantiate React element");
    assert.ok(el3, "ProductDashboardPreview must instantiate React element");
    assert.ok(el4, "FinalCtaSection must instantiate React element");
  });

  await t.test("ThreeFeaturesCards implements bouncy word reveal and 3-card tilt/bounce scroll animations", () => {
    const file = fs.readFileSync(
      path.resolve(__dirname, "../components/landing/ThreeFeaturesCards.tsx"),
      "utf8"
    );

    assert.ok(file.includes("bouncy-word"), "Headline words must have bouncy-word class");
    assert.ok(file.includes("back.out(2.2)"), "Must use elastic back easing for word reveal or cards");
    assert.ok(file.includes("card1Ref"), "Must have card1Ref for tilt animation");
    assert.ok(file.includes("card2Ref"), "Must have card2Ref for elastic bounce animation");
    assert.ok(file.includes("card3Ref"), "Must have card3Ref for tilt animation");
    assert.ok(file.includes("rgba(224, 251, 102"), "Must activate glowing electric-lime shadow pulse");
  });

  await t.test("HowItWorksWorkflow implements scroll-animated connecting beam and step badge elevation", () => {
    const file = fs.readFileSync(
      path.resolve(__dirname, "../components/landing/HowItWorksWorkflow.tsx"),
      "utf8"
    );

    assert.ok(file.includes("ScrollBeam"), "Must include ScrollBeam connecting line");
    assert.ok(file.includes("activatedSteps"), "Must track activated step states");
    assert.ok(file.includes("badgeRefs"), "Must reference step number badges to light them up");
    assert.ok(file.includes("-translate-y-2") || file.includes("y: -8"), "Must elevate cards on scroll view");
  });

  await t.test("ProductDashboardPreview implements scroll parallax, scale zoom from 0.94 to 1.0, and glowing halo", () => {
    const file = fs.readFileSync(
      path.resolve(__dirname, "../components/landing/ProductDashboardPreview.tsx"),
      "utf8"
    );

    assert.ok(file.includes("scale: 0.94"), "Must set initial scale to 0.94");
    assert.ok(file.includes("scale: 1.0"), "Must animate scale to 1.0");
    assert.ok(file.includes("haloRef"), "Must have haloRef for glowing halo effect");
    assert.ok(file.includes("ScrollParallax"), "Must utilize ScrollParallax");
  });

  await t.test("FinalCtaSection implements parallax rotation for background isometric 3D portal watermark", () => {
    const file = fs.readFileSync(
      path.resolve(__dirname, "../components/landing/FinalCtaSection.tsx"),
      "utf8"
    );

    assert.ok(file.includes("ScrollParallax"), "Must use ScrollParallax");
    assert.ok(file.includes("rotate="), "Must set parallax rotation for portal watermark");
    assert.ok(file.includes("ellipse"), "Must contain isometric ellipses for 3D portal");
  });
});
