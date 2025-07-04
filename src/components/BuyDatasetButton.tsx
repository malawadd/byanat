"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDatasetMarketplace } from "@/hooks/useDatasetMarketplace";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { Address, zeroAddress } from "viem";
import { Loader2, Coins } from "lucide-react";
import { toast } from "sonner";
import { MIST_PER_USDC } from "@/lib/constants";

// Minimal ERC-20 ABI for approve and allowance
const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

interface Props {
  marketAddress: Address;
  datasetId: bigint;
  price: bigint;
  onPurchased?: () => void;
  disabled?: boolean;
}

export default function BuyDatasetButton({ 
  marketAddress, 
  datasetId, 
  price, 
  onPurchased, 
  disabled 
}: Props) {
  const [isBuying, setIsBuying] = useState(false);
  const [stage, setStage] = useState<string>("");
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { downloadDataset, address, useGetUsdcAddress } = useDatasetMarketplace(marketAddress);

  // Get USDC contract address
  const { data: usdcAddress } = useGetUsdcAddress();

  // Check current allowance
  const { data: allowanceData } = useReadContract({
    abi: erc20Abi,
    address: usdcAddress as Address | undefined,
    functionName: "allowance",
    args: [address ?? zeroAddress, marketAddress],
    query: { enabled: Boolean(address && usdcAddress) },
  });

  const allowance: bigint = (allowanceData as bigint | undefined) ?? BigInt(0);
  const needsApproval = allowance < price;

  const handleBuy = async () => {
    if (!address || !usdcAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsBuying(true);
    try {
      // Step 1: Approve USDC if needed
      if (needsApproval) {
        setStage("Approving USDC...");
        const approveHash = await writeContractAsync({
          abi: erc20Abi,
          address: usdcAddress as Address,
          functionName: "approve",
          args: [marketAddress, price],
        });
        await publicClient!.waitForTransactionReceipt({ hash: approveHash });
      }

      // Step 2: Purchase dataset access
      setStage("Purchasing access...");
      await downloadDataset(datasetId);

      toast.success("Dataset access purchased successfully!");
      onPurchased?.();
    } catch (error: any) {
      console.error("Purchase failed:", error);
      toast.error(`Purchase failed: ${error.message}`);
    } finally {
      setIsBuying(false);
      setStage("");
    }
  };

  const buttonText = isBuying 
    ? stage || "Processing..."
    : needsApproval 
    ? "Approve & Buy"
    : "Buy Dataset";

  return (
    <Button 
      onClick={handleBuy} 
      disabled={disabled || isBuying || !address || price === BigInt(0)}
      className="bg-[#6750A4] hover:bg-[#6750A4]/90"
    >
      {isBuying ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {buttonText}
        </>
      ) : (
        <>
          <Coins className="mr-2 h-4 w-4" />
          {buttonText} ({(Number(price) / MIST_PER_USDC).toFixed(2)} USDC)
        </>
      )}
    </Button>
  );
}