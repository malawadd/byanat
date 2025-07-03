"use client";

import Link from "next/link";
import Name from "@/components/name";
import Avatar from "@/components/avatar";
import { notFound } from "next/navigation";
import { DatasetObject } from "@/lib/types";
import { getPersonalDatasets } from "@/lib/actions";
import { DatasetList } from "@/components/dataset-list";
import { use, useCallback, useEffect, useState } from "react";

const isEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [address, setAddress] = useState<string | null>(null);
  const [personalDatasets, setPersonalDatasets] = useState<DatasetObject[]>([]);

  const resolveNameServiceAddress = useCallback((name: string) => {
    // ENS resolution can be implemented here for Ethereum-based chains
    // For now, return null as placeholder
    return Promise.resolve(null);
  }, []);

  const getExplorerUrl = (address: string) => {
    return `https://calibration.filscan.io/address/${address}`;
  };

  useEffect(() => {
    if (isEthereumAddress(id)) {
      setAddress(id);
    } else {
      resolveNameServiceAddress(`${id}.eth`).then((address) => {
        if (address) {
          setAddress(address);
        } else {
          notFound();
        }
      });
    }
  }, [id, resolveNameServiceAddress]);

  useEffect(() => {
    if (!address) return;
    getPersonalDatasets(address).then((datasets) => {
      setPersonalDatasets(datasets);
    });
  }, [address]);

  const resolveNameServiceNames = useCallback(async (address: string) => {
    // ENS resolution can be implemented here for Ethereum-based chains
    // For now, return empty string as placeholder
    return "";
  }, []);

  return (
    <div className="container mx-auto p-4">
      {address && (
        <div className="flex items-center space-x-4 p-4 border-b border-gray-200">
          <Avatar address={address} />
          <div>
            <Link href={getExplorerUrl(address)} target="_blank" rel="noopener noreferrer" className="text-xl font-semibold hover:underline">
              <Name address={address} resolveNameServiceNames={resolveNameServiceNames} />
            </Link>
            <p className="text-sm text-gray-600">{personalDatasets.length} Datasets</p>
          </div>
        </div>
      )}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Personal Datasets</h2>
        {personalDatasets.length > 0 ? (
          <DatasetList datasets={personalDatasets} resolveNameServiceNames={resolveNameServiceNames} />
        ) : (
          <p>No datasets found for this user.</p>
        )}
      </div>
    </div>
  );
}