"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useAccount } from 'wagmi';
import { toast } from "sonner";
import { notFound } from "next/navigation";
import { DatasetObject } from "@/lib/types";
import { getDataset } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { CALIBRATION_BAYANAT_CONTRACT } from "@/lib/constants";
import { Address } from "viem";

// Import the new components
import { DatasetHeader } from "@/components/dataset/DatasetHeader";
import { DatasetDescription } from "@/components/dataset/DatasetDescription";
import { DatasetDetailsCard } from "@/components/dataset/DatasetDetailsCard";
import { DatasetActionsCard } from "@/components/dataset/DatasetActionsCard";
import { EditDatasetDialog } from "@/components/dataset/EditDatasetDialog";
import { IpfsDatasetContent } from "@/components/dataset/IpfsDatasetContent";

export default function DatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address: currentAccount } = useAccount();

  // Core state
  const [dataset, setDataset] = useState<DatasetObject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Access and ownership state
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isProcessingTx, setIsProcessingTx] = useState<boolean>(false);
  const [editablePrice, setEditablePrice] = useState<number | null>(null);
  const [editableVisibility, setEditableVisibility] = useState<number>(0);
  
  // Content state (managed by IpfsDatasetContent)
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  
  // Success/error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validate Ethereum address format
  const isEthereumAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address) || /^\d+$/.test(address);
  };

  // Fetch dataset data
  const fetchDatasetData = useCallback(async () => {
    if (id) {
      try {
        setIsLoading(true);
        const ds = await getDataset(id);
        
        if (!ds) {
          notFound();
          return;
        }
        
        setDataset(ds);
        const ownerCheck = currentAccount === ds.owner;
        setIsOwner(ownerCheck);
        setHasAccess(ownerCheck || !!(ds?.allowlist.includes(currentAccount || "notanethereumaddress")));
        setEditablePrice(ds.price);
        setEditableVisibility(ds.visibility.inner);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch dataset metadata:", err);
        setError(`Failed to load dataset: ${err.message}`);
        setDataset(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [id, currentAccount]);

  // Load dataset on mount and when account changes
  useEffect(() => {
    fetchDatasetData();
  }, [fetchDatasetData]);

  // Handle save changes (placeholder - implement actual contract calls)
  const handleSaveChanges = async () => {
    if (!dataset || !currentAccount || currentAccount !== dataset.owner) return;

    setIsProcessingTx(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // TODO: Implement actual contract calls for updating dataset
      // For now, just show success message
      setSuccessMessage("Dataset details updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Transaction failed:", err);
      setError(`Failed to update dataset: ${err.message}`);
    } finally {
      setIsProcessingTx(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!parsedData || !dataset) return;
    const dataToDownload = parsedData.map(item => item.row);
    const jsonString = JSON.stringify(dataToDownload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const filename = dataset.name ? `${dataset.name.replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/gi, '')}.json` : `${dataset.id}.json`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle data parsed from IPFS content
  const handleDataParsed = useCallback((newParsedData: any[], newFeatures: string[]) => {
    setParsedData(newParsedData);
    setFeatures(newFeatures);
  }, []);

  // Name service resolution
  const resolveNameServiceNames = useCallback(async (address: string) => {
    // ENS resolution can be implemented here for Ethereum-based chains
    // For now, return empty string as placeholder
    return "";
  }, []);

  // Loading state
  if (isLoading && !dataset) {
    return <div className="container mx-auto pt-30 sm:pt-20 text-center">Loading dataset metadata...</div>;
  }

  // Error state
  if (error && !dataset) {
    return (
      <div className="container mx-auto pt-30 sm:pt-20 text-center text-red-600">
        <AlertCircle className="inline mr-2" />
        {error}
      </div>
    );
  }

  // Skeleton loading state
  if (!dataset) {
    return (
      <div className="container mx-auto pt-30 sm:pt-20 space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-grow">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-30 sm:pt-20 space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 border rounded-lg shadow bg-green-100 text-green-700">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-4 border rounded-lg shadow bg-red-100 text-red-700">
          <AlertCircle className="inline mr-2" />
          {error}
        </div>
      )}

      {/* Dataset Header */}
      <DatasetHeader
        dataset={dataset}
        isOwner={isOwner}
        currentAccount={currentAccount}
        resolveNameServiceNames={resolveNameServiceNames}
        onEditClick={() => setIsEditing(true)}
        isProcessingTx={isProcessingTx}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dataset Description */}
          <DatasetDescription dataset={dataset} />

          {/* IPFS Dataset Content */}
          {dataset.blobId && (
            <IpfsDatasetContent
              datasetId={dataset.id}
              blobId={dataset.blobId}
              hasAccess={hasAccess}
              currentAccount={currentAccount}
              marketAddress={CALIBRATION_BAYANAT_CONTRACT as Address}
              onDataParsed={handleDataParsed}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Actions Card */}
          <DatasetActionsCard
            dataset={dataset}
            currentAccount={currentAccount}
            hasAccess={hasAccess}
            isLoading={isLoading}
            isProcessingTx={isProcessingTx}
            parsedData={parsedData}
            handleDownload={handleDownload}
            marketAddress={CALIBRATION_BAYANAT_CONTRACT as Address}
          />

          {/* Details Card */}
          <DatasetDetailsCard dataset={dataset} />
        </div>
      </div>

      {/* Edit Dialog */}
      <EditDatasetDialog
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        editablePrice={editablePrice}
        setEditablePrice={setEditablePrice}
        editableVisibility={editableVisibility}
        setEditableVisibility={setEditableVisibility}
        isProcessingTx={isProcessingTx}
        handleSaveChanges={handleSaveChanges}
      />
    </div>
  );
}