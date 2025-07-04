"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from 'wagmi';
import { toast } from "sonner";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { parseUnits } from "viem";

import { Form } from "@/components/ui/form";
import { ServerOff } from "lucide-react";
import { getModels } from "@/lib/actions";
import { generatePromptWithWizard } from "@/app/create/actions";
import { AtomaModel, HFDataset, GenerationConfig } from "@/lib/types";
import MintDatasetButton from "@/components/MintDatasetButton";
import LockDatasetButton from "@/components/LockDatasetButton";
import { CALIBRATION_BAYANAT_CONTRACT } from "@/lib/constants";

// Hooks
import { useDatasetForm } from "@/hooks/useDatasetForm";
import { useDatasetGeneration } from "@/hooks/useDatasetGeneration";
import { usePreviewGeneration } from "@/hooks/usePreviewGeneration";

// Components
import { DatasetSelectionCard } from "@/components/create/DatasetSelectionCard";
import { ModelConfigurationCard } from "@/components/create/ModelConfigurationCard";
import { PromptConfigurationCard } from "@/components/create/PromptConfigurationCard";
import { DatasetDetailsCard } from "@/components/create/DatasetDetailsCard";
import { GenerationCard } from "@/components/create/GenerationCard";

function CreateInnerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address: currentAccount } = useAccount();
  
  // Form management
  const { form } = useDatasetForm();
  
  // Generation hooks
  const { progress, isGenerating, syntheticDatasetOutput, startGeneration } = useDatasetGeneration();
  const { previewData, isPreviewLoading, previewAttempts, maxAttempts, generatePreview } = usePreviewGeneration();
  
  // State
  const [data, setData] = useState<any[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [models, setModels] = useState<AtomaModel[]>([]);
  const [dataset, setDataset] = useState<HFDataset | null>(null);
  const [jsonSchema, setJsonSchema] = useState<z.ZodObject<any> | null>(null);
  const [initialJsonSchema, setInitialJsonSchema] = useState<object | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(true);
  const [wizardPrompt, setWizardPrompt] = useState<string>("");
  const [wizardPromptGenerated, setWizardPromptGenerated] = useState<boolean>(false);
  const [isPromptGenerating, setIsPromptGenerating] = useState<boolean>(false);
  const [serviceDown, setServiceDown] = useState(false);
  const [mintedDatasetId, setMintedDatasetId] = useState<bigint | null>(null);
  const [isDatasetLocked, setIsDatasetLocked] = useState<boolean>(false);

  // Computed values
  const selectedModelId = form.watch("modelId");
  const selectedModel = useMemo(() => models.find(m => m.id === selectedModelId) || null, [models, selectedModelId]);
  const previewFeatures = useMemo(() => {
    const inputFeature = form.getValues("inputFeature");
    return inputFeature ? [inputFeature, "generated_output"] : ["generated_output"];
  }, [form.watch("inputFeature")]);

  // Load models on mount
useEffect(() => {
  getModels()
    .then((models) => {
      if (!models || models.length === 0) {
        setServiceDown(true);
      } else {
        setModels(models);
      }
    })
    .catch(() => setServiceDown(true));
}, []);
  
  // Load dataset data when dataset changes
  useEffect(() => {
    const fetchData = async () => {
      if (!dataset) return;
      const response = await fetch(`https://datasets-server.huggingface.co/first-rows?dataset=${dataset.path}&config=${dataset.config}&split=${dataset.split}`);
      const data = await response.json();
      setData(data.rows.map((row: any) => row));
      setFeatures(data.features.map((feature: any) => feature.name));
    };
    fetchData();
  }, [dataset]);

  // Handle prompt generation with wizard
  const handleGeneratePromptWithWizard = useCallback(async () => {
    setIsPromptGenerating(true);
    const inputFeature = form.getValues("inputFeature");
    const example = data[0].row[inputFeature];
    const prompt = await generatePromptWithWizard(wizardPrompt, inputFeature, example);
    form.setValue("prompt", prompt);
    setWizardPromptGenerated(true);
    setIsPromptGenerating(false);
    setIsWizardOpen(false);
  }, [wizardPrompt, form, data]);

  // Handle test generation
  const handleTestGeneration = useCallback(async () => {
    if (!dataset) return;
    
    const { modelId, inputFeature, maxTokens, prompt, isStructured } = form.getValues();
    const currentModel = models.find(m => m.id === modelId);
    if (!currentModel) {
      toast.error("Test Generation Failed", { description: "Model not selected for test generation." });
      return;
    }

    const generationConfig: GenerationConfig = {
      model: currentModel.id,
      inputFeature,
      jsonSchema: isStructured && jsonSchema ? zodToJsonSchema(jsonSchema) : undefined,
      maxTokens,
      prompt
    };
    
    await generatePreview(data, generationConfig, currentModel, jsonSchema);
  }, [dataset, form, models, jsonSchema, data, generatePreview]);

  // Handle form submission
  const onSubmit = async (values: any) => {
    if (!dataset || !currentAccount || syntheticDatasetOutput.length === 0) {
      toast.error("Generation Failed", { description: "Dataset, account, or generated data not available." });
      return;
    }
    
    const currentModel = models.find(m => m.id === values.modelId);
    if (!currentModel) {
      toast.error("Generation Failed", { description: "Model not found for generation." });
      return;
    }

    const generationConfig: GenerationConfig = {
      model: currentModel.id,
      inputFeature: values.inputFeature,
      jsonSchema: values.isStructured && jsonSchema ? zodToJsonSchema(jsonSchema) : undefined,
      maxTokens: values.maxTokens,
      prompt: values.prompt
    };

    // Only start generation if we haven't generated data yet
    if (syntheticDatasetOutput.length === 0) {
      await startGeneration(dataset, generationConfig);
    }
  };

  // Handle dataset minting
  const handleDatasetMinted = (datasetId: bigint) => {
    setMintedDatasetId(datasetId);
    toast.success(`Dataset minted with ID: ${datasetId.toString()}`);
  };

  // Handle dataset locking
  const handleDatasetLocked = () => {
    setIsDatasetLocked(true);
    toast.success("Dataset locked successfully! Your synthetic dataset is now available on-chain.");
  };

  // Prepare mint parameters
  const getMintParams = () => {
    const values = form.getValues();
    const currentModel = models.find(m => m.id === values.modelId);
    
    return {
      hfPath: dataset?.path || "",
      hfConfig: dataset?.config || "",
      hfSplit: dataset?.split || "",
      hfRevision: "main",
      visibility: values.visibility,
      name: values.datasetName,
      description: values.description || "",
      price: values.price || 0,
      modelName: currentModel?.id || "",
      taskSmallId: BigInt(currentModel?.task_small_id || 0),
      nodeSmallId: BigInt(0), // You may need to adjust this
      pricePerMilCU: BigInt(currentModel?.price_per_one_million_compute_units || 0),
      maxNumCU: BigInt(currentModel?.max_num_compute_units || 0),
    };
  };

  // Check if test generation is possible
  const canTestGeneration = useMemo(() => {
    return form.watch("modelId") &&
           form.watch("inputFeature") &&
           form.watch("prompt").includes("{input}") &&
           (!form.watch("isStructured") || jsonSchema);
  }, [form.watch("modelId"), form.watch("inputFeature"), form.watch("prompt"), form.watch("isStructured"), jsonSchema]);

// if (serviceDown) {
//   return (
//     <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center gap-4 text-center">
//       <ServerOff className="h-16 w-16 text-red-500" />
//       <h1 className="text-3xl font-bold">Atoma Network Unavailable</h1>
//       <p className="max-w-sm text-muted-foreground">
//         We're sorry for the inconvenience, but the Atoma Network is currently
//         unavailable. Please try again later.
//       </p>
//     </div>
//   );
// }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col items-center justify-center py-8 gap-6">
          <div className="text-3xl font-bold">Create a Synthetic Dataset</div>
          <div className="w-full max-w-4xl space-y-8">
            
            <DatasetSelectionCard
              dataset={dataset}
              setDataset={setDataset}
              features={features}
              data={data}
            />

            {dataset && (
              <>
                <ModelConfigurationCard
                  control={form.control}
                  models={models}
                  selectedModel={selectedModel}
                  dataset={dataset}
                  isStructured={form.watch("isStructured")}
                  initialJsonSchema={initialJsonSchema}
                  setJsonSchema={setJsonSchema}
                />

                <PromptConfigurationCard
                  control={form.control}
                  isWizardOpen={isWizardOpen}
                  setIsWizardOpen={setIsWizardOpen}
                  wizardPrompt={wizardPrompt}
                  setWizardPrompt={setWizardPrompt}
                  wizardPromptGenerated={wizardPromptGenerated}
                  isPromptGenerating={isPromptGenerating}
                  onGeneratePromptWithWizard={handleGeneratePromptWithWizard}
                  previewData={previewData}
                  previewFeatures={previewFeatures}
                  isPreviewLoading={isPreviewLoading}
                  previewAttempts={previewAttempts}
                  maxAttempts={maxAttempts}
                  onTestGeneration={handleTestGeneration}
                  canTestGeneration={canTestGeneration}
                  currentAccount={currentAccount}
                />
                
                <DatasetDetailsCard
                  control={form.control}
                  visibility={form.watch("visibility")}
                />

                <GenerationCard
                  isGenerating={isGenerating}
                  progress={progress}
                  hasOutput={syntheticDatasetOutput.length > 0}
                  isFormValid={form.formState.isValid}
                  hasDataset={!!dataset}
                  hasAccount={!!currentAccount}
                  onSubmit={() => form.handleSubmit(onSubmit)()}
                  mintedDatasetId={mintedDatasetId}
                  isDatasetLocked={isDatasetLocked}
                  onDatasetMinted={handleDatasetMinted}
                  onDatasetLocked={handleDatasetLocked}
                  mintParams={getMintParams()}
                  syntheticDatasetOutput={syntheticDatasetOutput}
                  inputFeature={form.getValues("inputFeature")}
                />
              </>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

export default function CreatePage() {
  return (
    <Suspense>
      <CreateInnerPage />
    </Suspense>
  );
}