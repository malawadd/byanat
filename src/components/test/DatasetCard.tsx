"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
} from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import datasetAbi from "@/lib/abi.json";
import { Address, hexToString } from "viem";

interface Props {
  datasetId: bigint;
  marketAddress: Address;
}

export default function DatasetCard({ datasetId, marketAddress }: Props) {
  const { address } = useAccount();
  const [cid, setCid] = useState<string | null>(null);

  /* 1. Core data */
  const { data: coreData } = useReadContract({
    abi: datasetAbi,
    address: marketAddress,
    functionName: "getCore",
    args: [datasetId],
  });

  const price: bigint | undefined = Array.isArray(coreData)
    ? (coreData[2] as bigint)
    : undefined;
  const name: string | undefined = Array.isArray(coreData)
    ? (coreData[6] as string)
    : undefined;
  const description: string | undefined = Array.isArray(coreData)
    ? (coreData[7] as string)
    : undefined;

  /* 2. Check decrypt rights */
  const { data: canDecryptData } = useReadContract({
    abi: datasetAbi,
    address: marketAddress,
    functionName: "canDecrypt",
    args: [datasetId, address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(address) },
  });
  const canDecrypt: boolean = (canDecryptData as boolean | undefined) ?? false;

  /* 3. If allowed, fetch CID */
  const { data: storageInfo } = useReadContract({
    abi: datasetAbi,
    address: marketAddress,
    functionName: "getStorageInfo",
    args: [datasetId],
    query: { enabled: canDecrypt },
  });

  useEffect(() => {
    if (canDecrypt && storageInfo && Array.isArray(storageInfo)) {
      const encCidHex = storageInfo[0] as `0x${string}`;
      // In production you'd decrypt here. For demo we assume plaintext hex → utf8
      try {
        const decoded = hexToString(encCidHex);
        setCid(decoded);
      } catch (e) {
        console.error("Failed to decode CID", e);
      }
    }
  }, [canDecrypt, storageInfo]);

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{name ?? `Dataset #${datasetId.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}

        {price !== undefined && (
          <p className="font-medium">Price: {(Number(price) / 1_000_000).toLocaleString()} USDC</p>
        )}

        {canDecrypt ? (
          cid ? (
            <div className="space-y-2">
              <p className="text-green-600 font-semibold">Unlocked ✅</p>
              <p className="break-all text-sm">CID: {cid}</p>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${cid}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">Open on IPFS</Button>
              </a>
            </div>
          ) : (
            <p>Decrypting…</p>
          )
        ) : (
          <p className="text-red-500">Locked 🔒 — buy to unlock</p>
        )}
      </CardContent>
    </Card>
  );
}
