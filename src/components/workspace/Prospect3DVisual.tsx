"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Briefcase, GraduationCap, Layers } from "lucide-react";

export interface Prospect3DVisualProps {
  className?: string;
  onSelectCategory?: (category: "ALL" | "INTERNSHIP" | "FULL_TIME") => void;
}

const CATEGORY_PILLS: Array<{
  label: string;
  category: "ALL" | "INTERNSHIP" | "FULL_TIME";
  icon: "briefcase" | "graduation" | "layers";
  positionClass: string;
}> = [
  {
    label: "Jobs",
    category: "FULL_TIME",
    icon: "briefcase",
    positionClass: "top-2 left-1 sm:left-0",
  },
  {
    label: "Internships",
    category: "INTERNSHIP",
    icon: "graduation",
    positionClass: "top-6 right-1 sm:right-0",
  },
  {
    label: "Roles",
    category: "ALL",
    icon: "layers",
    positionClass: "bottom-3 left-3 sm:left-2",
  },
];

function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const envScene = new THREE.Scene();
  const disposables: Array<{ dispose: () => void }> = [];

  const domeGeo = new THREE.SphereGeometry(20, 24, 16);
  const domeMat = new THREE.MeshBasicMaterial({
    color: 0xfdfbf8,
    side: THREE.BackSide,
  });
  envScene.add(new THREE.Mesh(domeGeo, domeMat));
  disposables.push(domeGeo, domeMat);

  const createSoftbox = (
    w: number,
    h: number,
    color: number,
    pos: [number, number, number],
    lookAt: [number, number, number] = [0, 0, 0]
  ) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.lookAt(...lookAt);
    envScene.add(mesh);
    disposables.push(geo, mat);
  };

  // Overhead white studio softbox for crisp clearcoat highlights
  createSoftbox(14, 10, 0xffffff, [0, 11, 5]);
  // Right-side soft lime bounce
  createSoftbox(10, 12, 0xf1ffc7, [11, 3, 4]);
  // Left-side soft lavender highlight accent
  createSoftbox(10, 12, 0xeae3ff, [-11, 4, 3]);
  // Warm ivory floor bounce (eliminates dark underside reflections)
  createSoftbox(18, 18, 0xf4f1ea, [0, -10, 0]);
  // Subtle front-top highlight rim
  createSoftbox(9, 5, 0xdfff43, [4, 7, 10]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const renderTarget = pmrem.fromScene(envScene, 0.045);

  pmrem.dispose();
  for (const item of disposables) {
    item.dispose();
  }

  return renderTarget;
}

function createHaloTexture(): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, "rgba(223, 255, 67, 0.85)");
  grad.addColorStop(0.38, "rgba(241, 255, 199, 0.55)");
  grad.addColorStop(0.72, "rgba(166, 217, 75, 0.16)");
  grad.addColorStop(1, "rgba(241, 255, 199, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createRoundedPShape(): { shape: THREE.Shape; hole: THREE.Path } {
  const shape = new THREE.Shape();

  // Outer "P" contour with smooth rounded corners & continuous fillet
  shape.moveTo(-1.24, -2.12);
  shape.lineTo(-0.7, -2.12);
  shape.quadraticCurveTo(-0.48, -2.12, -0.48, -1.9);
  shape.lineTo(-0.48, -0.34);
  shape.quadraticCurveTo(-0.48, -0.2, -0.32, -0.2);
  shape.lineTo(0.46, -0.2);
  shape.bezierCurveTo(2.08, -0.2, 2.08, 2.12, 0.46, 2.12);
  shape.lineTo(-1.24, 2.12);
  shape.quadraticCurveTo(-1.46, 2.12, -1.46, 1.9);
  shape.lineTo(-1.46, -1.9);
  shape.quadraticCurveTo(-1.46, -2.12, -1.24, -2.12);
  shape.closePath();

  // Inner counter cutout with balanced top/bottom/right glass rim
  const hole = new THREE.Path();
  hole.moveTo(-0.38, 0.46);
  hole.lineTo(0.32, 0.46);
  hole.bezierCurveTo(1.22, 0.46, 1.22, 1.46, 0.32, 1.46);
  hole.lineTo(-0.38, 1.46);
  hole.quadraticCurveTo(-0.48, 1.46, -0.48, 1.36);
  hole.lineTo(-0.48, 0.56);
  hole.quadraticCurveTo(-0.48, 0.46, -0.38, 0.46);
  hole.closePath();

  shape.holes.push(hole);
  return { shape, hole };
}

function createEllipseTubeGeometry(
  rx: number,
  ry: number,
  tubeRadius: number
): THREE.TubeGeometry {
  const ellipse = new THREE.EllipseCurve(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  const pts2d = ellipse.getPoints(96);
  // Remove duplicated closing point so CatmullRomCurve3 closes smoothly
  pts2d.pop();
  const pts3d = pts2d.map((p) => new THREE.Vector3(p.x, 0, p.y));
  const curve = new THREE.CatmullRomCurve3(pts3d, true, "centripetal");
  return new THREE.TubeGeometry(curve, 112, tubeRadius, 8, true);
}

export function Prospect3DVisual({
  className = "",
  onSelectCategory,
}: Prospect3DVisualProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const pointerStateRef = useRef<{
    targetX: number;
    targetY: number;
    onPointerUpdate?: () => void;
  }>({ targetX: 0, targetY: 0 });
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [fallbackTilt, setFallbackTilt] = useState<{ rx: number; ry: number }>({
    rx: 0,
    ry: 0,
  });

  useEffect(() => {
    const container = canvasHostRef.current;
    const pointerState = pointerStateRef.current;
    if (!container) return;

    // Automatic WebGL support detection
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 220;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = false;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envRenderTarget = createStudioEnvironment(renderer);
    scene.environment = envRenderTarget.texture;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.55, 11.2);
    camera.lookAt(0, -0.1, 0);

    // Apple-modern studio lighting (zero harsh black shadows)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xf4f1ea, 1.35);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xfdfbf8, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(6, 9, 8);
    scene.add(keyLight);

    const lavenderRimLight = new THREE.DirectionalLight(0xeae3ff, 1.4);
    lavenderRimLight.position.set(-7, 5, -4);
    scene.add(lavenderRimLight);

    const softLimeFill = new THREE.DirectionalLight(0xf1ffc7, 1.15);
    softLimeFill.position.set(5, -3, 5);
    scene.add(softLimeFill);

    const innerLimeGlow = new THREE.PointLight(0xdfff43, 2.8, 12);
    innerLimeGlow.position.set(0.25, 0.75, 0.85);
    scene.add(innerLimeGlow);

    // Master parallax group
    const masterGroup = new THREE.Group();
    masterGroup.position.set(0, 0.05, 0);
    scene.add(masterGroup);

    // 1. Minimalist stacked rounded studio plinth + soft glowing #DFFF43 halo ring
    const plinthGroup = new THREE.Group();
    masterGroup.add(plinthGroup);

    const baseBottomGeo = new THREE.CylinderGeometry(2.45, 2.55, 0.22, 64);
    const baseBottomMat = new THREE.MeshStandardMaterial({
      color: 0xe9e6df,
      roughness: 0.52,
      metalness: 0.02,
    });
    const baseBottom = new THREE.Mesh(baseBottomGeo, baseBottomMat);
    baseBottom.position.y = -2.3;
    plinthGroup.add(baseBottom);

    const baseBottomRimGeo = new THREE.TorusGeometry(2.45, 0.055, 16, 64);
    const baseBottomRim = new THREE.Mesh(baseBottomRimGeo, baseBottomMat);
    baseBottomRim.rotation.x = Math.PI / 2;
    baseBottomRim.position.y = -2.21;
    plinthGroup.add(baseBottomRim);

    const baseTopGeo = new THREE.CylinderGeometry(1.98, 2.06, 0.18, 64);
    const baseTopMat = new THREE.MeshStandardMaterial({
      color: 0xf4f1ea,
      roughness: 0.38,
      metalness: 0.02,
    });
    const baseTop = new THREE.Mesh(baseTopGeo, baseTopMat);
    baseTop.position.y = -2.08;
    plinthGroup.add(baseTop);

    const baseTopRimGeo = new THREE.TorusGeometry(1.98, 0.05, 16, 64);
    const baseTopRim = new THREE.Mesh(baseTopRimGeo, baseTopMat);
    baseTopRim.rotation.x = Math.PI / 2;
    baseTopRim.position.y = -2.01;
    plinthGroup.add(baseTopRim);

    const haloTex = createHaloTexture();
    const haloDiscGeo = new THREE.CircleGeometry(1.88, 64);
    const haloDiscMat = new THREE.MeshBasicMaterial({
      map: haloTex ?? undefined,
      color: haloTex ? 0xffffff : 0xdfff43,
      transparent: true,
      opacity: haloTex ? 0.8 : 0.35,
      depthWrite: false,
    });
    const haloDisc = new THREE.Mesh(haloDiscGeo, haloDiscMat);
    haloDisc.rotation.x = -Math.PI / 2;
    haloDisc.position.y = -1.955;
    plinthGroup.add(haloDisc);

    const haloRingGeo = new THREE.RingGeometry(0.86, 1.24, 64);
    const haloRingMat = new THREE.MeshBasicMaterial({
      color: 0xdfff43,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const haloRing = new THREE.Mesh(haloRingGeo, haloRingMat);
    haloRing.rotation.x = -Math.PI / 2;
    haloRing.position.y = -1.95;
    plinthGroup.add(haloRing);

    // 2. Smooth beveled extruded "P" glass mesh + luminous #DFFF43 inner core rim
    const monumentGroup = new THREE.Group();
    monumentGroup.position.y = 0.16;
    masterGroup.add(monumentGroup);

    const { shape: pShape, hole: pHole } = createRoundedPShape();

    const pGeometry = new THREE.ExtrudeGeometry(pShape, {
      depth: 0.82,
      bevelEnabled: true,
      bevelSegments: 7,
      steps: 2,
      bevelSize: 0.11,
      bevelThickness: 0.13,
      curveSegments: 40,
    });
    pGeometry.computeBoundingBox();
    const geomCenter = new THREE.Vector3();
    pGeometry.boundingBox?.getCenter(geomCenter);
    pGeometry.translate(-geomCenter.x, -geomCenter.y, -geomCenter.z);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf6ffe4,
      metalness: 0.0,
      roughness: 0.08,
      transmission: 0.9,
      thickness: 1.5,
      ior: 1.48,
      reflectivity: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      attenuationColor: new THREE.Color(0xa6d94b),
      attenuationDistance: 2.4,
      sheen: 0.3,
      sheenColor: new THREE.Color(0xeae3ff),
      envMapIntensity: 1.2,
    });
    const glassMesh = new THREE.Mesh(pGeometry, glassMat);
    monumentGroup.add(glassMesh);

    const innerCoreGeo = new THREE.ExtrudeGeometry(pShape, {
      depth: 0.34,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.05,
      curveSegments: 32,
    });
    innerCoreGeo.translate(-geomCenter.x, -geomCenter.y, -0.17);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0xdfff43,
      emissive: 0xdfff43,
      emissiveIntensity: 0.85,
      roughness: 0.22,
      metalness: 0.05,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    innerCoreMesh.scale.set(0.86, 0.86, 0.85);
    monumentGroup.add(innerCoreMesh);

    // Luminous #DFFF43 inner rim tube tracing the inner portal loop
    const holePts2d = pHole.getPoints(48);
    holePts2d.pop();
    const holePts3d = holePts2d.map(
      (pt) => new THREE.Vector3(pt.x - geomCenter.x, pt.y - geomCenter.y, 0)
    );
    const holeCurve = new THREE.CatmullRomCurve3(holePts3d, true, "centripetal");
    const innerRimGeo = new THREE.TubeGeometry(holeCurve, 64, 0.032, 8, true);
    const innerRimMat = new THREE.MeshBasicMaterial({
      color: 0xdfff43,
    });
    const innerRimMesh = new THREE.Mesh(innerRimGeo, innerRimMat);
    monumentGroup.add(innerRimMesh);

    // 3. Two ultra-thin, delicate #A6D94B / #DFFF43 orbital ellipse rings
    const orbitalGroup = new THREE.Group();
    orbitalGroup.position.y = 0.08;
    masterGroup.add(orbitalGroup);

    const ring1Pivot = new THREE.Group();
    ring1Pivot.rotation.set(0.32, 0.14, -0.24);
    orbitalGroup.add(ring1Pivot);

    const ring1Geo = createEllipseTubeGeometry(2.68, 1.12, 0.016);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xdfff43,
      emissive: 0xdfff43,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Pivot.add(ring1Mesh);

    const ring2Pivot = new THREE.Group();
    ring2Pivot.rotation.set(-0.36, -0.18, 0.28);
    orbitalGroup.add(ring2Pivot);

    const ring2Geo = createEllipseTubeGeometry(2.96, 1.28, 0.014);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xa6d94b,
      emissive: 0xf1ffc7,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      transparent: true,
      opacity: 0.72,
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Pivot.add(ring2Mesh);

    // Delicate orbital pearls (#DFFF43 lime & #EAE3FF soft lavender highlight)
    const pearlGeo = new THREE.SphereGeometry(0.058, 16, 16);
    const pearl1Mat = new THREE.MeshBasicMaterial({ color: 0xdfff43 });
    const pearl2Mat = new THREE.MeshBasicMaterial({ color: 0xeae3ff });

    const pearl1 = new THREE.Mesh(pearlGeo, pearl1Mat);
    pearl1.position.set(2.68, 0, 0);
    ring1Pivot.add(pearl1);

    const pearl2 = new THREE.Mesh(pearlGeo, pearl2Mat);
    pearl2.position.set(-2.96, 0, 0);
    ring2Pivot.add(pearl2);

    // Motion state & reduced-motion media query
    const motionQuery =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    let prefersReducedMotion = Boolean(motionQuery?.matches);

    const mouse = { x: 0, y: 0 };
    let animationFrameId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();

    const applyPoseAndRender = (elapsedTime: number) => {
      if (isDisposed) return;

      const { targetX, targetY } = pointerState;

      if (prefersReducedMotion) {
        // Static studio angle + direct bounded pointer tilt (zero continuous idle motion)
        masterGroup.rotation.y = 0.16 + targetX * 0.2;
        masterGroup.rotation.x = -0.05 + targetY * 0.14;
        monumentGroup.position.y = 0.16;
        monumentGroup.rotation.y = 0;
        ring1Pivot.rotation.y = 0.14;
        ring2Pivot.rotation.y = -0.18;
        haloRingMat.opacity = 0.5;
      } else {
        mouse.x += (targetX - mouse.x) * 0.065;
        mouse.y += (targetY - mouse.y) * 0.065;

        masterGroup.rotation.y = 0.16 + mouse.x * 0.28;
        masterGroup.rotation.x = -0.05 + mouse.y * 0.18;

        // Subtle floating motion & gentle breathing
        monumentGroup.position.y = 0.16 + Math.sin(elapsedTime * 1.45) * 0.09;
        monumentGroup.rotation.y = Math.sin(elapsedTime * 0.72) * 0.08;
        haloRingMat.opacity = 0.44 + Math.sin(elapsedTime * 1.45) * 0.1;

        // Smooth orbital ellipse ring rotations
        ring1Pivot.rotation.y = 0.14 + elapsedTime * 0.24;
        ring2Pivot.rotation.y = -0.18 - elapsedTime * 0.18;

        // Subtle orbital pearl glide along the two ellipses
        const a1 = elapsedTime * 0.55;
        pearl1.position.set(Math.cos(a1) * 2.68, 0, Math.sin(a1) * 1.12);

        const a2 = -elapsedTime * 0.42 + Math.PI;
        pearl2.position.set(Math.cos(a2) * 2.96, 0, Math.sin(a2) * 1.28);
      }

      renderer.render(scene, camera);
    };

    const animate = () => {
      if (isDisposed || prefersReducedMotion) return;
      animationFrameId = requestAnimationFrame(animate);
      applyPoseAndRender(clock.getElapsedTime());
    };

    const scheduleSingleRender = () => {
      if (isDisposed) return;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        applyPoseAndRender(0);
      });
    };

    pointerState.onPointerUpdate = () => {
      if (prefersReducedMotion) {
        scheduleSingleRender();
      }
    };

    if (prefersReducedMotion) {
      applyPoseAndRender(0);
    } else {
      animate();
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
      if (prefersReducedMotion) {
        applyPoseAndRender(0);
      } else {
        clock.start();
        animate();
      }
    };

    if (motionQuery) {
      if (typeof motionQuery.addEventListener === "function") {
        motionQuery.addEventListener("change", handleMotionChange);
      } else if (typeof motionQuery.addListener === "function") {
        motionQuery.addListener(handleMotionChange);
      }
    }

    const handleResize = () => {
      if (isDisposed || !container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW <= 0 || newH <= 0) return;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      if (prefersReducedMotion) {
        applyPoseAndRender(0);
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      isDisposed = true;
      pointerState.onPointerUpdate = undefined;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
      if (motionQuery) {
        if (typeof motionQuery.removeEventListener === "function") {
          motionQuery.removeEventListener("change", handleMotionChange);
        } else if (typeof motionQuery.removeListener === "function") {
          motionQuery.removeListener(handleMotionChange);
        }
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      pGeometry.dispose();
      innerCoreGeo.dispose();
      innerRimGeo.dispose();
      glassMat.dispose();
      innerCoreMat.dispose();
      innerRimMat.dispose();
      baseBottomGeo.dispose();
      baseBottomRimGeo.dispose();
      baseBottomMat.dispose();
      baseTopGeo.dispose();
      baseTopRimGeo.dispose();
      baseTopMat.dispose();
      haloDiscGeo.dispose();
      haloDiscMat.dispose();
      haloTex?.dispose();
      haloRingGeo.dispose();
      haloRingMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      pearlGeo.dispose();
      pearl1Mat.dispose();
      pearl2Mat.dispose();
      envRenderTarget.dispose();
      renderer.dispose();
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = outerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    pointerStateRef.current.targetX = Math.max(-1, Math.min(1, nx));
    pointerStateRef.current.targetY = Math.max(-1, Math.min(1, ny));
    pointerStateRef.current.onPointerUpdate?.();

    if (!webglSupported) {
      const reduced =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        setFallbackTilt({ rx: -ny * 6, ry: nx * 8 });
      }
    }
  };

  const handlePointerLeave = () => {
    pointerStateRef.current.targetX = 0;
    pointerStateRef.current.targetY = 0;
    pointerStateRef.current.onPointerUpdate?.();
    if (!webglSupported) {
      setFallbackTilt({ rx: 0, ry: 0 });
    }
  };

  return (
    <div
      ref={outerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative h-full w-full min-h-[210px] flex items-center justify-center select-none ${className}`}
      aria-label="Interactive 3D Prospect lime-green glass P monument"
    >
      {/* Soft studio radial aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-44 w-44 rounded-full bg-[#F1FFC7]/75 blur-2xl" />
        <div className="absolute h-28 w-28 -translate-x-8 -translate-y-6 rounded-full bg-[#EAE3FF]/50 blur-2xl" />
      </div>

      {webglSupported ? (
        <div
          ref={canvasHostRef}
          className="relative h-full w-full min-h-[210px]"
        />
      ) : (
        /* Refined crisp SVG glassmorphic "P" monument fallback when WebGL is unavailable */
        <div
          className="relative flex h-full w-full min-h-[210px] items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: `perspective(600px) rotateX(${fallbackTilt.rx}deg) rotateY(${fallbackTilt.ry}deg)`,
          }}
        >
          <svg
            viewBox="0 0 280 230"
            className="relative w-full max-w-[260px] h-auto select-none drop-shadow-[0_14px_26px_rgba(166,217,75,0.2)]"
            role="img"
            aria-label="Prospect glassmorphic lime P monument"
          >
            <defs>
              <linearGradient id="wsPlinthBottom" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DFDCD3" />
                <stop offset="50%" stopColor="#E9E6DF" />
                <stop offset="100%" stopColor="#DBD7CE" />
              </linearGradient>
              <linearGradient id="wsPlinthTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FAF8F3" />
                <stop offset="100%" stopColor="#E9E6DF" />
              </linearGradient>
              <radialGradient id="wsHaloGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#DFFF43" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#F1FFC7" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#F1FFC7" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="wsPExtrude" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B8E756" stopOpacity="0.92" />
                <stop offset="55%" stopColor="#A6D94B" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#8EC438" stopOpacity="0.78" />
              </linearGradient>
              <linearGradient id="wsPGlass" x1="10%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor="#F1FFC7" stopOpacity="0.95" />
                <stop offset="48%" stopColor="#DFFF43" stopOpacity="0.82" />
                <stop offset="100%" stopColor="#A6D94B" stopOpacity="0.72" />
              </linearGradient>
              <linearGradient id="wsPLavenderRim" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EAE3FF" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F1FFC7" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="wsGlassSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
              <clipPath id="wsPClip">
                <path
                  fillRule="evenodd"
                  d="M95 36 H148 C184 36 205 56 205 86 C205 116 184 136 148 136 H125 V176 C125 182 120 187 114 187 H95 C89 187 84 182 84 176 V47 C84 41 89 36 95 36 Z M125 65 V107 H145 C161 107 171 99 171 86 C171 73 161 65 145 65 H125 Z"
                />
              </clipPath>
            </defs>

            {/* Stacked warm ivory studio plinth */}
            <path
              d="M58 190 C58 201 96 209 144 209 C192 209 230 201 230 190 V199 C230 210 192 218 144 218 C96 218 58 210 58 199 Z"
              fill="url(#wsPlinthBottom)"
            />
            <ellipse
              cx="144"
              cy="190"
              rx="86"
              ry="18"
              fill="#F4F1EA"
              stroke="#E9E6DF"
              strokeWidth="1"
            />
            <path
              d="M72 178 C72 187 104 194 144 194 C184 194 216 187 216 178 V186 C216 195 184 202 144 202 C104 202 72 195 72 186 Z"
              fill="#E9E6DF"
            />
            <ellipse
              cx="144"
              cy="178"
              rx="72"
              ry="15"
              fill="url(#wsPlinthTop)"
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />

            {/* Soft glowing #DFFF43 halo ring underneath */}
            <ellipse cx="144" cy="178" rx="54" ry="11" fill="url(#wsHaloGlow)" />

            {/* Back half of two delicate orbital ellipse rings */}
            <g transform="rotate(-14 144 112)">
              <path
                d="M44 112 A100 32 0 0 1 244 112"
                fill="none"
                stroke="#A6D94B"
                strokeWidth="1.4"
                opacity="0.55"
              />
            </g>
            <g transform="rotate(15 144 114)">
              <path
                d="M36 114 A108 35 0 0 1 252 114"
                fill="none"
                stroke="#DFFF43"
                strokeWidth="1.4"
                opacity="0.65"
              />
            </g>

            {/* Extruded 3D depth body */}
            <path
              transform="translate(9, 5)"
              fillRule="evenodd"
              d="M95 36 H148 C184 36 205 56 205 86 C205 116 184 136 148 136 H125 V176 C125 182 120 187 114 187 H95 C89 187 84 182 84 176 V47 C84 41 89 36 95 36 Z M125 65 V107 H145 C161 107 171 99 171 86 C171 73 161 65 145 65 H125 Z"
              fill="url(#wsPExtrude)"
            />

            {/* Translucent lime glass front face */}
            <path
              fillRule="evenodd"
              d="M95 36 H148 C184 36 205 56 205 86 C205 116 184 136 148 136 H125 V176 C125 182 120 187 114 187 H95 C89 187 84 182 84 176 V47 C84 41 89 36 95 36 Z M125 65 V107 H145 C161 107 171 99 171 86 C171 73 161 65 145 65 H125 Z"
              fill="url(#wsPGlass)"
              stroke="url(#wsPLavenderRim)"
              strokeWidth="1.6"
            />

            {/* Luminous #DFFF43 inner core rim + specular sheen */}
            <g clipPath="url(#wsPClip)">
              <polygon
                points="70,28 164,28 116,154 68,130"
                fill="url(#wsGlassSheen)"
              />
              <path
                d="M122 61 H146 C165 61 176 71 176 86 C176 101 165 111 146 111 H122 V61 Z"
                fill="none"
                stroke="#DFFF43"
                strokeWidth="3"
                opacity="0.9"
              />
            </g>

            {/* Front half of orbital ellipse rings + pearls */}
            <g transform="rotate(-14 144 112)">
              <path
                d="M44 112 A100 32 0 0 0 244 112"
                fill="none"
                stroke="#A6D94B"
                strokeWidth="1.5"
                opacity="0.75"
              />
              <circle cx="222" cy="131" r="3.8" fill="#DFFF43" stroke="#FFFFFF" strokeWidth="1.2" />
            </g>
            <g transform="rotate(15 144 114)">
              <path
                d="M36 114 A108 35 0 0 0 252 114"
                fill="none"
                stroke="#DFFF43"
                strokeWidth="1.5"
                opacity="0.85"
              />
              <circle cx="64" cy="136" r="3.5" fill="#EAE3FF" stroke="#FFFFFF" strokeWidth="1.2" />
            </g>
          </svg>
        </div>
      )}

      {/* 3 sleek glassmorphic illustrative category pills */}
      <div className="pointer-events-none absolute inset-0">
        {CATEGORY_PILLS.map((pill) => (
          <button
            key={pill.category}
            type="button"
            onClick={() => onSelectCategory?.(pill.category)}
            className={`pointer-events-auto absolute ${pill.positionClass} inline-flex items-center gap-1.5 rounded-full border border-[#E9E6DF] bg-white/[0.88] backdrop-blur-md pl-1.5 pr-3 py-1.5 shadow-[0_8px_22px_rgba(17,17,17,0.06)] hover:shadow-[0_12px_26px_rgba(17,17,17,0.1)] hover:border-[#DFFF43] hover:-translate-y-0.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A6D94B]`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#F1FFC7] to-[#DFFF43] text-[#111111]">
              {pill.icon === "briefcase" && <Briefcase className="h-3 w-3" />}
              {pill.icon === "graduation" && <GraduationCap className="h-3 w-3" />}
              {pill.icon === "layers" && <Layers className="h-3 w-3" />}
            </span>
            <span className="text-[11px] font-semibold tracking-tight text-[#111111]">
              {pill.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Prospect3DVisual;
