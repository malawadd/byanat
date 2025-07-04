import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

import "@/app/globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import Context from "./context";
import Header from "@/components/header";
import { Orbitron, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";

const orbitron = Orbitron({ 
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BAYANAT - Neural Data Forge",
  description: "Advanced synthetic data generation on the blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${orbitron.variable} ${jetbrainsMono.variable} font-sans`}>
        <Context>
          <Header />
          <main className="min-h-screen  relative">
            {children}
          </main>
          <Toaster />
          <Analytics />
        </Context>
      </body>
    </html>
  );
}