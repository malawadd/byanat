"use client";

import Link from "next/link";
import Image from "next/image";
import Name from "@/components/name";
import Avatar from "@/components/avatar";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

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
    // ENS resolution can be implemented here for Ethereum-based chains
    // For now, return empty string as placeholder
    return "";
  }, []);

  return (
    <header className="top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Bayanat Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
            <h1 className="text-xl font-bold">Bayanat</h1>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-4">
          {!isCreating && (
            <Button variant="outline" onClick={() => router.push("/create")}>
              Create
            </Button>
          )}
          {isConnected && address ? (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
                <Button variant="outline">
                  <div className="flex items-center space-x-2">
                    <Avatar address={address} />
                    <Name address={address} resolveNameServiceNames={resolveNameServiceNames} />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 mt-1">
                <div className="grid gap-1">
                  <Button variant="ghost" onClick={handleGoToMyPage} className="justify-start px-3 py-1.5">
                    My Page
                  </Button>
                  <Button variant="ghost" onClick={handleDisconnect} className="justify-start px-3 py-1.5">
                    Disconnect
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <ConnectButton />
          )}
        </div>
      </div>
    </header>
  );
}