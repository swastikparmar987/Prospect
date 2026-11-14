"use client";

import React from "react";
import { FileText, Search, Layers, BarChart3 } from "lucide-react";

interface FeatureStripProps {
  onFeatureClick?: (featureId: string) => void;
}

export function FeatureStrip({ onFeatureClick }: FeatureStripProps) {
  const features = [
    {
      id: "resume-intelligence",
      title: "Resume intelligence",
      icon: FileText,
      tab: "profile",
    },
    {
      id: "smart-discovery",
      title: "Smart role discovery",
      icon: Search,
      tab: "discover",
    },
    {
      id: "explainable-matching",
      title: "Explainable matching",
      icon: Layers,
      tab: "outlook",
    },
    {
      id: "skill-gap-insights",
      title: "Skill-gap insights",
      icon: BarChart3,
      tab: "prep",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-6 md:my-10">
      <div className="bg-[#FDF9F3] border-2 border-[#080808] rounded-2xl md:rounded-full p-2.5 md:p-3 shadow-[4px_4px_0px_#080808] transition-all">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[#080808]/15">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onFeatureClick?.(item.tab)}
                className="group flex items-center justify-center gap-3 p-3 sm:px-4 text-left transition-all duration-200 hover:bg-white/80 rounded-xl"
              >
                <div className="w-9 h-9 rounded-xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#080808] group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4 text-[#080808] stroke-[2.4]" />
                </div>
                <span className="font-heading font-bold text-sm sm:text-base text-[#080808] group-hover:text-black tracking-tight whitespace-nowrap">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
