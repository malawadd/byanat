import { useState, useCallback } from "react";
import { toast } from "sonner";
import { GenerationConfig, HFDataset, SyntheticDataResultItem } from "@/lib/types";
import { generateRow, getRows } from "@/app/create/actions";

export function useDatasetGeneration() {
  const [progress, setProgress] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [syntheticDatasetOutput, setSyntheticDatasetOutput] = useState<SyntheticDataResultItem[]>([]);

  const generateSyntheticDataset = useCallback(async (
    dataset: HFDataset, 
    generationConfig: GenerationConfig
  ) => {
    const output: SyntheticDataResultItem[] = [];
    let offset = 0;
    let totalTokensUsed = 0;
    let rows: any[] = await getRows(dataset, offset, 10);
    offset += 10;
    
    while (totalTokensUsed < generationConfig.maxTokens) {
      if (rows.length === 0) {
        rows = await getRows(dataset, offset, 10);
        offset += 10;
      }

      const row = rows.shift();
      if (!row) break;

      const rowData = row.row[generationConfig.inputFeature];
      const { result, usage, signature, response_hash } = await generateRow(
        rowData, 
        generationConfig, 
        generationConfig.maxTokens - totalTokensUsed
      );
      
      totalTokensUsed += usage.totalTokens;
      setProgress(totalTokensUsed / generationConfig.maxTokens);

      output.push({
        input: rowData,
        data: result,
        usage,
        signature,
        responseHash: response_hash,
      });
    }

    return output;
  }, []);

  const startGeneration = useCallback(async (
    dataset: HFDataset,
    generationConfig: GenerationConfig
  ) => {
    setIsGenerating(true);
    setSyntheticDatasetOutput([]);
    setProgress(0);

    try {
      const outputs = await generateSyntheticDataset(dataset, generationConfig);
      setSyntheticDatasetOutput(outputs);
      toast.success("Dataset generation completed!");
    } catch (error: any) {
      toast.error("Dataset Generation Error", { 
        description: `Error: ${error.message}` 
      });
      setSyntheticDatasetOutput([]);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [generateSyntheticDataset]);

  return {
    progress,
    isGenerating,
    syntheticDatasetOutput,
    startGeneration,
    setSyntheticDatasetOutput
  };
}