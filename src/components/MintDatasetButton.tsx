"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDatasetMarketplace, MintDatasetParams } from "@/hooks/useDatasetMarketplace";
import { Address, parseUnits } from "viem";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  marketAddress: Address;
  params: Omit<MintDatasetParams, 'priceUSDC'> & { price: number };
  onMinted?: (datasetId: bigint) => void;
  disabled?: boolean;
}

export default function MintDatasetButton({ 
  marketAddress, 
  params, 
  onMinted, 
  disabled 
}: Props) {
  const [isMinting, setIsMinting] = useState(false);
  const { mintDataset, address } = useDatasetMarketplace(marketAddress);

  const handleMint = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsMinting(true);
    try {
      const mintParams: MintDatasetParams = {
        ...params,
        priceUSDC: parseUnits(params.price.toString(), 6), // Convert to USDC units
      };

      const datasetId = await mintDataset(mintParams);
      toast.success("Dataset minted successfully!");
      onMinted?.(datasetId);
    } catch (error: any) {
      console.error("Minting failed:", error);
      toast.error(`Minting failed: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Button 
      onClick={handleMint} 
      disabled={disabled || isMinting || !address}
      className="w-full"
    >
      {isMinting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Minting Dataset...
        </>
      ) : (
        "Mint Dataset"
      )}
    </Button>
  );
}