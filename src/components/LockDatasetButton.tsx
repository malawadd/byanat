"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDatasetMarketplace } from "@/hooks/useDatasetMarketplace";
import { Address } from "viem";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadJSONToIPFS } from "@/app/actions/uploadJSONToIPFS";
import { encryptString } from '@lit-protocol/encryption';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { SyntheticDataResultItem } from "@/lib/types";
import { sanitizeDataset } from "@/utils/datasetUtils";

interface Props {
  marketAddress: Address;
  datasetId: bigint;
  syntheticDatasetOutput: SyntheticDataResultItem[];
  inputFeature: string;
  onLocked?: () => void;
  disabled?: boolean;
}

export default function LockDatasetButton({ 
  marketAddress, 
  datasetId, 
  syntheticDatasetOutput, 
  inputFeature,
  onLocked, 
  disabled 
}: Props) {
  const [isLocking, setIsLocking] = useState(false);
  const [stage, setStage] = useState<string>("");
  const { lockDataset, address } = useDatasetMarketplace(marketAddress);

  const handleLock = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!syntheticDatasetOutput.length) {
      toast.error("No dataset to lock");
      return;
    }

    setIsLocking(true);
    try {
      // Step 1: Sanitize and prepare dataset
      setStage("Preparing dataset...");
      const sanitizedData = sanitizeDataset(syntheticDatasetOutput, inputFeature);
      const datasetJson = JSON.parse(new TextDecoder().decode(sanitizedData));

      // Step 2: Upload to IPFS
      setStage("Uploading to IPFS...");
      const cid = await uploadJSONToIPFS(datasetJson);

      // Step 3: Initialize Lit Protocol
      setStage("Connecting to Lit Protocol...");
      const lit = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilDev });
      await lit.connect();

      // Step 4: Define access control conditions
      const accessControlConditions = [
        {
          contractAddress: marketAddress,
          standardContractType: '',
          chain: 'filecoinCalibrationTestnet',
          method: 'canDecrypt',
          parameters: [datasetId.toString(), ':userAddress'],
          returnValueTest: { comparator: '=', value: 'true' },
        },
      ];

      // Step 5: Encrypt the CID
      setStage("Encrypting dataset...");
      const { ciphertext, dataToEncryptHash } = await encryptString(
        { accessControlConditions, dataToEncrypt: cid },
        lit
      );

      // Step 6: Convert to hex format for contract
      const cipherBytes = Buffer.from(ciphertext, 'base64');
      const hashBytes = Buffer.from(dataToEncryptHash, 'base64');
      const encryptedCidHex = `0x${cipherBytes.toString('hex')}`;
      const dataHashHex = `0x${hashBytes.toString('hex')}`;

      // Step 7: Lock dataset on-chain
      setStage("Locking on-chain...");
      await lockDataset({
        datasetId,
        encryptedCid: encryptedCidHex,
        dataHash: dataHashHex,
        numRows: BigInt(syntheticDatasetOutput.length),
        numTokens: BigInt(syntheticDatasetOutput.reduce((sum, item) => 
          sum + (item.usage?.totalTokens || 0), 0
        )),
      });

      toast.success("Dataset locked successfully!");
      onLocked?.();
    } catch (error: any) {
      console.error("Locking failed:", error);
      toast.error(`Locking failed: ${error.message}`);
    } finally {
      setIsLocking(false);
      setStage("");
    }
  };

  return (
    <Button 
      onClick={handleLock} 
      disabled={disabled || isLocking || !address || !syntheticDatasetOutput.length}
      className="w-full"
    >
      {isLocking ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {stage || "Locking Dataset..."}
        </>
      ) : (
        "Lock Dataset"
      )}
    </Button>
  );
}