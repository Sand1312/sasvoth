import { ethers } from "ethers";
import { MACI_ABI, POLL_FACTORY_ABI, MACI } from "@sasvoth/contracts";

export const CONTRACT_ADDRESSES = {
  MACI: MACI as `0x${string}`,
};

export const CONTRACT_ABIS = {
  MACI: MACI_ABI,
  PollFactory: POLL_FACTORY_ABI,
};

export const getContract = (
  address: string,
  abi: any,
  signerOrProvider?: ethers.Signer | ethers.Provider
) => {
  return new ethers.Contract(address, abi, signerOrProvider);
};
