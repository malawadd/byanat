import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface GenerationCardProps {
  isGenerating: boolean;
  progress: number;
  hasOutput: boolean;
  isFormValid: boolean;
  hasDataset: boolean;
  hasAccount: boolean;
  onSubmit: () => void;
  onReopenDialog: () => void;
}

export function GenerationCard({
  isGenerating,
  progress,
  hasOutput,
  isFormValid,
  hasDataset,
  hasAccount,
  onSubmit,
  onReopenDialog
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
        {hasOutput && !isGenerating ? (
          <Button
            type="button"
            onClick={onReopenDialog}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
            size="lg"
          >
            Reopen Upload & Lock Dialog
          </Button>
        ) : (
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