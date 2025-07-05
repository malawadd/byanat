"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import DatasetViewer from "@/components/dataset-viewer";
import DecryptDatasetButton from "@/components/DecryptDatasetButton";
import { Address } from "viem";

interface IpfsDatasetContentProps {
  datasetId: string;
  blobId: string;
  hasAccess: boolean;
  currentAccount: string | undefined;
  marketAddress: Address;
  onDataParsed: (parsedData: any[], features: string[]) => void;
}

export function IpfsDatasetContent({
  datasetId,
  blobId,
  hasAccess,
  currentAccount,
  marketAddress,
  onDataParsed,
}: IpfsDatasetContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decryptedCid, setDecryptedCid] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [features, setFeatures] = useState<string[]>([]);

  // Handle successful decryption
  const handleDecrypted = useCallback(async (cid: string) => {
    setDecryptedCid(cid);
    setIsLoading(true);
    setError(null);

    try {
      // Fetch data from IPFS using the decrypted CID
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
      const response = await fetch(ipfsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
      }

      const jsonData = await response.json();

      // Parse the dataset structure
      if (jsonData && Array.isArray(jsonData.features) && Array.isArray(jsonData.rows)) {
        const extractedFeatures = jsonData.features.map((feature: { name: string }) => feature.name);
        setFeatures(extractedFeatures);

        const formattedForViewer = jsonData.rows.map((dataRow: { 
          row_idx: number, 
          row: any, 
          signature: string, 
          response_hash: string 
        }) => ({
          row_idx: dataRow.row_idx,
          row: dataRow.row,
          signature: dataRow.signature,
          response_hash: dataRow.response_hash,
        }));
        
        setParsedData(formattedForViewer);
        onDataParsed(formattedForViewer, extractedFeatures);
      } else {
        throw new Error("Dataset content is not in the expected format.");
      }
    } catch (err: any) {
      console.error("Failed to fetch or parse IPFS data:", err);
      setError(`Failed to load dataset from IPFS: ${err.message}`);
      setParsedData(null);
      setFeatures([]);
      onDataParsed([], []);
    } finally {
      setIsLoading(false);
    }
  }, [onDataParsed]);

  // Reset state when dataset changes
  useEffect(() => {
    setDecryptedCid(null);
    setParsedData(null);
    setFeatures([]);
    setError(null);
    onDataParsed([], []);
  }, [datasetId, blobId, onDataParsed]);

  // Don't show anything if no current account
  if (!currentAccount) {
    return (
      <div className="p-4 border rounded-lg shadow bg-blue-100 text-blue-700 flex items-center">
        <AlertCircle className="mr-2 h-5 w-5" /> 
        Please connect your wallet to attempt decryption and view dataset contents.
      </div>
    );
  }

  // Don't show anything if user doesn't have access
  if (!hasAccess) {
    return (
      <div className="p-4 border rounded-lg shadow bg-yellow-100 text-yellow-800 flex items-center">
        <AlertCircle className="mr-2 h-5 w-5" /> 
        You don't have access to this dataset. Purchase access to view the content.
      </div>
    );
  }

  // Show decrypt button if not yet decrypted
  if (!decryptedCid && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dataset Content</CardTitle>
          <CardDescription>
            Decrypt the dataset to view its contents from IPFS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DecryptDatasetButton
            marketAddress={marketAddress}
            datasetId={BigInt(datasetId)}
            onDecrypted={handleDecrypted}
          />
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg shadow bg-blue-100 text-blue-700 flex items-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading dataset content from IPFS... Please wait.
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 border rounded-lg shadow bg-red-100 text-red-700 flex items-center">
        <AlertCircle className="mr-2 h-5 w-5" /> 
        {error}
      </div>
    );
  }

  // Show dataset content
  if (parsedData && features.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dataset Content Preview</CardTitle>
          <CardDescription>
            Decrypted content loaded from IPFS (CID: {decryptedCid}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatasetViewer features={features} data={parsedData} />
        </CardContent>
      </Card>
    );
  }

  // Fallback state
  return (
    <div className="p-4 border rounded-lg shadow bg-yellow-100 text-yellow-800 flex items-center">
      <AlertCircle className="mr-2 h-5 w-5" /> 
      Dataset content is available but could not be displayed. This might be due to formatting issues.
    </div>
  );
}