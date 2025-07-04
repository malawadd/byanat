"use client";

import { useState } from "react";
import {
  useAccount,
  usePublicClient,
  useSignMessage,
} from "wagmi";
import { Button } from "@/components/ui/button";
import datasetAbi from "@/lib/abi.json";            // has getStorageInfo()
import { Address } from "viem";

import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { decryptToString } from "@lit-protocol/encryption";
import {
  createSiweMessageWithRecaps,
  createSiweMessage,
  generateAuthSig,
  LitAccessControlConditionResource,
} from "@lit-protocol/auth-helpers";
import { LIT_ABILITY, LIT_NETWORK } from "@lit-protocol/constants";
import { hashAccessControlConditions } from "@lit-protocol/access-control-conditions";
import { useEthersSigner } from '@/hooks/ether';

/* ----------  ABI for the custom condition  ---------- */
const canDecryptAbi = {
  constant: true,
  "inputs": [
    {
      "internalType": "uint256",
      "name": "id",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
    }
  ],
  "name": "canDecrypt",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}

/* ----------  Component  ---------- */
interface Props {
  datasetId: bigint;
  marketAddress: Address;
  onDecrypted?: (cid: string) => void;
}

export default function DecryptDatasetButton({
  datasetId,
  marketAddress,
  onDecrypted,
}: Props) {
  const { address: walletAddress } = useAccount();
  const publicClient             = usePublicClient();
  const { signMessageAsync }      = useSignMessage();
  const [busy, setBusy]          = useState(false);
  const signer = useEthersSigner()

  /* ------ click ------ */
  const handleClick = async () => {
    if (!walletAddress) return alert("Connect wallet first");
    setBusy(true);

    try {
      /* ── 0. Does the contract itself think you can decrypt? ───────── */
      const permitted = await publicClient?.readContract({
        address: marketAddress,
        abi: datasetAbi,
        functionName: "canDecrypt",
        args: [datasetId, walletAddress],          // <-- keep this order!
      });
      console.log("canDecrypt() on-chain returns ➜", permitted);
      if (!permitted) {
        alert("Smart-contract says you are NOT permitted – stopping.");
        return;
      }

      /* ── 1. Pull ciphertext & hash from chain ─────────────────────── */
      const [encCidHex, dataHashHex] = (await publicClient?.readContract({
        address: marketAddress,
        abi: datasetAbi,
        functionName: "getStorageInfo",
        args: [datasetId],
      })) as [string, string];

      console.log("-------------------------------------------datasetId ➜");
      console.log("encCidHex ➜", encCidHex);
      console.log("dataHashHex ➜", dataHashHex);

      const ciphertext       = Buffer.from(encCidHex.slice(2), "hex").toString("base64");
      const dataToEncryptHash = Buffer.from(dataHashHex.slice(2), "hex").toString("base64");

      /* ── 2. Access-control condition object ───────────────────────── */
      const accessControlConditions = [
        {
          contractAddress: marketAddress,
          functionName:    "canDecrypt",
          functionParams:  [datasetId.toString(), ":userAddress"],
          functionAbi:     canDecryptAbi,
          chain:           "filecoinCalibrationTestnet",
          returnValueTest: { comparator: "=", value: "true" },
        },
      ];

      /* ── 3. Resource (use * while debugging) ──────────────────────── */
      // If you prefer hashes, swap '*' with new LitAccessControlConditionResource(accHashHex)
      const resource = new LitAccessControlConditionResource("*");

      /* ── 4. Connect to Lit ─────────────────────────────────────────── */
      const lit = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilDev });
      await lit.connect();

      /* ── 5. Get session-sigs (signs SIWE only once) ───────────────── */
      const sessionSigs = await lit.getSessionSigs({
        chain: "filecoinCalibrationTestnet",
        expiration: new Date(Date.now() + 10 * 60 * 1_000).toISOString(), // 10 min
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
            expiration:expiration,                     
            resources: resourceAbilityRequests,
            walletAddress:walletAddress,
            nonce: await lit.getLatestBlockhash(),
            litNodeClient: lit,
          });

          const authSig = await generateAuthSig({
            signer: signer!,
            toSign,
          });
          console.log("authSig ➜", authSig);
          return authSig;
        },
      });
      console.log("sessionSigs ➜", sessionSigs);

      const msg = `Lit access check for dataset #${datasetId}`;
      const sig = await signMessageAsync({ message: msg });



      console.log("-------------------------------------------------decpypt ➜");
      console.log("-------------------------------------------------decpypt ➜");
      console.log("-------------------------------------------------decpypt ➜");



      /* ── 6. Decrypt ───────────────────────────────────────────────── */
      const cid = await decryptToString(
        {
          evmContractConditions :accessControlConditions,
          chain: "filecoinCalibrationTestnet",
          ciphertext:ciphertext,
          dataToEncryptHash:dataToEncryptHash,
          sessionSigs:sessionSigs,
        },
        lit,
      );

      console.log("DECRYPTED CID ➜", cid);
      onDecrypted?.(cid);
      alert(`CID unlocked:\n${cid}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Decryption failed (see console)");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button disabled={busy} onClick={handleClick}>
      {busy ? "Decrypting…" : "Unlock Dataset"}
    </Button>
  );
}
