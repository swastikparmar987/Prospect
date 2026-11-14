"use client";

import React from "react";
import Link from "next/link";
import { ProspectLogo } from "./ProspectLogo";

interface ProspectFooterProps {
  onNavTab?: (tab: string) => void;
}

export function ProspectFooter({ onNavTab }: ProspectFooterProps) {
  return (
    <footer className="w-full bg-[#FDF9F3] border-t-2 border-[#080808]/15 mt-16 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Link
              href="/"
              onClick={(e) => {
                if (onNavTab) {
                  e.preventDefault();
                  onNavTab("landing");
                }
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2.5 cursor-pointer group w-fit"
              aria-label="Prospect Landing Page"
            >
              <ProspectLogo size={28} />
              <span className="font-heading font-black text-xl text-[#080808] tracking-tight group-hover:opacity-90 transition-opacity">
                Prospect
              </span>
            </Link>
            <p className="text-xs text-[#666666] font-body leading-relaxed">
              AI-powered Career Intelligence and Opportunity Discovery Platform. Understand your
              strengths, discover roles that fit, and build the career you want.
            </p>
            <div className="text-[11px] font-technical text-[#888888]">
              Built with precision for students & ambitious builders.
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-heading font-extrabold text-xs uppercase tracking-wider text-[#080808]">
              Product Workspace
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#555555]">
              <li>
                <button
                  onClick={() => onNavTab?.("discover")}
                  className="hover:text-[#080808] hover:underline transition-colors"
                >
                  Opportunity Discovery
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavTab?.("profile")}
                  className="hover:text-[#080808] hover:underline transition-colors"
                >
                  Resume & Skill Parsing
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavTab?.("outlook")}
                  className="hover:text-[#080808] hover:underline transition-colors"
                >
                  Career Directions Outlook
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavTab?.("prep")}
                  className="hover:text-[#080808] hover:underline transition-colors"
                >
                  Preparation Studio
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavTab?.("tracker")}
                  className="hover:text-[#080808] hover:underline transition-colors"
                >
                  Application Tracker
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Standards */}
          <div className="space-y-3">
            <h4 className="font-heading font-extrabold text-xs uppercase tracking-wider text-[#080808]">
              Platform
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#555555]">
              <li>
                <a href="#how-it-works" className="hover:text-[#080808] hover:underline transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#080808] hover:underline transition-colors">
                  Seniority Shield Standard
                </a>
              </li>
              <li>
                <a href="#product-preview" className="hover:text-[#080808] hover:underline transition-colors">
                  System Architecture
                </a>
              </li>
              <li>
                <a href="mailto:support@prospect.career" className="hover:text-[#080808] hover:underline transition-colors">
                  Contact & Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-heading font-extrabold text-xs uppercase tracking-wider text-[#080808]">
              Trust & Transparency
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#555555]">
              <li>
                <span className="text-[#666666]">Privacy Policy</span>
              </li>
              <li>
                <span className="text-[#666666]">Terms of Service</span>
              </li>
              <li>
                <span className="text-[#666666]">Data Security & No-Resell Guarantee</span>
              </li>
              <li>
                <span className="text-[#777777] text-[11px]">Illustrative preview demonstration</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-technical text-[#777777]">
          <div>© {new Date().getFullYear()} Prospect. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Powered by Next.js & PostgreSQL</span>
            <span>•</span>
            <span className="text-[#080808] font-bold">Never settles for noise.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
