"use server";

import { z } from "zod";
import { Buffer } from "buffer";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { TESTNET_PUBLISHERS } from "@/lib/constants";
import { GenerationConfig, HFDataset, DatasetObject } from "@/lib/types";
import { JSONSchemaToZod } from "@dmitryrechkin/json-schema-to-zod";
import { 
  CALIBRATION_PACKAGE_ADDRESS, 
  CALIBRATION_BAYANAT_CONTRACT,
  TESTNET_DEBUG_OBJECTS 
} from "@/lib/constants";

const atoma = createOpenAI({
  apiKey: process.env.ATOMA_API_KEY,
  baseURL: "https://api.atoma.network/v1",
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

export const storeBlob = async (encryptedData: Uint8Array, numEpochs: number) => {
  while (true) {
    try {
      const url = TESTNET_PUBLISHERS[Math.floor(Math.random() * TESTNET_PUBLISHERS.length)];
      const response = await fetch(`${url}/v1/blobs?epochs=${numEpochs}`, {
        method: "PUT",
        body: Buffer.from(encryptedData),
      });

      if (response.ok) {
        const data = await response.json();
        return data.newlyCreated.blobObject.blobId;
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export async function getModels() {
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
}

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

// Mock functions for Filecoin Calibration - these will need to be implemented with actual contract calls
const _mapRawObjectToDatasetObject = (rawObject: any): DatasetObject => {
  // This is a placeholder mapping function
  // In a real implementation, this would parse the contract response
  return {
    id: rawObject.id || "0x0",
    version: rawObject.version || 1,
    owner: rawObject.owner || "0x0",
    name: rawObject.name || "Unknown Dataset",
    description: rawObject.description || "",
    price: rawObject.price || 0,
    visibility: {
      inner: rawObject.visibility || 0,
    },
    blobId: rawObject.blobId || "",
    metadata: {
      numRows: rawObject.numRows || 0,
      numTokens: rawObject.numTokens || 0,
    },
    hfMetadata: {
      path: rawObject.hfPath || "",
      config: rawObject.hfConfig || "",
      split: rawObject.hfSplit || "",
      revision: rawObject.hfRevision || "main",
    },
    stats: {
      numDownloads: rawObject.numDownloads || 0,
    },
    modelMetadata: {
      name: rawObject.modelName || "",
      taskSmallId: rawObject.taskSmallId || 0,
      nodeSmallId: rawObject.nodeSmallId || 0,
      pricePerOneMillionComputeUnits: rawObject.pricePerOneMillionComputeUnits || 0,
      maxNumComputeUnits: rawObject.maxNumComputeUnits || 0,
    },
    allowlist: rawObject.allowlist || [],
  };
};

export async function getDataset(id: string): Promise<DatasetObject> {
  // TODO: Implement actual contract call to Filecoin Calibration
  // This is a placeholder that should be replaced with actual contract interaction
  
  try {
    // Placeholder for contract call
    // const contract = new ethers.Contract(CALIBRATION_BAYANAT_CONTRACT, ABI, provider);
    // const result = await contract.getDataset(id);
    
    // For now, return a mock dataset
    const mockDataset = {
      id,
      version: 1,
      owner: "0x0000000000000000000000000000000000000000",
      name: "Mock Dataset",
      description: "This is a mock dataset for development",
      price: 0,
      visibility: 0,
      blobId: "",
      numRows: 0,
      numTokens: 0,
      hfPath: "",
      hfConfig: "",
      hfSplit: "",
      hfRevision: "main",
      numDownloads: 0,
      modelName: "",
      taskSmallId: 0,
      nodeSmallId: 0,
      pricePerOneMillionComputeUnits: 0,
      maxNumComputeUnits: 0,
      allowlist: [],
    };

    return _mapRawObjectToDatasetObject(mockDataset);
  } catch (error) {
    throw new Error(`Dataset object ${id} not found or contract call failed: ${error}`);
  }
}

export async function getLockedDatasets(): Promise<DatasetObject[]> {
  // TODO: Implement actual contract event querying for Filecoin Calibration
  // This is a placeholder that should be replaced with actual contract interaction
  
  try {
    // Placeholder for contract event query
    // const contract = new ethers.Contract(CALIBRATION_BAYANAT_CONTRACT, ABI, provider);
    // const events = await contract.queryFilter('DatasetLockedEvent');
    
    // For now, return empty array
    return [];
  } catch (error) {
    console.error("Failed to fetch locked datasets:", error);
    return [];
  }
}

export async function getPersonalDatasets(address: string): Promise<DatasetObject[]> {
  if (!address) return [];

  // TODO: Implement actual contract call to get user's datasets
  // This is a placeholder that should be replaced with actual contract interaction
  
  try {
    // Placeholder for contract call
    // const contract = new ethers.Contract(CALIBRATION_BAYANAT_CONTRACT, ABI, provider);
    // const datasets = await contract.getUserDatasets(address);
    
    // For now, return empty array
    return [];
  } catch (error) {
    console.error("Failed to fetch personal datasets:", error);
    return [];
  }
}

// Placeholder functions for contract interactions
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
  // TODO: Implement actual contract call to mint dataset
  // This should interact with the Filecoin Calibration smart contract
  console.log("Minting dataset with params:", params);
  
  // Return mock transaction hash
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}

export async function lockDataset(params: {
  datasetId: string;
  blobId: string;
  numRows: number;
  numTokens: number;
}) {
  // TODO: Implement actual contract call to lock dataset
  // This should interact with the Filecoin Calibration smart contract
  console.log("Locking dataset with params:", params);
  
  // Return mock transaction hash
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}

export async function purchaseDatasetAccess(datasetId: string, price: number) {
  // TODO: Implement actual contract call to purchase dataset access
  // This should interact with the Filecoin Calibration smart contract
  console.log("Purchasing dataset access:", { datasetId, price });
  
  // Return mock transaction hash
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}

export async function updateDatasetVisibility(datasetId: string, visibility: number) {
  // TODO: Implement actual contract call to update dataset visibility
  console.log("Updating dataset visibility:", { datasetId, visibility });
  
  // Return mock transaction hash
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}

export async function updateDatasetPrice(datasetId: string, price: number) {
  // TODO: Implement actual contract call to update dataset price
  console.log("Updating dataset price:", { datasetId, price });
  
  // Return mock transaction hash
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}