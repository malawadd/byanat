"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { Address, parseUnits } from "viem";
import { Loader2, Coins } from "lucide-react";
import { toast } from "sonner";
import { CALIBRATION_MOCK_TOKEN_ADDRESS } from "@/lib/constants";
import mockTokenAbi from "@/lib/mockTokenAbi.json";

interface Props {
  disabled?: boolean;
}

export default function MintTestTokenButton({ disabled }: Props) {
  const [isMinting, setIsMinting] = useState(false);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Read the user's current balance of test tokens
  const { data: balance, refetch: refetchBalance } = useReadContract({
    abi: mockTokenAbi,
    address: CALIBRATION_MOCK_TOKEN_ADDRESS as Address,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(address) },
  });

  // Hide button if user has more than 10 test tokens (with 6 decimals)
  const threshold = parseUnits("10", 6);
  const shouldHideButton = balance && BigInt(balance.toString()) > threshold;

  const handleMint = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsMinting(true);
    try {
      // Mint 1000 test tokens (with 6 decimals like USDC)
      const amount = parseUnits("1000", 6);
      
      const hash = await writeContractAsync({
        abi: mockTokenAbi,
        address: CALIBRATION_MOCK_TOKEN_ADDRESS as Address,
        functionName: "mint",
        args: [amount],
      });

      // Wait for transaction confirmation
      await publicClient!.waitForTransactionReceipt({ hash });

      // Refetch balance to update the UI
      refetchBalance();

      toast.success("Test tokens minted successfully!", {
        description: "1000 test USDC tokens have been added to your wallet."
      });
    } catch (error: any) {
      console.error("Minting failed:", error);
      toast.error(`Minting failed: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  // Don't render the button if user has sufficient balance
  if (shouldHideButton) {
    return null;
  }

  return (
    <Button 
      onClick={handleMint} 
      disabled={disabled || isMinting || !address}
      variant="outline"
      className="w-full border-neon-yellow text-neon-yellow hover:bg-neon-yellow/10 command-text"
    >
      {isMinting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          MINTING...
        </>
      ) : (
        <>
          <Coins className="mr-2 h-4 w-4" />
          MINT TEST TOKENS
        </>
      )}
    </Button>
  );
}