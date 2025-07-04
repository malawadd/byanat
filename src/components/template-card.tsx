import { z } from "zod";
import Link from "next/link";
import { HFDataset } from "@/lib/types";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type Template = {
  name: string;
  description: string;
  dataset: Pick<HFDataset, "path" | "config" | "split">;
  prompt: string;
  inputFeature: string;
  maxTokens: number;
  modelId: string;
  price: number;
  visibility: number;
  logo: any;
  jsonSchema?: z.ZodObject<any>;
  color?: "blue" | "purple" | "green" | "orange" | "pink" | "teal";
};

const colorVariants = {
  blue: {
    card: "border-neon-cyan bg-gradient-to-br from-neon-cyan/5 to-transparent",
    glow: "neon-cyan",
    text: "text-neon-cyan"
  },
  purple: {
    card: "border-neon-magenta bg-gradient-to-br from-neon-magenta/5 to-transparent",
    glow: "neon-magenta", 
    text: "text-neon-magenta"
  },
  green: {
    card: "border-neon-green bg-gradient-to-br from-neon-green/5 to-transparent",
    glow: "neon-green",
    text: "text-neon-green"
  },
  orange: {
    card: "border-neon-yellow bg-gradient-to-br from-neon-yellow/5 to-transparent",
    glow: "neon-yellow",
    text: "text-neon-yellow"
  },
  pink: {
    card: "border-neon-magenta bg-gradient-to-br from-neon-magenta/5 to-transparent",
    glow: "neon-magenta",
    text: "text-neon-magenta"
  },
  teal: {
    card: "border-neon-cyan bg-gradient-to-br from-neon-cyan/5 to-transparent",
    glow: "neon-cyan",
    text: "text-neon-cyan"
  }
};

export function TemplateCard({ template }: { template: Template }) {
  const colors = colorVariants[template.color || "blue"];

  const getParams = () => {
    const params = new URLSearchParams({
      datasetPath: template.dataset.path,
      datasetConfig: template.dataset.config,
      datasetSplit: template.dataset.split,
      datasetName: template.name,
      description: template.description,
      modelId: template.modelId,
      maxTokens: template.maxTokens.toString(),
      inputFeature: template.inputFeature,
      prompt: template.prompt,
      visibility: template.visibility.toString(),
      price: template.price.toString(),
    });
    if (template.jsonSchema) {
      params.set("jsonSchema", JSON.stringify(zodToJsonSchema(template.jsonSchema)));
    }
    return params.toString();
  };

  return (
    <Link href={`/create?${getParams()}`}>
      <Card className={`${colors.card} hud-panel hover:shadow-lg transition-all duration-300 hover:scale-105 group relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20"></div>
        <div className="scan-lines absolute inset-0 opacity-30"></div>
        
        <CardHeader className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded border ${colors.card} ${colors.text}`}>
              {template.logo}
            </div>
            <div className="status-indicator"></div>
          </div>
          <CardTitle className={`command-text ${colors.text} text-lg`}>
            {template.name.toUpperCase()}
          </CardTitle>
          <CardDescription className="command-text text-neon-cyan/70 text-sm">
            {template.description.toUpperCase()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="flex justify-between items-center">
            <div className="command-text text-xs text-neon-green">
              TOKENS: {template.maxTokens.toLocaleString()}
            </div>
            <div className="command-text text-xs text-neon-magenta">
              ${template.price} USDC
            </div>
          </div>
          
          <div className="mt-4 p-2 bg-black/30 rounded border border-neon-green/30">
            <div className="command-text text-xs text-neon-green opacity-70">
              PROTOCOL.READY
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}