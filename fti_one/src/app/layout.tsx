import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/component/navbar";
import FooterSwitcher from "@/component/FooterSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DPM FTI",
  description: "Platform DPM FTI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main style={{ paddingTop: "62px", flex: 1 }}>
          {children}
        </main>
        <FooterSwitcher />
      </body>
    </html>
  );
}