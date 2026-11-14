"use client";

import React from "react";

interface ProspectLogoProps {
  className?: string;
  size?: number;
}

export function ProspectLogo({ className = "", size = 32 }: ProspectLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Isometric / Geometric P Outer Shape with 2px Black Border */}
        {/* Left vertical pillar */}
        <path
          d="M8 8C8 6.89543 8.89543 6 10 6H24C29.5228 6 34 10.4772 34 16C34 21.5228 29.5228 26 24 26H16V34C16 35.1046 15.1046 36 14 36H10C8.89543 36 8 35.1046 8 34V8Z"
          fill="#E0FB66"
          stroke="#080808"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Inner Window / Portal Opening */}
        <path
          d="M16 12H23C25.2091 12 27 13.7909 27 16C27 18.2091 25.2091 20 23 20H16V12Z"
          fill="#FDF9F3"
          stroke="#080808"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Subtle geometric isometric facet line for 3D depth */}
        <path
          d="M8 8L14 12V36L8 32V8Z"
          fill="#080808"
          opacity="0.12"
        />
      </svg>
    </div>
  );
}
