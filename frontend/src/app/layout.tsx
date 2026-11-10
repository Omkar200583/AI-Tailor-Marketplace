import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "@/components/shared/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Tailor — Design with AI, Stitch with Local Tailors",
  description:
    "India's AI-powered custom tailoring marketplace. Describe your outfit, generate designs with AI, try them on virtually, and get them stitched by verified tailors near you.",
  keywords: ["AI Tailor", "custom tailoring", "virtual try-on", "AI fashion design", "nearby tailors", "custom stitching", "Pune tailors"],
  authors: [{ name: "AI Tailor" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AI Tailor — Stitch Your Imagination",
    description: "AI design studio + virtual try-on + verified local tailors.",
    siteName: "AI Tailor",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppProviders>{children}</AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
