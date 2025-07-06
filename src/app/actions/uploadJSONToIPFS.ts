'use server';                               // <-- tells Next it's a server action
import pinataSDK from '@pinata/sdk';

// Never bundle this var – it’s read only on the server
const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT! });

export async function uploadJSONToIPFS(json: unknown): Promise<string> {
  if (!process.env.PINATA_JWT) throw new Error('PINATA_JWT missing');

  const { IpfsHash } = await pinata.pinJSONToIPFS(json);
  console.log('Uploaded JSON to IPFS:', IpfsHash);
  return IpfsHash;                           // e.g. Qm…CID
}
