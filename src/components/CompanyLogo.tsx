"use client";

import React, { useState } from "react";
import { getTheSvgLogo, getTheSvgCdnUrl } from "@/lib/thesvg-logos";

interface CompanyLogoProps {
  name: string;
  className?: string;
  size?: number;
}

/**
 * CompanyLogo
 * Sourced from theSVG (https://thesvg.org / https://github.com/glincker/thesvg)
 * 7,600+ brand vector SVGs with instant local registry + dynamic CDN fallback
 */
export function CompanyLogo({ name, className = "h-10 w-10", size = 40 }: CompanyLogoProps) {
  const [cdnFailed, setCdnFailed] = useState(false);

  // 1. Direct registry lookup from theSVG (glincker/thesvg)
  const registryLogo = getTheSvgLogo(name);
  if (registryLogo) {
    const cardClass = registryLogo.isCustomCard && registryLogo.cardBg
      ? `${registryLogo.cardBg} border-2 border-[#080808]`
      : "bg-white border-2 border-[#080808] text-[#080808]";

    return (
      <div
        className={`flex items-center justify-center rounded-xl p-2 shrink-0 ${cardClass} ${className}`}
        style={{
          width: size,
          height: size,
          ...(registryLogo.isCustomCard && registryLogo.hex
            ? { backgroundColor: `#${registryLogo.hex}` }
            : {}),
        }}
      >
        <div
          className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
          dangerouslySetInnerHTML={{ __html: registryLogo.svg }}
        />
      </div>
    );
  }

  // 2. Dynamic CDN lookup from theSVG repository CDN (https://thesvg.org / glincker/thesvg)
  if (!cdnFailed && name) {
    const cdnUrl = getTheSvgCdnUrl(name);
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-white border-2 border-[#080808] p-2 shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={cdnUrl}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setCdnFailed(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Fallback: Clean Neo-Brutalist letter initials monogram
  const initials = (name || "Co")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-[#FEF189] border-2 border-[#080808] font-extrabold text-xs text-[#080808] shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
