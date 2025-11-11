import { ethers } from 'ethers';
import {MACI_ABI,POLL_FACTORY_ABI,MACI,PollFactory,MessageProcessorFactory,TallyFactory} from '@sasvoth/contracts';

export const CONTRACT_ADDRESSES = {
  MACI: MACI as `0x${string}`,
  PollFactory: PollFactory as `0x${string}`,
  MessageProcessorFactory: MessageProcessorFactory as `0x${string}`,
  TallyFactory: TallyFactory as `0x${string}`,
};

export const CONTRACT_ABIS = {
  MACI: MACI_ABI,
  PollFactory: POLL_FACTORY_ABI,
};

export const getContract = (
  address: string,
  abi: any,
  signerOrProvider?: ethers.Signer | ethers.providers.Provider
) => {
  return new ethers.Contract(address, abi, signerOrProvider);
};