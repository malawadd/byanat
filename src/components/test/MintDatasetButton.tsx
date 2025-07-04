import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button"; // shadcn/ui button
import datasetAbi from "@/lib/abi.json";
import { Address, parseUnits } from "viem";

/**
 * Update this constant with the deployed address of your DatasetMarketplace
 * contract on the current chain.
 */
const MARKET_ADDRESS: Address = "0x94bbeB401C17FB70C704E28920501752B78dc659" as Address;

/**
 * Dummy arguments to demonstrate minting.
 * Replace with real values in production.
 */
const DUMMY_ARGS = {
    hfPath: "hf/path",            // Hugging Face repo or dataset ID
    hfConfig: "default",
    hfSplit: "train",
    hfRevision: "main",
    Visibility: 0, // 0 = public, 1 = private
    name: "Cats‑1M",               // dataset name shown on-chain
    description: "1 million cat captions for ML demos",
    priceUSDC: parseUnits("1", 6), // 1 USDC → bigint 1000000
    modelName: "Llama‑3‑8B",
    taskSmallId: BigInt(10),
    nodeSmallId: BigInt(4),
    pricePerMilCU: BigInt(15000),   // arbitrary demo numbers
    maxNumCU: BigInt(100)
  };
  

/**
 * MintDatasetButton – simple one‑click demo that mints a dataset with
 * hard‑coded dummy data.  Exposes the tx hash once mined.
 */
export default function MintDatasetButton() {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState<string | null>(null);

  // wagmi v2 mutation for writeContract
  const { writeContract, isPending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => setTxHash(hash as `0x${string}`),
      onError: (err) => alert(err.message),
    },
  });

  const handleMint = () => {
    if (!address) {
      alert("Connect your wallet first");
      return;
    }

    writeContract({
      abi: datasetAbi as any,
      address: MARKET_ADDRESS,
      functionName: "mintDataset",
      args: [
        DUMMY_ARGS.hfPath,
        DUMMY_ARGS.hfConfig,
        DUMMY_ARGS.hfSplit,
        DUMMY_ARGS.hfRevision,
        DUMMY_ARGS.Visibility,
        DUMMY_ARGS.name,
        DUMMY_ARGS.description,
        DUMMY_ARGS.priceUSDC,
        DUMMY_ARGS.modelName,
        DUMMY_ARGS.taskSmallId,
        DUMMY_ARGS.nodeSmallId,
        DUMMY_ARGS.pricePerMilCU,
        DUMMY_ARGS.maxNumCU,
        
      ],
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleMint} disabled={isPending} className="w-fit">
        {isPending ? "Minting…" : "Mint Dummy Dataset"}
      </Button>

      {txHash && (
        <p className="text-sm break-all">
          ✅ Tx submitted:&nbsp;
          <a
            href={`https://calibration.filfox.info/en/message/${txHash}`}
            className="underline text-blue-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            {txHash}
          </a>
        </p>
      )}
    </div>
  );
}
