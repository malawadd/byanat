"use client";

import { z } from "zod";
import { DatasetObject } from "@/lib/types";
import { getLockedDatasets } from "@/lib/actions";
import { Template } from "@/components/template-card";
import { DatasetList } from "@/components/dataset-list";
import { useCallback, useEffect, useState } from "react";
import { TemplateList } from "@/components/template-list";
import { X, BrainCircuit, Stethoscope, Bot, Zap, Database, Activity } from "lucide-react";
import { useAccount } from 'wagmi';

const templates: Template[] = [
  {
    name: "UltraChat Instruct",
    description: "Large-scale Dialogue Data",
    dataset: {
      path: "HuggingFaceH4/ultrachat_200k",
      config: "default",
      split: "train_sft",
    },
    prompt: "Read the following text and answer the questions contained within it based only on the information provided in the text: {input}",
    inputFeature: "prompt",
    maxTokens: 1000,
    modelId: "Infermatic/Llama-3.3-70B-Instruct-FP8-Dynamic",
    price: 1,
    visibility: 0,
    color: "purple",
    logo: <BrainCircuit className="h-8 w-8" />,
  },
  {
    name: "Medical Transcription",
    description: "Medical Transcription Data",
    dataset: {
      path: "galileo-ai/medical_transcription_40",
      config: "default",
      split: "train",
    },
    prompt: "Given the following medical transcription, classify it into one of these categories: [ Pain Management, Chiropractic, Podiatry, Pediatrics - Neonatal, Discharge Summary, Cosmetic / Plastic Surgery, Neurology, Endocrinology, Rheumatology, Orthopedic, Dentistry, Allergy / Immunology, Psychiatry / Psychology, Consult - History and Phy., Dermatology, Radiology, Speech - Language, Physical Medicine - Rehab, Sleep Medicine, Hospice - Palliative Care, Diets and Nutritions, Urology, ENT - Otolaryngology, Gastroenterology, Letters, Surgery, Bariatrics, Ophthalmology, Neurosurgery, Emergency Room Reports, Nephrology, Lab Medicine - Pathology, Office Notes, Cardiovascular / Pulmonary, SOAP / Chart / Progress Notes, Autopsy, General Medicine, IME-QME-Work Comp etc., Obstetrics / Gynecology, Hematology - Oncology]. After classifying, explain your reasoning for the chosen category. Medical Transcription: {input}",
    inputFeature: "text",
    maxTokens: 3000,
    modelId: "Infermatic/Llama-3.3-70B-Instruct-FP8-Dynamic",
    price: 5,
    visibility: 0,
    color: "blue",
    logo: <Stethoscope className="h-8 w-8" />,
    jsonSchema: z.object({
      explanation: z.string().describe("The explanation of the label"),
      label: z.enum([" Pain Management", " Chiropractic", " Podiatry", " Pediatrics - Neonatal", " Discharge Summary", " Cosmetic / Plastic Surgery", " Neurology", " Endocrinology", " Rheumatology", " Orthopedic", " Dentistry", " Allergy / Immunology", " Psychiatry / Psychology", " Consult - History and Phy.", " Dermatology", " Radiology", " Speech - Language", " Physical Medicine - Rehab", " Sleep Medicine", " Hospice - Palliative Care", " Diets and Nutritions", " Urology", " ENT - Otolaryngology", " Gastroenterology", " Letters", " Surgery", " Bariatrics", " Ophthalmology", " Neurosurgery", " Emergency Room Reports", " Nephrology", " Lab Medicine - Pathology", " Office Notes", " Cardiovascular / Pulmonary", " SOAP / Chart / Progress Notes", " Autopsy", " General Medicine", " IME-QME-Work Comp etc.", " Obstetrics / Gynecology", " Hematology - Oncology"]).describe("The label of the medical transcription"),
    }),
  },
  {
    name: "Semantic Search",
    description: "A dataset for Semantic Search",
    dataset: {
      path: "tollan/chat-semantic-search",
      config: "default",
      split: "train",
    },
    prompt: "For the given text, you need to determine if the answer is valid or not. The text is: {input}",
    inputFeature: "text",
    maxTokens: 1000,
    modelId: "Infermatic/Llama-3.3-70B-Instruct-FP8-Dynamic",
    price: 1,
    visibility: 0,
    color: "green",
    logo: <Bot className="h-8 w-8" />,
    jsonSchema: z.object({
      valid: z.boolean().describe("Whether the answer is valid or not"),
    }),
  },
];

export default function Home() {
  const { address } = useAccount();
  const [showTemplates, setShowTemplates] = useState(true);
  const [lockedDatasets, setLockedDatasets] = useState<DatasetObject[]>([]);

  useEffect(() => {
    getLockedDatasets().then(datasets => {
      setLockedDatasets(datasets);
    });
  }, []);

  const resolveNameServiceNames = useCallback(async (address: string) => {
    return "";
  }, []);

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 via-transparent to-neon-magenta/5"></div>
        <div className="scan-lines absolute inset-0"></div>
        
        <div className="relative container mx-auto px-4 py-16">
          {/* Main Hero Content */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="radar-sweep w-24 h-24 border border-neon-green/30"></div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-6 neon-text text-neon-green">
              NEURAL FORGE
            </h1>
            <p className="text-xl md:text-2xl command-text text-neon-cyan mb-8 max-w-4xl mx-auto">
              INITIALIZING SYNTHETIC DATA GENERATION PROTOCOLS
            </p>
            
            {/* Status Panel */}
            <div className="hud-panel max-w-2xl mx-auto p-6 mb-12">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <Database className="w-8 h-8 text-neon-green mx-auto mb-2" />
                  <div className="command-text text-sm text-neon-green">DATASETS</div>
                  <div className="text-2xl font-bold text-neon-green">{lockedDatasets.length}</div>
                </div>
                <div className="text-center">
                  <Activity className="w-8 h-8 text-neon-cyan mx-auto mb-2" />
                  <div className="command-text text-sm text-neon-cyan">MODELS</div>
                  <div className="text-2xl font-bold text-neon-cyan">ACTIVE</div>
                </div>
                <div className="text-center">
                  <Zap className="w-8 h-8 text-neon-magenta mx-auto mb-2" />
                  <div className="command-text text-sm text-neon-magenta">NETWORK</div>
                  <div className="text-2xl font-bold text-neon-magenta">ONLINE</div>
                </div>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          {showTemplates && templates.length > 0 && (
            <div className="flex justify-center mb-16">
              <div className="hud-panel max-w-4xl w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold neon-text text-neon-green mb-2">
                      TEMPLATE PROTOCOLS
                    </h2>
                    <p className="command-text text-neon-cyan opacity-70">
                      SELECT PREDEFINED NEURAL PATTERNS
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="p-2 bg-neon-magenta/20 rounded border border-neon-magenta text-neon-magenta hover:bg-neon-magenta/30 transition-colors"
                    aria-label="Close templates"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <TemplateList templates={templates} />
              </div>
            </div>
          )}

          {/* Datasets Grid */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold neon-text text-neon-green mb-4">
                ACTIVE NEURAL DATASETS
              </h2>
              <p className="command-text text-neon-cyan opacity-70 mb-8">
                SYNCHRONIZED DATA REPOSITORIES
              </p>
            </div>
            
            {lockedDatasets.length > 0 ? (
              <DatasetList 
                datasets={lockedDatasets} 
                currentAddress={address} 
                resolveNameServiceNames={resolveNameServiceNames} 
              />
            ) : (
              <div className="hud-panel max-w-2xl mx-auto p-12 text-center">
                <Database className="w-16 h-16 text-neon-green/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-neon-green mb-2">
                  NO DATASETS DETECTED
                </h3>
                <p className="command-text text-neon-cyan opacity-70">
                  INITIALIZE CREATION PROTOCOL TO BEGIN
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}