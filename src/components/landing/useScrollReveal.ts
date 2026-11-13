"use client";

import { useEffect } from "react";

/**
 * Custom hook to attach an IntersectionObserver to elements matching `.reveal-init`,
 * `.reveal-left-init`, `.reveal-right-init`, or `.reveal-scale-init`.
 * When an element enters the viewport, it triggers its smooth GPU-accelerated entrance animation.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      // Fallback: reveal everything immediately if IntersectionObserver is unavailable
      const elements = document.querySelectorAll(
        ".reveal-init, .reveal-left-init, .reveal-right-init, .reveal-scale-init"
      );
      elements.forEach((el) => {
        el.classList.add("reveal-active", "reveal-left-active", "reveal-right-active", "reveal-scale-active");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.classList.contains("reveal-init")) {
              target.classList.add("reveal-active");
            }
            if (target.classList.contains("reveal-left-init")) {
              target.classList.add("reveal-left-active");
            }
            if (target.classList.contains("reveal-right-init")) {
              target.classList.add("reveal-right-active");
            }
            if (target.classList.contains("reveal-scale-init")) {
              target.classList.add("reveal-scale-active");
            }
            // Once revealed, unobserve to keep hardware resources light
            observer.unobserve(target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const elements = document.querySelectorAll(
      ".reveal-init, .reveal-left-init, .reveal-right-init, .reveal-scale-init"
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);
}

