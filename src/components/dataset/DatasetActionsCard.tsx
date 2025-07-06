"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatasetObject } from "@/lib/types";
import { Download, Coins, Loader2 } from "lucide-react";
import { MIST_PER_USDC } from "@/lib/constants";
import BuyDatasetButton from "@/components/BuyDatasetButton";
import MintTestTokenButton from "@/components/MintTestTokenButton";
import { Address } from "viem";

interface DatasetActionsCardProps {
  dataset: DatasetObject;
  currentAccount: string | undefined;
  hasAccess: boolean;
  isLoading: boolean;
  isProcessingTx: boolean;
  parsedData: any[] | null;
  handleDownload: () => void;
  marketAddress: Address;
}

export function DatasetActionsCard({
  dataset,
  currentAccount,
  hasAccess,
  isLoading,
  isProcessingTx,
  parsedData,
  handleDownload,
  marketAddress,
}: DatasetActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mint Test Tokens Button */}
        {currentAccount && (
          <MintTestTokenButton disabled={isLoading || isProcessingTx} />
        )}
        
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
            className="w-full"
          >
            <Download size={18} className="mr-2" /> 
            Download Dataset
          </Button>
        )}
        
        {/* Access Status */}
        {currentAccount && !hasAccess && dataset.price === 0 && (
          <div className="text-sm text-muted-foreground">
            This is a free dataset. Connect your wallet to access it.
          </div>
        )}
        
        {!currentAccount && (
          <div className="text-sm text-muted-foreground">
            Connect your wallet to interact with this dataset.
          </div>
        )}
      </CardContent>
    </Card>
  );
}