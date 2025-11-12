// hooks/useMaci.ts
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contractConfigs } from '../lib/wagmi-config';

interface UseMACIReturn {
  signUpCount: number;
  nextPollId: number;
  
  createPoll: (
    startTimestamp: number,
    endTimestamp: number,
    treeDepths: { 
      intStateTreeDepth: number;
      messageTreeDepth: number;
      voteOptionTreeDepth: number;
    },
    coordinatorAddress: `0x${string}`,
    messageBatchSize: number,
    optionsCount: number
  ) => void;
  isDeployingPoll: boolean;
  isDeploySuccess: boolean;
  deployPollHash: `0x${string}` | undefined;
  deployError: Error | null;
  
  signUpUser: (
    pubKey: { x: bigint; y: bigint }, 
    signUpGatekeeperData: `0x${string}`
  ) => void;
  isSigningUp: boolean;
  isSignUpSuccess: boolean;
  signUpError: Error | null;
  
  refetchSignUps: () => void;
  refetchPolls: () => void;
}

export function useMACI(): UseMACIReturn {
  const { data: signUpCount, refetch: refetchSignUps } = useReadContract({
    ...contractConfigs.MACI,
    functionName: 'totalSignups',
  });

  const { data: nextPollId, refetch: refetchPolls } = useReadContract({
    ...contractConfigs.MACI,
    functionName: 'nextPollId',
  });

  const { 
    writeContract, 
    data: deployPollHash,
    isPending: isDeployingPoll,
    error: deployError
  } = useWriteContract();

  const { isLoading: isConfirmingDeploy, isSuccess: isDeploySuccess } = useWaitForTransactionReceipt({
    hash: deployPollHash,
  });

  const createPoll = (
    startTimestamp: number,
    endTimestamp: number,
    treeDepths: { 
      intStateTreeDepth: number;
      messageTreeDepth: number;
      voteOptionTreeDepth: number;
    },
    coordinatorAddress: `0x${string}`,
    messageBatchSize: number,
    optionsCount: number
  ) => {
    console.log('  BẮT ĐẦU GỌI DEPLOY POLL');

    


    const coordinatorPublicKey = {
        x: 1914084334308300076364284755888878029999531713558627255028864877663222785795n,
        y: 8338846306573061361250882526116210096833753055882483856275542076402655573710n
    };

    const deployPollArgs = {
      startDate: BigInt(startTimestamp),
      endDate: BigInt(endTimestamp),
      treeDepths: {
        tallyProcessingStateTreeDepth: treeDepths.intStateTreeDepth,
        voteOptionTreeDepth: treeDepths.voteOptionTreeDepth,
        stateTreeDepth: treeDepths.messageTreeDepth
      },
      messageBatchSize: Number(messageBatchSize),
      coordinatorPublicKey: coordinatorPublicKey,
      mode: 0, 
      policy: contractConfigs.FreeForAllPolicy, 
      initialVoiceCreditProxy: contractConfigs.ConstantInitialVoiceCreditProxyFactory.address,
      relayers: [], 
      voteOptions: BigInt(optionsCount)
    };

    console.log('DeployPoll args:', deployPollArgs);
    console.log('Contract address:', contractConfigs.MACI.address);

    writeContract({
      address: contractConfigs.MACI.address,
      abi: contractConfigs.MACI.abi,
      functionName: 'deployPoll',
      args: [deployPollArgs], 
    }, {
      onSuccess: (hash) => {
        console.log('Transaction sent successfully! Hash:', hash);
        
      },
      onError: (error) => {
        console.error('Transaction failed:', error);
        console.error('Error details:', error.message);
      }
    });
  };

  const { 
    writeContract: writeSignUp,
    data: signUpHash,
    isPending: isSigningUp,
    error: signUpError
  } = useWriteContract();

  const { isLoading: isConfirmingSignUp, isSuccess: isSignUpSuccess } = useWaitForTransactionReceipt({
    hash: signUpHash,
  });

  const signUpUser = (
      pubKey: { x: bigint; y: bigint }, 
      signUpGatekeeperData: `0x${string}`
  ) => {
    console.log(' Calling signUp...');
    
    writeSignUp({
      address: contractConfigs.MACI.address,
      abi: contractConfigs.MACI.abi,
      functionName: 'signUp',
      args: [
        pubKey, // { x: bigint, y: bigint }
        signUpGatekeeperData // chỉ 2 params theo ABI
      ],
    }, {
      onSuccess: (hash) => {
        console.log('SignUp transaction sent! Hash:', hash);
      },
      onError: (error) => {
        console.error('SignUp failed:', error);
      }
    });
  };

  return {
    // Read data
    signUpCount: signUpCount ? Number(signUpCount) : 0,
    nextPollId: nextPollId ? Number(nextPollId) : 0,
    
    // Poll functions
    createPoll,
    isDeployingPoll: isDeployingPoll || isConfirmingDeploy,
    isDeploySuccess,
    deployPollHash: deployPollHash || undefined,
    deployError,
    
    // Sign up functions
    signUpUser,
    isSigningUp: isSigningUp || isConfirmingSignUp,
    isSignUpSuccess,
    signUpError,
    
    // Refetch functions
    refetchSignUps: refetchSignUps as () => void,
    refetchPolls: refetchPolls as () => void,
  };
}