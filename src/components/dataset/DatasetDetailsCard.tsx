"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatasetObject } from "@/lib/types";
import { Info, Tag, Server, FileText, Download } from "lucide-react";
import { MIST_PER_USDC } from "@/lib/constants";

interface DatasetDetailsCardProps {
  dataset: DatasetObject;
}

export function DatasetDetailsCard({ dataset }: DatasetDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dataset Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">ID</p>
              <p className="text-sm font-mono break-all">{dataset.id}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Tag className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">IPFS CID</p>
              <p className="text-sm font-mono break-all">{dataset.blobId || "N/A"}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Server className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Price</p>
              <p className="text-sm">
                {dataset.price > 0 
                  ? `${dataset.price / MIST_PER_USDC} USDC` 
                  : "Free"}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Rows & Tokens</p>
              <p className="text-sm">
                {dataset.metadata.numRows?.toLocaleString() ?? "N/A"} rows, 
                {" "}{dataset.metadata.numTokens?.toLocaleString() ?? "N/A"} tokens
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Download className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Downloads</p>
              <p className="text-sm">
                {dataset.stats.numDownloads?.toLocaleString() ?? "N/A"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}