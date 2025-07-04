import { useState } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { Address, parseUnits } from 'viem';
import datasetAbi from '@/lib/abi.json';

// Types for contract interactions
export interface DatasetCore {
  version: number;
  owner: Address;
  price: bigint;
  visibility: number;
  balance: bigint;
  downloads: bigint;
  name: string;
  description: string;
}

export interface StorageInfo {
  encryptedCid: string;
  dataHash: string;
}

export interface MintDatasetParams {
  hfPath: string;
  hfConfig: string;
  hfSplit: string;
  hfRevision: string;
  visibility: number;
  name: string;
  description: string;
  priceUSDC: bigint;
  modelName: string;
  taskSmallId: bigint;
  nodeSmallId: bigint;
  pricePerMilCU: bigint;
  maxNumCU: bigint;
}

export interface LockDatasetParams {
  datasetId: bigint;
  encryptedCid: string;
  dataHash: string;
  numRows: bigint;
  numTokens: bigint;
}

export function useDatasetMarketplace(marketAddress: Address) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isTxPending } = useWaitForTransactionReceipt({ 
    hash: pendingTxHash 
  });

  // Read contract functions
  const useGetDatasetCore = (datasetId: bigint) => {
    return useReadContract({
      abi: datasetAbi,
      address: marketAddress,
      functionName: 'getCore',
      args: [datasetId],
      query: { enabled: Boolean(datasetId) },
    });
  };

  const useCanDecrypt = (datasetId: bigint, userAddress?: Address) => {
    return useReadContract({
      abi: datasetAbi,
      address: marketAddress,
      functionName: 'canDecrypt',
      args: [datasetId, userAddress || '0x0000000000000000000000000000000000000000'],
      query: { enabled: Boolean(datasetId && userAddress) },
    });
  };

  const useGetStorageInfo = (datasetId: bigint) => {
    return useReadContract({
      abi: datasetAbi,
      address: marketAddress,
      functionName: 'getStorageInfo',
      args: [datasetId],
      query: { enabled: Boolean(datasetId) },
    });
  };

  const useGetUsdcAddress = () => {
    return useReadContract({
      abi: datasetAbi,
      address: marketAddress,
      functionName: 'usdc',
    });
  };

  // Write contract functions
  const mintDataset = async (params: MintDatasetParams): Promise<bigint> => {
    try {
      const hash = await writeContractAsync({
        abi: datasetAbi,
        address: marketAddress,
        functionName: 'mintDataset',
        args: [
          params.hfPath,
          params.hfConfig,
          params.hfSplit,
          params.hfRevision,
          params.visibility,
          params.name,
          params.description,
          params.priceUSDC,
          params.modelName,
          params.taskSmallId,
          params.nodeSmallId,
          params.pricePerMilCU,
          params.maxNumCU,
        ],
      });

      setPendingTxHash(hash);
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      
      // Extract dataset ID from transaction logs
      // This assumes the contract emits an event with the dataset ID
      // You may need to adjust this based on your contract's event structure
      const datasetId = BigInt(receipt.logs[0]?.topics[1] || '0');
      return datasetId;
    } catch (error) {
      console.error('Error minting dataset:', error);
      throw error;
    }
  };

  const lockDataset = async (params: LockDatasetParams): Promise<void> => {
    try {
      const hash = await writeContractAsync({
        abi: datasetAbi,
        address: marketAddress,
        functionName: 'lockDataset',
        args: [
          params.datasetId,
          params.encryptedCid,
          params.dataHash,
          params.numRows,
          params.numTokens,
        ],
      });

      setPendingTxHash(hash);
      await publicClient!.waitForTransactionReceipt({ hash });
    } catch (error) {
      console.error('Error locking dataset:', error);
      throw error;
    }
  };

  const downloadDataset = async (datasetId: bigint): Promise<void> => {
    try {
      const hash = await writeContractAsync({
        abi: datasetAbi,
        address: marketAddress,
        functionName: 'downloadDataset',
        args: [datasetId],
      });

      setPendingTxHash(hash);
      await publicClient!.waitForTransactionReceipt({ hash });
    } catch (error) {
      console.error('Error downloading dataset:', error);
      throw error;
    }
  };

  return {
    // Read hooks
    useGetDatasetCore,
    useCanDecrypt,
    useGetStorageInfo,
    useGetUsdcAddress,
    
    // Write functions
    mintDataset,
    lockDataset,
    downloadDataset,
    
    // State
    isWritePending,
    isTxPending,
    pendingTxHash,
    
    // Utils
    address,
  };
}