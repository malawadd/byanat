"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { Button } from "@/components/ui/button";
import datasetAbi from "@/lib/abi.json";
import { Address, zeroAddress } from "viem";

// Minimal ERC‑20 ABI (approve + allowance)
const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

interface Props {
  datasetId: bigint;
  marketAddress: Address;
}

export default function BuyDatasetButton({ datasetId, marketAddress }: Props) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();

  /* --- 1. Read price & USDC token address --- */
  const { data: coreData } = useReadContract({
    abi: datasetAbi,
    address: marketAddress,
    functionName: "getCore",
    args: [datasetId],
  });
  const price: bigint | undefined =
    Array.isArray(coreData) ? (coreData[2] as bigint) : undefined;

  const { data: usdcAddress } = useReadContract({
    abi: datasetAbi,
    address: marketAddress,
    functionName: "usdc",
  });

  /* --- 2. Allowance --- */
  const { data: allowanceData } = useReadContract({
    abi: erc20Abi,
    address: usdcAddress as Address | undefined,
    functionName: "allowance",
    args: [address ?? zeroAddress, marketAddress],
    query: { enabled: Boolean(address && usdcAddress) },
  });
  const allowance: bigint = (allowanceData as bigint | undefined) ?? BigInt(0);

  const needsApproval = price !== undefined && allowance < price;

  /* --- 3. Write helpers --- */
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  const { isLoading: txPending } = useWaitForTransactionReceipt({ hash: pendingHash });

  const buttonDisabled = !address || isWritePending || txPending || price === undefined;

  async function handleClick() {
    if (!address || price === undefined || !usdcAddress) return;

    try {
      // Step 1: approve if needed
      if (needsApproval) {
        const approveHash = await writeContractAsync({
          abi: erc20Abi,
          address: usdcAddress as Address,
          functionName: "approve",
          args: [marketAddress, price],
        });
        setPendingHash(approveHash);
        await publicClient!.waitForTransactionReceipt({ hash: approveHash });
      }

      // Step 2: buy dataset
      const buyHash = await writeContractAsync({
        abi: datasetAbi,
        address: marketAddress,
        functionName: "downloadDataset",
        args: [datasetId],
      });
      setPendingHash(buyHash);
    } catch (err) {
      console.error(err);
    }
  }

  const label =
    isWritePending || txPending
      ? "Processing…"
      : needsApproval
      ? "Approve & Buy"
      : "Buy Dataset";

  return (
    <Button disabled={buttonDisabled} onClick={handleClick} className="w-full">
      {label}
    </Button>
  );
}
