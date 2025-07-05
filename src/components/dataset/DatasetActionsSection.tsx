"use client";

import { Button } from "@/components/ui/button";
import { DatasetObject } from "@/lib/types";
import { Download, Coins, Loader2 } from "lucide-react";
import { MIST_PER_USDC } from "@/lib/constants";
import BuyDatasetButton from "@/components/BuyDatasetButton";
import { Address } from "viem";

interface DatasetActionsSectionProps {
  dataset: DatasetObject;
  currentAccount: string | undefined;
  hasAccess: boolean;
  isLoading: boolean;
  isProcessingTx: boolean;
  parsedData: any[] | null;
  handleDownload: () => void;
  marketAddress: Address;
}

export function DatasetActionsSection({
  dataset,
  currentAccount,
  hasAccess,
  isLoading,
  isProcessingTx,
  parsedData,
  handleDownload,
  marketAddress,
}: DatasetActionsSectionProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Buy Dataset Button */}
      {currentAccount && !hasAccess && dataset && dataset.price > 0 && dataset.visibility.inner === 0 && (
        <BuyDatasetButton
          marketAddress={marketAddress}
          datasetId={BigInt(dataset.id)}
          price={BigInt(dataset.price)}
          disabled={isLoading || isProcessingTx}
        />
      )}
      
      {/* Download Button */}
      {parsedData && currentAccount && (
        <Button 
          onClick={handleDownload} 
          variant="default" 
          title="Download Decrypted Dataset as JSON" 
          disabled={isLoading || isProcessingTx}
        >
          <Download size={18} className="mr-2" /> 
          Download
        </Button>
      )}
    </div>
  );
}