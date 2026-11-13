import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospect — Career Intelligence & Discovery Agent",
  description:
    "AI-powered career opportunity discovery, personalized matching, geolocation intelligence, and structured preparation built for students and early-career engineers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FDF9F3] text-[#080808] antialiased">
        {children}
      </body>
    </html>
  );
}
