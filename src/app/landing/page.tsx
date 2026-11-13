import { Metadata } from "next";
import { LandingExperience } from "@/components/landing/LandingExperience";

export const metadata: Metadata = {
  title: "Prospect — Understand Your Strengths. Discover Your Direction.",
  description:
    "An evidence-backed career opportunity discovery and decision agent for college students, new grads, and aspiring researchers with 4-way decision intelligence and 3D career exploration.",
};

export default function LandingPage() {
  return <LandingExperience />;
}
