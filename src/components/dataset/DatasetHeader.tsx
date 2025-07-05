"use client";

import Link from "next/link";
import Name from "@/components/name";
import { Badge } from "@/components/ui/badge";
import { DatasetObject } from "@/lib/types";
import { Edit3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatasetHeaderProps {
  dataset: DatasetObject;
  isOwner: boolean;
  currentAccount: string | undefined;
  resolveNameServiceNames: (address: string) => Promise<string>;
  onEditClick: () => void;
  isProcessingTx: boolean;
}

export function DatasetHeader({
  dataset,
  isOwner,
  currentAccount,
  resolveNameServiceNames,
  onEditClick,
  isProcessingTx,
}: DatasetHeaderProps) {
  const getShortModelName = (modelName: string) => {
    return modelName.split("/").pop();
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl flex items-baseline">
            <Link href={`/user/${dataset.owner}`} className="text-slate-400 dark:text-slate-500 mx-1">
              <Name address={dataset.owner} resolveNameServiceNames={resolveNameServiceNames} />
            </Link>
            <span className="text-slate-400 dark:text-slate-500 mx-1">/</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{dataset.name}</span>
          </h1>
          <Badge variant={dataset.visibility.inner === 0 ? "outline" : "secondary"}>
            {dataset.visibility.inner === 0 ? "Public" : "Private"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 mb-3">
          {dataset.modelMetadata?.name && (
            <Link
              href={`https://huggingface.co/${dataset.modelMetadata.name}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge variant="outline" className="text-xs">
                <ExternalLink className="h-4 w-4 mr-1" />
                {getShortModelName(dataset.modelMetadata.name)}
              </Badge>
            </Link>
          )}
          {dataset.hfMetadata?.path && (
            <Link
              href={`https://huggingface.co/datasets/${dataset.hfMetadata.path}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge variant="outline" className="text-xs">
                <ExternalLink className="h-4 w-4 mr-1" />
                {dataset.hfMetadata.path}
              </Badge>
            </Link>
          )}
        </div>
      </div>
      
      {/* Edit Button */}
      {isOwner && (
        <Button variant="outline" onClick={onEditClick} disabled={isProcessingTx}>
          <Edit3 size={18} className="mr-2" />
          Edit Details
        </Button>
      )}
    </div>
  );
}