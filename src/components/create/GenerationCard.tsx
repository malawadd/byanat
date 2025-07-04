import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle } from "lucide-react";
import MintDatasetButton from "@/components/MintDatasetButton";
import LockDatasetButton from "@/components/LockDatasetButton";
import { CALIBRATION_BAYANAT_CONTRACT } from "@/lib/constants";
import { SyntheticDataResultItem } from "@/lib/types";
import { MintDatasetParams } from "@/hooks/useDatasetMarketplace";

interface GenerationCardProps {
  isGenerating: boolean;
  progress: number;
  hasOutput: boolean;
  isFormValid: boolean;
  hasDataset: boolean;
  hasAccount: boolean;
  onSubmit: () => void;
  mintedDatasetId: bigint | null;
  isDatasetLocked: boolean;
  onDatasetMinted: (datasetId: bigint) => void;
  onDatasetLocked: () => void;
  mintParams: Omit<MintDatasetParams, 'priceUSDC'> & { price: number };
  syntheticDatasetOutput: SyntheticDataResultItem[];
  inputFeature: string;
}

export function GenerationCard({
  isGenerating,
  progress,
  hasOutput,
  isFormValid,
  hasDataset,
  hasAccount,
  onSubmit,
  mintedDatasetId,
  isDatasetLocked,
  onDatasetMinted,
  onDatasetLocked,
  mintParams,
  syntheticDatasetOutput,
  inputFeature
}: GenerationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>5. Generate Full Dataset</CardTitle>
        <CardDescription>
          Once you're satisfied with the test, generate the complete synthetic dataset.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Generate Dataset */}
        {!hasOutput ? (
          <Button
            type="submit"
            className="w-full bg-[#6750A4] hover:bg-[#6750A4]/90"
            size="lg"
            variant="default"
            disabled={isGenerating || !isFormValid || !hasDataset || !hasAccount}
            onClick={onSubmit}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Full Dataset...
              </>
            ) : (
              "Generate Full Dataset"
            )}
          </Button>
        ) : !mintedDatasetId ? (
          /* Step 2: Mint Dataset */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Dataset generated successfully!</span>
            </div>
            <MintDatasetButton
              marketAddress={CALIBRATION_BAYANAT_CONTRACT}
              params={mintParams}
              onMinted={onDatasetMinted}
            />
          </div>
        ) : !isDatasetLocked ? (
          /* Step 3: Lock Dataset */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Dataset minted with ID: {mintedDatasetId.toString()}</span>
            </div>
            <LockDatasetButton
              marketAddress={CALIBRATION_BAYANAT_CONTRACT}
              datasetId={mintedDatasetId}
              syntheticDatasetOutput={syntheticDatasetOutput}
              inputFeature={inputFeature}
              onLocked={onDatasetLocked}
            />
          </div>
        ) : (
          /* Step 4: Complete */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Dataset successfully created and locked on-chain!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your dataset is now available at: /dataset/{mintedDatasetId.toString()}
            </p>
          </div>
        )}
        
        {isGenerating && (
          <div className="mt-4">
            <Progress value={progress * 100} className="w-full" />
            <p className="text-sm text-center mt-2">Generation progress: {Math.round(progress * 100)}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}