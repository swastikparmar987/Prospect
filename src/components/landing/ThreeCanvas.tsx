"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface ThreeCanvasProps {
  scrollProgress?: number;
}

export function ThreeCanvas({ scrollProgress = 0 }: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number>(scrollProgress);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Keep scrollRef updated without re-initializing WebGL
  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setIsSupported(false);
        return;
      }
    } catch {
      setIsSupported(false);
      return;
    }

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfdf9f3, 0.018);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 24);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xe0fb66, 2.5); // Lime accent light
    dirLight1.position.set(20, 20, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xfef189, 1.8); // Saffron accent light
    dirLight2.position.set(-20, -10, -10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x080808, 2, 50);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    // --- Central Career Galaxy Group ---
    const galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);

    // 1. Core Polyhedron (The AI Intelligence Engine)
    const coreGeo = new THREE.IcosahedronGeometry(3.2, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    galaxyGroup.add(coreMesh);

    // Core Wireframe Halo
    const coreWireGeo = new THREE.IcosahedronGeometry(3.4, 1);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: 0xe0fb66,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const coreWireMesh = new THREE.Mesh(coreWireGeo, coreWireMat);
    galaxyGroup.add(coreWireMesh);

    // 2. Orbital Rings (Decision Spheres)
    const ringGeo1 = new THREE.TorusGeometry(6.2, 0.04, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x080808,
      transparent: true,
      opacity: 0.25,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    galaxyGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(9.4, 0.05, 16, 120);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xe0fb66,
      transparent: true,
      opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 4;
    galaxyGroup.add(ring2);

    const ringGeo3 = new THREE.TorusGeometry(12.8, 0.04, 16, 140);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0x163824,
      transparent: true,
      opacity: 0.35,
    });
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
    ring3.rotation.y = Math.PI / 2.5;
    galaxyGroup.add(ring3);

    // 3. Floating Node Satellites (Roles & Opportunities)
    const satelliteNodes: THREE.Mesh[] = [];
    const nodeCount = 14;
    const nodeGeometries = [
      new THREE.OctahedronGeometry(0.8, 0),
      new THREE.DodecahedronGeometry(0.7, 0),
      new THREE.TetrahedronGeometry(0.9, 0),
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
    ];

    const nodeColors = [0xe0fb66, 0xfef189, 0x080808, 0x163824, 0xffffff];

    for (let i = 0; i < nodeCount; i++) {
      const geo = nodeGeometries[i % nodeGeometries.length];
      const color = nodeColors[i % nodeColors.length];
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);

      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 6.5 + (i % 3) * 2.8;
      const height = (Math.sin(i * 1.5) * 3.5);

      mesh.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );

      // Random initial rotation
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;

      galaxyGroup.add(mesh);
      satelliteNodes.push(mesh);
    }

    // 4. Ambient Constellation Particles (Skills & Signals)
    const particleCount = 600;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorLime = new THREE.Color(0xe0fb66);
    const colorDark = new THREE.Color(0x080808);
    const colorSaffron = new THREE.Color(0xfef189);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const radius = 5 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[idx] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[idx + 2] = radius * Math.cos(phi);

      const chosenColor = i % 3 === 0 ? colorLime : i % 3 === 1 ? colorSaffron : colorDark;
      particleColors[idx] = chosenColor.r;
      particleColors[idx + 1] = chosenColor.g;
      particleColors[idx + 2] = chosenColor.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- Interactive Mouse Listener ---
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 2;
      mouseRef.current.targetY = -(e.clientY / innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // --- Resize Observer ---
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // --- Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const scroll = scrollRef.current;

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Base rotation
      galaxyGroup.rotation.y = elapsedTime * 0.15 + scroll * Math.PI * 1.5;
      galaxyGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.1 + mouseRef.current.y * 0.25;
      galaxyGroup.rotation.z = mouseRef.current.x * 0.2;

      // Core pulsating effect
      const coreScale = 1 + Math.sin(elapsedTime * 1.8) * 0.04;
      coreMesh.scale.set(coreScale, coreScale, coreScale);
      coreWireMesh.scale.set(coreScale * 1.05, coreScale * 1.05, coreScale * 1.05);
      coreMesh.rotation.y = elapsedTime * 0.3;
      coreWireMesh.rotation.y = -elapsedTime * 0.2;

      // Rotate orbital rings
      ring1.rotation.z = elapsedTime * 0.25;
      ring2.rotation.x = -Math.PI / 4 + elapsedTime * 0.15;
      ring3.rotation.y = Math.PI / 2.5 + Math.sin(elapsedTime * 0.3) * 0.2;

      // Animate floating satellites
      satelliteNodes.forEach((node, i) => {
        node.rotation.x += 0.015 * (i % 2 === 0 ? 1 : -1);
        node.rotation.y += 0.02 * (i % 3 === 0 ? 1 : -1);
        node.position.y += Math.sin(elapsedTime * 2 + i) * 0.008;
      });

      // Slowly rotate particle field
      particles.rotation.y = -elapsedTime * 0.04;
      particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.1;

      // Dynamic Camera Travel on Scroll
      // Swoop from overview (Z=24) -> close focus (Z=14) -> elevated angle
      const targetCameraZ = 24 - scroll * 16;
      const targetCameraY = Math.sin(scroll * Math.PI) * 5 + mouseRef.current.y * 1.5;
      const targetCameraX = Math.cos(scroll * Math.PI * 1.2) * 4 + mouseRef.current.x * 2.5;

      camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
      camera.position.y += (targetCameraY - camera.position.y) * 0.08;
      camera.position.x += (targetCameraX - camera.position.x) * 0.08;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose 3D resources cleanly
      coreGeo.dispose();
      coreMat.dispose();
      coreWireGeo.dispose();
      coreWireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      ringGeo3.dispose();
      ringMat3.dispose();
      nodeGeometries.forEach((g) => g.dispose());
      particleGeo.dispose();
      particleMat.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  if (!isSupported) {
    // Graceful fallback for non-WebGL environments
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#E0FB66] blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-[#FEF189] blur-3xl" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700"
      aria-hidden="true"
    />
  );
}

