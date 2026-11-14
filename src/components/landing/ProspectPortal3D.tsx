"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface ProspectPortal3DProps {
  className?: string;
}

export function ProspectPortal3D({ className = "" }: ProspectPortal3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 560;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfdf9f3, 0.012);

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 12.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    // Key bright light for crystal glass highlights
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    // Electric lime inner glow light
    const limePointLight = new THREE.PointLight(0xe0fb66, 4.5, 20);
    limePointLight.position.set(0.6, 1.2, 0.8);
    scene.add(limePointLight);

    // Warm back-fill light
    const warmRimLight = new THREE.DirectionalLight(0xfef189, 2.0);
    warmRimLight.position.set(-8, -4, -6);
    scene.add(warmRimLight);

    // --- Master Group (with mouse parallax) ---
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);
    masterGroup.position.y = -0.3;

    // --- 1. Dual-Tiered Pedestal Base ---
    const pedestalGroup = new THREE.Group();
    masterGroup.add(pedestalGroup);

    // Bottom Base Slab
    const base1Geo = new THREE.CylinderGeometry(4.2, 4.4, 0.35, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xf5efe6,
      roughness: 0.45,
      metalness: 0.05,
    });
    const base1 = new THREE.Mesh(base1Geo, baseMat);
    base1.position.y = -2.6;
    pedestalGroup.add(base1);

    // Top Base Step
    const base2Geo = new THREE.CylinderGeometry(3.6, 3.8, 0.28, 48);
    const base2 = new THREE.Mesh(base2Geo, baseMat);
    base2.position.y = -2.3;
    pedestalGroup.add(base2);

    // Subtle Ground Lime Glow Ring beneath P
    const glowRingGeo = new THREE.RingGeometry(0.8, 2.5, 48);
    const glowRingMat = new THREE.MeshBasicMaterial({
      color: 0xe0fb66,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = -2.14;
    pedestalGroup.add(glowRing);

    // --- 2. The 3D Geometric "P" Portal ---
    const portalGroup = new THREE.Group();
    masterGroup.add(portalGroup);

    // Create 2D Shape for letter P with inner loop hole
    const pShape = new THREE.Shape();
    // Vertical stem left
    pShape.moveTo(-1.6, -2.1);
    pShape.lineTo(-0.4, -2.1);
    pShape.lineTo(-0.4, 0.2);
    // Outer loop curve
    pShape.lineTo(0.9, 0.2);
    pShape.bezierCurveTo(2.4, 0.2, 2.4, 2.8, 0.9, 2.8);
    pShape.lineTo(-1.6, 2.8);
    pShape.closePath();

    // Inner loop cutout (the portal window)
    const pHole = new THREE.Path();
    pHole.moveTo(-0.4, 1.0);
    pHole.lineTo(0.7, 1.0);
    pHole.bezierCurveTo(1.5, 1.0, 1.5, 2.0, 0.7, 2.0);
    pHole.lineTo(-0.4, 2.0);
    pHole.closePath();
    pShape.holes.push(pHole);

    // Extrusion with beveled crystal edges
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 1.1,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 2,
      bevelSize: 0.12,
      bevelThickness: 0.15,
    };
    const pGeometry = new THREE.ExtrudeGeometry(pShape, extrudeSettings);
    pGeometry.center(); // Center geometry around its pivot

    // Crystal / Glass-like Physical Material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.1,
      transmission: 0.88,
      thickness: 1.4,
      transparent: true,
      opacity: 0.85,
      ior: 1.52,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const glassPMesh = new THREE.Mesh(pGeometry, glassMat);
    portalGroup.add(glassPMesh);

    // Inner Electric Lime Portal Core Channel
    const innerSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.7,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.06,
    };
    const innerPGeom = new THREE.ExtrudeGeometry(pShape, innerSettings);
    innerPGeom.center();
    const limeMat = new THREE.MeshStandardMaterial({
      color: 0xe0fb66,
      emissive: 0xe0fb66,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.2,
    });
    const limeCoreMesh = new THREE.Mesh(innerPGeom, limeMat);
    limeCoreMesh.scale.set(0.92, 0.92, 0.9);
    portalGroup.add(limeCoreMesh);

    // --- 3. Portal Horizon / Meadow Disc inside the loop window ---
    // Create a dynamic canvas texture for the sunlit meadow horizon
    const horizonCanvas = document.createElement("canvas");
    horizonCanvas.width = 512;
    horizonCanvas.height = 512;
    const ctx = horizonCanvas.getContext("2d");
    if (ctx) {
      // Golden sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
      skyGrad.addColorStop(0, "#FEF189");
      skyGrad.addColorStop(0.5, "#E0FB66");
      skyGrad.addColorStop(1, "#86EFAC");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Sun
      ctx.beginPath();
      ctx.arc(256, 180, 70, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 240, 0.9)";
      ctx.fill();

      // Rolling green hills
      ctx.beginPath();
      ctx.moveTo(0, 280);
      ctx.quadraticCurveTo(140, 240, 256, 270);
      ctx.quadraticCurveTo(380, 300, 512, 260);
      ctx.lineTo(512, 512);
      ctx.lineTo(0, 512);
      ctx.closePath();
      ctx.fillStyle = "#22C55E";
      ctx.fill();

      // Winding road / path leading to sun
      ctx.beginPath();
      ctx.moveTo(256, 270);
      ctx.quadraticCurveTo(230, 380, 190, 512);
      ctx.lineTo(320, 512);
      ctx.quadraticCurveTo(270, 380, 256, 270);
      ctx.closePath();
      ctx.fillStyle = "#FEF9C3";
      ctx.fill();
    }

    const horizonTexture = new THREE.CanvasTexture(horizonCanvas);
    const horizonGeo = new THREE.CircleGeometry(0.85, 32);
    const horizonMat = new THREE.MeshBasicMaterial({
      map: horizonTexture,
      side: THREE.DoubleSide,
    });
    const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    horizonMesh.position.set(0.35, 0.55, 0);
    portalGroup.add(horizonMesh);

    // --- 4. Connected Thin Lime Orbital Lines & Satellite Nodes ---
    const orbitalGroup = new THREE.Group();
    masterGroup.add(orbitalGroup);

    // Orbital Ring 1: Tilted ellipse
    const ring1Curve = new THREE.EllipseCurve(0, 0, 3.4, 2.2, 0, Math.PI * 2, false, 0);
    const ring1Points = ring1Curve.getPoints(80);
    const ring1Geo = new THREE.BufferGeometry().setFromPoints(ring1Points);
    const ringMat = new THREE.LineBasicMaterial({
      color: 0xe0fb66,
      transparent: true,
      opacity: 0.7,
      linewidth: 1.5,
    });
    const ring1 = new THREE.LineLoop(ring1Geo, ringMat);
    ring1.rotation.x = Math.PI / 3.2;
    ring1.rotation.y = Math.PI / 6;
    orbitalGroup.add(ring1);

    // Orbital Ring 2: Opposing tilted ellipse
    const ring2Curve = new THREE.EllipseCurve(0, 0, 3.8, 2.6, 0, Math.PI * 2, false, 0);
    const ring2Points = ring2Curve.getPoints(80);
    const ring2Geo = new THREE.BufferGeometry().setFromPoints(ring2Points);
    const ring2 = new THREE.LineLoop(ring2Geo, ringMat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = -Math.PI / 5;
    orbitalGroup.add(ring2);

    // Small glowing satellite spheres on the orbits
    const satGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xe0fb66 });

    const sat1 = new THREE.Mesh(satGeo, satMat);
    orbitalGroup.add(sat1);

    const sat2 = new THREE.Mesh(satGeo, satMat);
    orbitalGroup.add(sat2);

    const sat3 = new THREE.Mesh(satGeo, satMat);
    orbitalGroup.add(sat3);

    // --- Mouse Parallax & Breathing Animation ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouse.targetX = (clientX / width - 0.5) * 2;
      mouse.targetY = (clientY / height - 0.5) * 2;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      if (!prefersReducedMotion) {
        // Gentle breathing float
        portalGroup.position.y = Math.sin(elapsedTime * 1.6) * 0.12;

        // Subtle 3D rotation influenced by cursor
        portalGroup.rotation.y = 0.22 + mouse.x * 0.35 + Math.sin(elapsedTime * 0.8) * 0.06;
        portalGroup.rotation.x = -0.08 + mouse.y * 0.25;

        // Orbital ring rotations
        ring1.rotation.z = elapsedTime * 0.15;
        ring2.rotation.z = -elapsedTime * 0.12;

        // Orbit satellites
        const t1 = elapsedTime * 0.45;
        sat1.position.set(
          Math.cos(t1) * 3.4,
          Math.sin(t1) * 2.2 * Math.cos(Math.PI / 3.2),
          Math.sin(t1) * 2.2 * Math.sin(Math.PI / 3.2)
        );

        const t2 = -elapsedTime * 0.38 + 2.0;
        sat2.position.set(
          Math.cos(t2) * 3.8,
          Math.sin(t2) * 2.6 * Math.cos(-Math.PI / 4),
          Math.sin(t2) * 2.6 * Math.sin(-Math.PI / 4)
        );

        const t3 = elapsedTime * 0.6 + 4.0;
        sat3.position.set(
          Math.cos(t3) * 3.0,
          Math.sin(t3) * 1.8 * Math.cos(Math.PI / 5),
          Math.sin(t3) * 1.8 * Math.sin(Math.PI / 5)
        );
      } else {
        portalGroup.rotation.y = 0.22;
        portalGroup.rotation.x = -0.08;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      pGeometry.dispose();
      innerPGeom.dispose();
      glassMat.dispose();
      limeMat.dispose();
      horizonGeo.dispose();
      horizonMat.dispose();
      base1Geo.dispose();
      base2Geo.dispose();
      baseMat.dispose();
    };
  }, []);

  if (!webglSupported) {
    // High-fidelity isometric 3D portal fallback matching the exact design specification
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
          <svg
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-xl overflow-visible"
          >
            {/* Defs for gradients & filters */}
            <defs>
              <linearGradient id="glassGrad" x1="120" y1="80" x2="380" y2="400" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#F4F8EB" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#E0FB66" stopOpacity="0.4" />
              </linearGradient>

              <linearGradient id="meadowSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="45%" stopColor="#E0FB66" />
                <stop offset="100%" stopColor="#86EFAC" />
              </linearGradient>

              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Pedestal Bottom Base */}
            <ellipse cx="250" cy="425" rx="195" ry="34" fill="#EAE2D7" stroke="#080808" strokeWidth="2.5" />
            <path
              d="M55 425 C55 444 142 458 250 458 C358 458 445 444 445 425 V438 C445 457 358 472 250 472 C142 472 55 457 55 438 Z"
              fill="#D6CDBF"
              stroke="#080808"
              strokeWidth="2.5"
            />

            {/* Pedestal Top Step */}
            <ellipse cx="250" cy="405" rx="165" ry="28" fill="#FBF8F2" stroke="#080808" strokeWidth="2.5" />
            <path
              d="M85 405 C85 420 159 432 250 432 C341 432 415 420 415 405 V415 C415 430 341 442 250 442 C159 442 85 430 85 415 Z"
              fill="#EAE2D7"
              stroke="#080808"
              strokeWidth="2.5"
            />

            {/* Ground Lime Glow Ring */}
            <ellipse cx="250" cy="398" rx="110" ry="18" fill="#E0FB66" opacity="0.65" filter="url(#softGlow)" />

            {/* Rear Orbital Ring Segment */}
            <ellipse
              cx="250"
              cy="250"
              rx="210"
              ry="115"
              transform="rotate(-15 250 250)"
              stroke="#E0FB66"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.8"
            />

            {/* The 3D Glass "P" Outer Extruded Shadow / Side Facets */}
            <path
              d="M175 110 L205 85 H325 C375 85 415 125 415 175 C415 225 375 265 325 265 H275 V390 L245 405 V285 H175 Z"
              fill="#DCEB88"
              stroke="#080808"
              strokeWidth="2.5"
              opacity="0.9"
            />

            {/* The Main "P" Front Body */}
            <path
              d="M160 120 C160 110 168 102 178 102 H310 C358 102 396 140 396 188 C396 236 358 274 310 274 H235 V395 C235 402 229 408 222 408 H173 C166 408 160 402 160 395 V120 Z"
              fill="url(#glassGrad)"
              stroke="#080808"
              strokeWidth="2.5"
            />

            {/* Inner Glowing Lime Core Border */}
            <path
              d="M185 135 H300 C332 135 358 161 358 193 C358 225 332 251 300 251 H235 V380 H185 V135 Z"
              fill="none"
              stroke="#E0FB66"
              strokeWidth="6"
              strokeLinejoin="round"
              filter="url(#softGlow)"
            />

            {/* Portal Loop Window with Sunlit Meadow & Winding Path */}
            <g clipPath="url(#portalWindowClip)">
              <defs>
                <clipPath id="portalWindowClip">
                  <path
                    d="M235 150 H295 C316 150 333 167 333 188 C333 209 316 226 295 226 H235 V150 Z"
                  />
                </clipPath>
              </defs>

              {/* Sky */}
              <rect x="220" y="140" width="130" height="100" fill="url(#meadowSky)" />

              {/* Glowing Sun */}
              <circle cx="280" cy="175" r="18" fill="#FFFBEB" opacity="0.95" />

              {/* Rolling Green Hills */}
              <path
                d="M220 195 Q260 182 290 192 T350 190 V240 H220 Z"
                fill="#22C55E"
              />

              {/* Winding Yellow Road leading to Sun */}
              <path
                d="M280 192 Q270 210 260 226 H295 Q285 210 280 192 Z"
                fill="#FEF08A"
              />
            </g>

            {/* Portal Window Black Border */}
            <path
              d="M235 150 H295 C316 150 333 167 333 188 C333 209 316 226 295 226 H235 V150 Z"
              fill="none"
              stroke="#080808"
              strokeWidth="2.5"
            />

            {/* Front Orbital Ring Overlap with Satellites */}
            <circle cx="115" cy="275" r="5" fill="#E0FB66" stroke="#080808" strokeWidth="1.5" />
            <circle cx="395" cy="205" r="5" fill="#E0FB66" stroke="#080808" strokeWidth="1.5" />
            <circle cx="290" cy="345" r="4.5" fill="#E0FB66" stroke="#080808" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[460px] sm:h-[540px] lg:h-[600px] flex items-center justify-center select-none pointer-events-auto ${className}`}
      aria-label="3D Prospect Portal Illustration"
    />
  );
}
