"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDatasetMarketplace } from "@/hooks/useDatasetMarketplace";
import { useSignMessage } from "wagmi";
import { Address } from "viem";
import { Loader2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { decryptToString } from "@lit-protocol/encryption";
import {
  createSiweMessage,
  generateAuthSig,
  LitAccessControlConditionResource,
} from "@lit-protocol/auth-helpers";
import { LIT_ABILITY, LIT_NETWORK } from "@lit-protocol/constants";
import { useEthersSigner } from '@/hooks/ether';

// ABI for the canDecrypt function
const canDecryptAbi = {
  constant: true,
  inputs: [
    { internalType: "uint256", name: "id", type: "uint256" },
    { internalType: "address", name: "user", type: "address" }
  ],
  name: "canDecrypt",
  outputs: [{ internalType: "bool", name: "", type: "bool" }],
  stateMutability: "view",
  type: "function"
};

interface Props {
  marketAddress: Address;
  datasetId: bigint;
  onDecrypted?: (cid: string) => void;
  disabled?: boolean;
}

export default function DecryptDatasetButton({ 
  marketAddress, 
  datasetId, 
  onDecrypted, 
  disabled 
}: Props) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [stage, setStage] = useState<string>("");
  const { signMessageAsync } = useSignMessage();
  const signer = useEthersSigner();
  const { 
    address, 
    useCanDecrypt, 
    useGetStorageInfo 
  } = useDatasetMarketplace(marketAddress);

  // Check if user can decrypt
  const { data: canDecrypt } = useCanDecrypt(datasetId, address);
  
  // Get storage info
  const { data: storageInfo } = useGetStorageInfo(datasetId);

  const handleDecrypt = async () => {
    if (!address || !signer) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!canDecrypt) {
      toast.error("You don't have permission to decrypt this dataset");
      return;
    }

    if (!storageInfo || !Array.isArray(storageInfo)) {
      toast.error("Storage information not available");
      return;
    }

    setIsDecrypting(true);
    try {
      const [encCidHex, dataHashHex] = storageInfo as [string, string];

      // Convert hex to base64
      setStage("Preparing decryption...");
      const ciphertext = Buffer.from(encCidHex.slice(2), "hex").toString("base64");
      const dataToEncryptHash = Buffer.from(dataHashHex.slice(2), "hex").toString("base64");

      // Define access control conditions
      const accessControlConditions = [
        {
          contractAddress: marketAddress,
          functionName: "canDecrypt",
          functionParams: [datasetId.toString(), ":userAddress"],
          functionAbi: canDecryptAbi,
          chain: "filecoinCalibrationTestnet",
          returnValueTest: { comparator: "=", value: "true" },
        },
      ];

      // Connect to Lit Protocol
      setStage("Connecting to Lit Protocol...");
      const lit = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilDev });
      await lit.connect();

      // Get session signatures
      setStage("Authenticating...");
      const sessionSigs = await lit.getSessionSigs({
        chain: "filecoinCalibrationTestnet",
        expiration: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
        resourceAbilityRequests: [
          {
            resource: new LitAccessControlConditionResource("*"),
            ability: LIT_ABILITY.AccessControlConditionDecryption,
          },
        ],
        authNeededCallback: async ({
          uri,
          expiration,
          resourceAbilityRequests,
        }) => {
          const toSign = await createSiweMessage({
            uri: uri,
            expiration: expiration,
            resources: resourceAbilityRequests,
            walletAddress: address,
            nonce: await lit.getLatestBlockhash(),
            litNodeClient: lit,
          });

          const authSig = await generateAuthSig({
            signer: signer,
            toSign,
          });
          return authSig;
        },
      });

      // Decrypt the CID
      setStage("Decrypting dataset...");
      const decryptedCid = await decryptToString(
        {
          evmContractConditions: accessControlConditions,
          chain: "filecoinCalibrationTestnet",
          ciphertext: ciphertext,
          dataToEncryptHash: dataToEncryptHash,
          sessionSigs: sessionSigs,
        },
        lit,
      );

      toast.success("Dataset decrypted successfully!");
      onDecrypted?.(decryptedCid);
    } catch (error: any) {
      console.error("Decryption failed:", error);
      toast.error(`Decryption failed: ${error.message}`);
    } finally {
      setIsDecrypting(false);
      setStage("");
    }
  };

  return (
    <Button 
      onClick={handleDecrypt} 
      disabled={disabled || isDecrypting || !address || !canDecrypt}
      variant="default"
    >
      {isDecrypting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {stage || "Decrypting..."}
        </>
      ) : (
        <>
          <Unlock className="mr-2 h-4 w-4" />
          Decrypt Dataset
        </>
      )}
    </Button>
  );
}