import { useState, useCallback } from "react";
import { toast } from "sonner";
import { GenerationConfig, AtomaModel } from "@/lib/types";
import { generateRow } from "@/app/create/actions";

const MAX_PREVIEW_ATTEMPTS = 5;

export function usePreviewGeneration() {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewAttempts, setPreviewAttempts] = useState<number>(0);

  const generatePreview = useCallback(async (
    data: any[],
    generationConfig: GenerationConfig,
    model: AtomaModel,
    jsonSchema?: any
  ) => {
    if (previewAttempts >= MAX_PREVIEW_ATTEMPTS) {
      toast.warning("Preview Limit Reached", { 
        description: "You have reached the maximum number of preview attempts." 
      });
      return;
    }
    
    setIsPreviewLoading(true);
    setPreviewAttempts(prev => prev + 1);
    
    try {
      const testSamples = data.slice(0, 3).map((row) => row.row[generationConfig.inputFeature]);
      const outputs = [];
      
      for (const sample of testSamples) {
        const { result, usage, signature, response_hash } = await generateRow(
          sample, 
          generationConfig, 
          generationConfig.maxTokens
        );
        outputs.push({
          input: sample,
          data: result,
          usage,
          signature,
          responseHash: response_hash,
        });
      }
      
      const preview = outputs.map((item, index) => ({
        row_idx: index,
        row: {
          [generationConfig.inputFeature]: item.input,
          "generated_output": item.data || "No output generated"
        },
        signature: item.signature,
        response_hash: item.responseHash,
      }));
      
      setPreviewData(preview);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [previewAttempts]);

  return {
    previewData,
    isPreviewLoading,
    previewAttempts,
    maxAttempts: MAX_PREVIEW_ATTEMPTS,
    generatePreview,
    setPreviewData
  };
}