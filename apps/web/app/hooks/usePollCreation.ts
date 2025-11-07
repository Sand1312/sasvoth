import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAccount } from 'wagmi';
import { contractConfigs } from '../lib/wagmi-config';

export interface PollParams {
  maxValues: {
    maxMessages: bigint;
    maxVoteOptions: bigint;
  };
  treeDepths: {
    intStateTree: bigint;
    messageTree: bigint;
    messageTreeSubDepth: bigint;
    voteOptionTree: bigint;
  };
  batchSizes: {
    tallyBatchSize: bigint;
    messageBatchSize: bigint;
  };
  coordinatorPubKey: {
    x: bigint;
    y: bigint;
  };
}

export function usePollCreation() {
  const { address } = useAccount();
  
  const { 
    writeContract: deployPoll, 
    data: deployPollHash,
    isPending: isDeploying,
    error: deployError
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: deployPollHash,
  });

  const createPoll = (
    duration: number,
    pollParams: PollParams
  ) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    deployPoll({
      ...contractConfigs.MACI,
      functionName: 'deployPoll',
      args: [
        BigInt(duration),
        address, // coordinator
        pollParams
      ],
    });
  };

  return {
    createPoll,
    isDeploying: isDeploying || isConfirming,
    isConfirmed,
    deployError,
    transactionHash: deployPollHash,
  };
}