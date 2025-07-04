import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useSignMessage,
} from "wagmi";
import { Button } from "@/components/ui/button";
import datasetAbi from "@/lib/abi.json";
import {
  Address,
  bytesToHex,
  hexToBytes,
  keccak256,
  recoverPublicKey,
} from "viem";
import { uploadJSONToIPFS } from "../../app/actions/uploadJSONToIPFS";
import { encrypt } from "ecies-geth"; // npm i ecies-geth
import { encryptString } from '@lit-protocol/encryption';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';

/**
 * Replace with the deployed DatasetMarketplace address
 */
const MARKET_ADDRESS: Address = "0x94bbeB401C17FB70C704E28920501752B78dc659" as Address;



interface Props {
  datasetId: bigint;
  numRows?: bigint;
  numTokens?: bigint;
}

export default function LockDatasetButton({
  datasetId,
  numRows = BigInt(100),
  numTokens = BigInt(100),
}: Props) {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const { signMessageAsync } = useSignMessage();

  const [stage, setStage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  

  async function handleLock() {
    if (!address) return;
    try {
      /** 1️⃣ Upload dummy JSON to IPFS via Pinata */
      const lit = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilDev });
        await lit.connect();
      console.log("LitNodeClient connected", lit);
      setStage("lit connected ✅");

        /* ACC: contract.canDecrypt(id, :userAddress) must be true */
  const acc = [
    {
      contractAddress: MARKET_ADDRESS,
      standardContractType: '',
      chain: 'filecoinCalibrationTestnet',
      method: 'canDecrypt',
      parameters: [datasetId.toString(), ':userAddress'],
      returnValueTest: { comparator: '=', value: 'true' },
    },
  ];


      setStage("Uploading to IPFS…");
      const cid = await uploadJSONToIPFS({
        data: { timestamp: Date.now(), owner: address, demo: true },
      });

      /** 2️⃣ Encrypt CID with fresh AES‑GCM key */
      setStage("Encrypting CID…");
       const { ciphertext, dataToEncryptHash  } = await encryptString(
            { accessControlConditions: acc, dataToEncrypt: cid },
            lit
        );
    
        console.log("Encrypted CID:", ciphertext);
        console.log("Data to encrypt hash:", dataToEncryptHash);
    
        const cipherBytes = Buffer.from(ciphertext, 'base64');          // raw binary
        const hashBytes   = Buffer.from(dataToEncryptHash, 'base64');
        console.log("Cipher bytes:", `0x${cipherBytes.toString('hex')}`);
        console.log("Hash bytes:", `0x${hashBytes.toString('hex')}`);
        const cipherHex = `0x${cipherBytes.toString('hex')}`;
        const hashHex   = `0x${hashBytes.toString('hex')}`;

        const cipherUint8 = new Uint8Array(cipherBytes);
        const hashUint8   = new Uint8Array(hashBytes); // raw bytes
        console.log("Cipher Uint8Array:", cipherUint8);
        console.log("Hash Uint8Array:", hashUint8);

        const cipherUint82 = Buffer.from(cipherHex.slice(2), 'hex').toString('base64');  // raw bytes
        const hashUint82   = Buffer.from(hashHex.slice(2),   'hex').toString('base64'); 
        console.log("Cipher Uint8Array from hex:", cipherUint82);
        console.log("Hash Uint8Array from hex:", hashUint82);

      /** 4️⃣ Write to smart‑contract */
      setStage("Locking on‑chain…");
      await writeContractAsync({
        address: MARKET_ADDRESS,
        abi: datasetAbi,
        functionName: 'lockDataset',
        args: [
          datasetId,
          `0x${cipherBytes.toString('hex')}`,   
          `0x${hashBytes.toString('hex')}`,     
          numRows,
          numTokens,
        ],
      });
      setStage("Dataset locked ✅");
    } catch (err: any) {
      setError(err?.message ?? "Lock failed");
      setStage(undefined);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleLock} disabled={isPending}>
        {isPending ? stage ?? "Working…" : "Lock dataset (secure)"}
      </Button>
      {error && <p className="text-sm text-destructive">Error: {error}</p>}
    </div>
  );
}
