import type { Metadata } from "next";
import '@rainbow-me/rainbowkit/styles.css';
import { Analytics } from "@vercel/analytics/next";

import "@/app/globals.css";
import Context from "./context";
import Header from "@/components/header";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bayanat",
  description: "Generated synthetic data on the Filecoin blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Context>
          <div className="min-h-[8vh] flex flex-col justify-center items-center">
            <Header />
          </div>
          <Separator />
          <main className="min-h-[92vh] bg-background">
            {children}
          </main>
          <Toaster />
          <Analytics />
        </Context>
      </body>
    </html>
  );
}