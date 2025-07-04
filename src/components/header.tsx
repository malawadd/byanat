"use client";

import Link from "next/link";
import Image from "next/image";
import Name from "@/components/name";
import Avatar from "@/components/avatar";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CustomConnectButton } from '@/components/ui/custom-connect-button';
import { useAccount, useDisconnect } from 'wagmi';
import { Terminal, Zap, Database, User, LogOut } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isCreating, setIsCreating] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    setIsCreating(pathname.includes("create"));
  }, [pathname]);

  useEffect(() => {
    if (isConnected) {
      setIsPopoverOpen(false);
    }
  }, [isConnected]);

  const handleDisconnect = () => {
    disconnect();
    setIsPopoverOpen(false);
  };

  const handleGoToMyPage = () => {
    setIsPopoverOpen(false);
    if (address) {
      router.push(`/user/${address}`);
    }
  };

  const resolveNameServiceNames = useCallback(async (address: string) => {
    return "";
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full bg-black/90 backdrop-blur-md border-b border-neon-green/30">
      <div className="hud-panel">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-8 h-8 bg-neon-green/20 rounded border border-neon-green flex items-center justify-center">
                  <Database className="w-5 h-5 text-neon-green" />
                </div>
                <div className="absolute inset-0 bg-neon-green/10 rounded animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold neon-text text-neon-green tracking-wider">
                  BAYANAT
                </h1>
                <span className="text-xs command-text text-neon-cyan opacity-70">
                  NEURAL.NETWORK.ACTIVE
                </span>
              </div>
            </Link>
            
            {/* Status Indicators */}
            <div className="hidden md:flex items-center gap-4 ml-6">
              <div className="flex items-center gap-2">
                <div className="status-indicator"></div>
                <span className="command-text text-xs text-neon-green">SYSTEM.ONLINE</span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neon-cyan" />
                <span className="command-text text-xs text-neon-cyan">TERMINAL.READY</span>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4">
            {!isCreating && (
              <Button 
                variant="outline" 
                onClick={() => router.push("/create")}
                className="wireframe bg-transparent border-neon-magenta text-neon-magenta hover:bg-neon-magenta/10 hover:text-neon-magenta command-text"
              >
                <Zap className="w-4 h-4 mr-2" />
                INITIALIZE.CREATION
              </Button>
            )}
            
            <CustomConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}