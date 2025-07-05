"use client";

import { DatasetObject } from "@/lib/types";

interface DatasetDescriptionProps {
  dataset: DatasetObject;
}

export function DatasetDescription({ dataset }: DatasetDescriptionProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-base">{dataset.description || "No description provided."}</p>
    </div>
  );
}