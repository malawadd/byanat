"use client";

import Link from "next/link";
import Name from "@/components/name";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatasetObject } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit3, ExternalLink, Info, Tag, Server, FileText, Download, Eye } from "lucide-react";
import { MIST_PER_USDC } from "@/lib/constants";

interface DatasetDetailsSectionProps {
  dataset: DatasetObject;
  isOwner: boolean;
  currentAccount: string | undefined;
  resolveNameServiceNames: (address: string) => Promise<string>;
  editablePrice: number | null;
  setEditablePrice: (price: number | null) => void;
  editableVisibility: number;
  setEditableVisibility: (visibility: number) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isProcessingTx: boolean;
  handleSaveChanges: () => void;
}

export function DatasetDetailsSection({
  dataset,
  isOwner,
  currentAccount,
  resolveNameServiceNames,
  editablePrice,
  setEditablePrice,
  editableVisibility,
  setEditableVisibility,
  isEditing,
  setIsEditing,
  isProcessingTx,
  handleSaveChanges,
}: DatasetDetailsSectionProps) {
  const getShortModelName = (modelName: string) => {
    return modelName.split("/").pop();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
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
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isProcessingTx}>
                <Edit3 size={18} className="mr-2" />
                Edit Details
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Dataset Details</DialogTitle>
                <DialogDescription>
                  Modify the dataset's price and visibility.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editableVisibility">Visibility</Label>
                  <Select
                    value={String(editableVisibility)}
                    onValueChange={(value) => setEditableVisibility(Number(value))}
                  >
                    <SelectTrigger id="editableVisibility">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Public (Sellable)</SelectItem>
                      <SelectItem value="1">Private (Not Sellable)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editableVisibility === 0 && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="editablePrice">Price (in USDC)</Label>
                    <Input
                      id="editablePrice"
                      type="number"
                      value={editablePrice ? editablePrice : ""}
                      onChange={(e) => setEditablePrice(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSaveChanges} disabled={isProcessingTx}>
                  {isProcessingTx ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-6">
        <p className="text-base">{dataset.description || "No description provided."}</p>
      </div>

      {/* Dataset Details Card */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Dataset Details</CardTitle></CardHeader>
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
                <p className="text-sm font-medium">Walrus Blob ID</p>
                <p className="text-sm font-mono break-all">{dataset.blobId ?? "N/A"}</p>
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
    </div>
  );
}