"use server";

import { z } from "zod";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { GenerationConfig, HFDataset, AtomaModel, DatasetObject } from "@/lib/types";
import { JSONSchemaToZod } from "@dmitryrechkin/json-schema-to-zod";
import { createPublicClient, http, Address, zeroAddress } from "viem";
import { filecoinCalibration } from "wagmi/chains";
import datasetAbi from "@/lib/abi.json";
import { CALIBRATION_BAYANAT_CONTRACT } from "@/lib/constants";

const atoma = createOpenAI({
  apiKey: process.env.ATOMA_API_KEY,
  baseURL: "https://api.atoma.network/v1",
});

// Initialize Viem public client for Filecoin Calibration
const publicClient = createPublicClient({
  chain: filecoinCalibration,
  transport: http(),
});

export async function getRows(dataset: HFDataset, offset: number, length: number) {
  const response = await fetch(`https://datasets-server.huggingface.co/rows?dataset=${dataset.path}&config=${dataset.config}&split=${dataset.split}&offset=${offset}&length=${length}`);
  const data = await response.json();

  return data.rows;
}

type ResponseBody = {
  signature: string;
  response_hash: string;
}

export async function generateRow(row: string, config: GenerationConfig, maxTokens: number) {
  try {
    const prompt = config.prompt.replace("{input}", row);

    if (config.jsonSchema) {
      const { object, usage, response: { body } } = await generateObject({
        model: atoma(config.model),
        prompt,
        schema: JSONSchemaToZod.convert(config.jsonSchema),
        maxTokens,
      });

      const { signature, response_hash } = body as ResponseBody;

      return {
        result: object,
        usage,
        signature,
        response_hash,
      };
    } else {
      const { text, usage, response: { body } } = await generateText({
        model: atoma(config.model),
        prompt,
        maxTokens,
      });

      const { signature, response_hash } = body as ResponseBody;

      return {
        result: text,
        usage,
        signature,
        response_hash,
      };
    }
  } catch (error) {
    return {
      result: "No output generated",
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: maxTokens,
      },
      signature: "",
      response_hash: "",
    };
  }
}

export async function generatePromptWithWizard(prompt: string, inputFeature: string, example: string) {
  const wizardInstructionPrompt = `You are an expert prompt engineer. A user wants to generate a synthetic dataset and has provided the following description of their goal:
  "${prompt}"

  The user has specified that the primary input feature from their source dataset is named '${inputFeature}'.
  Here is an example of what the data for this input feature looks like: "${example}"

Based on the user's goal, the input feature name, and the example data, create a clear, concise, and effective prompt that will be used by another AI to generate individual synthetic data entries. This generated prompt MUST:
1. Directly address the user's described goal.
2. Be suitable for generating high-quality, realistic synthetic data relevant to the provided example.
3. Include the exact placeholder '{input}' where a single data point (like the example provided for '${inputFeature}') will be injected. Do not use any other placeholder format.

The final generated prompt should be ready to use for data generation.
Example of a good output if user wants summaries of articles (and inputFeature was 'articleText'): "Summarize the following article in 3 sentences: {input}"
Example of a good output if user wants to classify customer feedback (and inputFeature was 'feedbackComment'): "Classify the sentiment of this customer feedback as positive, negative, or neutral: {input}"

Generated Prompt for Data Synthesis:`;

  const { object: promptObject } = await generateObject({
    model: google("gemini-2.5-flash-preview-05-20"),
    prompt: wizardInstructionPrompt,
    schema: z.object({
      prompt: z.string().describe("A detailed and effective prompt for an AI model to generate synthetic data. This prompt must include the '{input}' placeholder to be replaced with the actual row data."),
    }),
    temperature: 0.3,
  })

  return promptObject.prompt;
}

export async function getModels(): Promise<AtomaModel[]> {
  try {
    const responseModels = await fetch("https://api.atoma.network/v1/models", {
      headers: {
        "Authorization": `Bearer ${process.env.ATOMA_API_KEY}`
      }
    });

    if (!responseModels.ok) {
      return [];
    }

    const data = (await responseModels.json()).data;

    const responseTasks = await fetch("https://credentials.atoma.network/tasks");
    const tasks = await responseTasks.json();

    const responseSubscriptions = await fetch("https://credentials.atoma.network/subscriptions");
    const subscriptions = await responseSubscriptions.json();

    return data.map((model: any) => {
      const task = tasks.find((task: any) => task[0].model_name === model.id);
      const subscription = subscriptions.find((subscription: any) => subscription.task_small_id === task[0].task_small_id);
      return {
        ...model,
        task_small_id: task[0].task_small_id,
        price_per_one_million_compute_units: subscription.price_per_one_million_compute_units,
        max_num_compute_units: subscription.max_num_compute_units
      }
    });
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return [];
  }
}

// Helper function to build allowlist by fetching buyers
async function buildAllowlist(datasetId: bigint): Promise<string[]> {
  try {
    // Get buyer count
    const buyerCount = await publicClient.readContract({
      address: CALIBRATION_BAYANAT_CONTRACT as Address,
      abi: datasetAbi,
      functionName: 'getBuyerCount',
      args: [datasetId],
    }) as bigint;

    const allowlist: string[] = [];
    
    // Fetch each buyer address
    for (let i = 0; i < Number(buyerCount); i++) {
      try {
        const buyerAddress = await publicClient.readContract({
          address: CALIBRATION_BAYANAT_CONTRACT as Address,
          abi: datasetAbi,
          functionName: 'getBuyerAt',
          args: [datasetId, BigInt(i)],
        }) as string;
        
        allowlist.push(buyerAddress);
      } catch (error) {
        console.error(`Failed to fetch buyer at index ${i}:`, error);
        // Continue with other buyers even if one fails
      }
    }

    return allowlist;
  } catch (error) {
    console.error("Failed to build allowlist:", error);
    return [];
  }
}

// Helper function to map raw contract data to DatasetObject
function mapContractDataToDatasetObject(
  id: string,
  coreData: any[],
  hfMeta: any[],
  modelMeta: any[],
  datasetMeta: any[],
  storageInfo: any[],
  allowlist: string[]
): DatasetObject {
  const [version, owner, price, visibility, balance, downloads, name, description] = coreData;
  const [hfPath, hfConfig, hfSplit, hfRevision] = hfMeta;
  const [modelName, taskSmallId, nodeSmallId, pricePerMilCU, maxNumCU] = modelMeta;
  const [numRows, numTokens, populated] = datasetMeta;
  const [encryptedCid] = storageInfo;

  return {
    id,
    version: Number(version),
    owner: owner as string,
    name: name as string,
    description: description as string,
    price: Number(price),
    visibility: {
      inner: Number(visibility),
    },
    blobId: encryptedCid ? Buffer.from((encryptedCid as string).slice(2), 'hex').toString('base64') : "",
    metadata: {
      numRows: Number(numRows),
      numTokens: Number(numTokens),
    },
    hfMetadata: {
      path: hfPath as string,
      config: hfConfig as string,
      split: hfSplit as string,
      revision: hfRevision as string,
    },
    stats: {
      numDownloads: Number(downloads),
    },
    modelMetadata: {
      name: modelName as string,
      taskSmallId: Number(taskSmallId),
      nodeSmallId: Number(nodeSmallId),
      pricePerOneMillionComputeUnits: Number(pricePerMilCU),
      maxNumComputeUnits: Number(maxNumCU),
    },
    allowlist,
  };
}

export async function getDataset(id: string): Promise<DatasetObject | null> {
  try {
    console.log(`🔍 Fetching dataset with ID: ${id}`);
    console.log(`📍 Contract address: ${CALIBRATION_BAYANAT_CONTRACT}`);
    
    const datasetId = BigInt(id);
    
    // Fetch all required data from the contract
    const [coreData, hfMeta, modelMeta, datasetMeta, storageInfo] = await Promise.all([
      publicClient.readContract({
        address: CALIBRATION_BAYANAT_CONTRACT as Address,
        abi: datasetAbi,
        functionName: 'getCore',
        args: [datasetId],
      }),
      publicClient.readContract({
        address: CALIBRATION_BAYANAT_CONTRACT as Address,
        abi: datasetAbi,
        functionName: 'getHFDatasetMeta',
        args: [datasetId],
      }),
      publicClient.readContract({
        address: CALIBRATION_BAYANAT_CONTRACT as Address,
        abi: datasetAbi,
        functionName: 'getModelMeta',
        args: [datasetId],
      }),
      publicClient.readContract({
        address: CALIBRATION_BAYANAT_CONTRACT as Address,
        abi: datasetAbi,
        functionName: 'getDatasetMeta',
        args: [datasetId],
      }),
      publicClient.readContract({
        address: CALIBRATION_BAYANAT_CONTRACT as Address,
        abi: datasetAbi,
        functionName: 'getStorageInfo',
        args: [datasetId],
      }),
    ]);

    console.log(`📊 Raw contract data for dataset ${id}:`, {
      coreData,
      hfMeta,
      modelMeta,
      datasetMeta,
      storageInfo
    });

    // Check if dataset exists (version 0 means not minted/doesn't exist)
    if (!coreData || !Array.isArray(coreData) || Number(coreData[0]) === 0) {
      console.log(`❌ Dataset ${id} does not exist (version: ${coreData?.[0]})`);
      return null;
    }

    console.log(`✅ Dataset ${id} exists with version: ${coreData[0]}`);

    // Build allowlist
    const allowlist = await buildAllowlist(datasetId);

    // Map contract data to DatasetObject
    return mapContractDataToDatasetObject(
      id,
      coreData as any[],
      hfMeta as any[],
      modelMeta as any[],
      datasetMeta as any[],
      storageInfo as any[],
      allowlist
    );
  } catch (error) {
    console.error(`❌ Failed to fetch dataset ${id}:`, error);
    console.error(`Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

export async function getLockedDatasets(): Promise<DatasetObject[]> {
  const MAX_CONSECUTIVE_EMPTY = 3;
  const MAX_DATASET_ID = 100; // Reasonable upper bound to prevent infinite loops
  
  console.log(`🚀 Starting dataset discovery...`);
  console.log(`📍 Contract address: ${CALIBRATION_BAYANAT_CONTRACT}`);
  console.log(`⚙️ Max consecutive empty: ${MAX_CONSECUTIVE_EMPTY}`);
  console.log(`⚙️ Max dataset ID: ${MAX_DATASET_ID}`);
  
  const foundDatasets: DatasetObject[] = [];
  let consecutiveEmptyCount = 0;

  try {
    for (let i = 1; i <= MAX_DATASET_ID; i++) {
      console.log(`🔍 Checking dataset ID: ${i}`);
      try {
        const dataset = await getDataset(i.toString());
        
        if (dataset) {
          // Found a valid dataset
          foundDatasets.push(dataset);
          consecutiveEmptyCount = 0; // Reset counter
          console.log(`✅ Found dataset ${i}: ${dataset.name}`);
        } else {
          // No dataset found for this ID
          consecutiveEmptyCount++;
          console.log(`❌ No dataset found for ID ${i}, consecutive empty: ${consecutiveEmptyCount}`);
          
          // Stop if we've hit the consecutive empty limit
          if (consecutiveEmptyCount >= MAX_CONSECUTIVE_EMPTY) {
            console.log(`🛑 Stopping search after ${consecutiveEmptyCount} consecutive empty datasets`);
            break;
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching dataset ${i}:`, error);
        consecutiveEmptyCount++;
        
        // Stop if we've hit the consecutive empty limit
        if (consecutiveEmptyCount >= MAX_CONSECUTIVE_EMPTY) {
          console.log(`🛑 Stopping search after ${consecutiveEmptyCount} consecutive errors`);
          break;
        }
      }
    }

    console.log(`🎯 Discovery complete! Found ${foundDatasets.length} datasets total`);
    if (foundDatasets.length > 0) {
      console.log(`📋 Dataset summary:`, foundDatasets.map(d => ({ id: d.id, name: d.name, owner: d.owner })));
    }
    return foundDatasets;
  } catch (error) {
    console.error("❌ Failed to fetch locked datasets:", error);
    return [];
  }
}

export async function getPersonalDatasets(address: string): Promise<DatasetObject[]> {
  if (!address) return [];

  try {
    // Get all locked datasets first
    const allDatasets = await getLockedDatasets();
    
    // Filter datasets owned by the specified address
    const personalDatasets = allDatasets.filter(dataset => 
      dataset.owner.toLowerCase() === address.toLowerCase()
    );

    return personalDatasets;
  } catch (error) {
    console.error("Failed to fetch personal datasets:", error);
    return [];
  }
}

// Legacy blob storage functions (keeping for compatibility)
export async function getBlob(blobId: string) {
  // For now, we'll keep the Walrus blob storage as it's a decentralized storage solution
  // This can be replaced with IPFS or other decentralized storage later
  const { TESTNET_AGGREGATORS } = await import("@/lib/constants");
  
  while (true) {
    try {
      const url = TESTNET_AGGREGATORS[Math.floor(Math.random() * TESTNET_AGGREGATORS.length)];
      const response = await fetch(`${url}/v1/blobs/${blobId}`);
      if (response.ok) {
        const data = await response.arrayBuffer();
        return new Uint8Array(data);
      }
    } catch (error) {
      console.error(error);
    }
  }
}

// Placeholder functions for contract interactions (these are now handled by the hooks)
export async function mintDataset(params: {
  datasetName: string;
  description: string;
  visibility: number;
  price: number;
  hfPath: string;
  hfConfig: string;
  hfSplit: string;
  hfRevision: string;
  modelId: string;
  taskSmallId: number;
  nodeSmallId: number;
  pricePerOneMillionComputeUnits: number;
  maxNumComputeUnits: number;
}) {
  // TODO: This function is deprecated in favor of the useDatasetMarketplace hook
  console.log("Minting dataset with params:", params);
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}

export async function lockDataset(params: {
  datasetId: string;
  blobId: string;
  numRows: number;
  numTokens: number;
}) {
  // TODO: This function is deprecated in favor of the useDatasetMarketplace hook
  console.log("Locking dataset with params:", params);
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}

export async function purchaseDatasetAccess(datasetId: string, price: number) {
  // TODO: This function is deprecated in favor of the useDatasetMarketplace hook
  console.log("Purchasing dataset access:", { datasetId, price });
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}

export async function updateDatasetVisibility(datasetId: string, visibility: number) {
  // TODO: Implement actual contract call to update dataset visibility
  console.log("Updating dataset visibility:", { datasetId, visibility });
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}

export async function updateDatasetPrice(datasetId: string, price: number) {
  // TODO: Implement actual contract call to update dataset price
  console.log("Updating dataset price:", { datasetId, price });
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}