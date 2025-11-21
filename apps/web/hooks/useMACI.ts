// hooks/useMACI.ts
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { contractConfigs } from "../lib/wagmi-config";

// Định nghĩa types cho hook
interface UseMACIReturn {
  // Read data
  signUpCount: number;
  nextPollId: number;

  // Poll functions
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
    optionsCount: number,
    onSuccess?: (pollId: number, pollAddress: string) => void
  ) => void;
  isDeployingPoll: boolean;
  isDeploySuccess: boolean;
  deployPollHash: `0x${string}` | undefined;
  deployError: Error | null;

  getPollAddress: (pollId: number) => string | null;
  
  // Sign up functions
  signUpUser: (
    pubKey: { x: bigint; y: bigint },
    signUpGatekeeperData: `0x${string}`,
    onSuccess?: (stateIndex: number) => void
  ) => void;
  isSigningUp: boolean;
  isSignUpSuccess: boolean;
  signUpError: Error | null;
  stateIndex: number | null;

  // Refetch functions
  refetchSignUps: () => void;
  refetchPolls: () => void;
}

export function useMACI(): UseMACIReturn {
  // Đọc số lượng signups
  const { data: signUpCount, refetch: refetchSignUps } = useReadContract({
    ...contractConfigs.MACI,
    functionName: "totalSignups",
  });

  // Đọc số lượng polls
  const { data: nextPollId, refetch: refetchPolls } = useReadContract({
    ...contractConfigs.MACI,
    functionName: "nextPollId",
  });

  const { data: pollContracts } = useReadContract({
    ...contractConfigs.MACI,
    functionName: "getPoll",
    args: nextPollId !== undefined ? [BigInt(Number(nextPollId) - 1)] : undefined,
    query: {
      enabled: nextPollId !== undefined && Number(nextPollId) > 0,
    },
  });

  // Tạo poll mới
  const {
    writeContract,
    data: deployPollHash,
    isPending: isDeployingPoll,
    error: deployError,
  } = useWriteContract();

  const { isLoading: isConfirmingDeploy, isSuccess: isDeploySuccess } =
    useWaitForTransactionReceipt({
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
    optionsCount: number,
    onSuccess?: (pollId: number, pollAddress: string) => void
  ) => {
    const coordinatorPublicKey = {
      x: 1914084334308300076364284755888878029999531713558627255028864877663222785795n,
      y: 8338846306573061361250882526116210096833753055882483856275542076402655573710n,
    };

    const deployPollArgs = {
      startDate: BigInt(startTimestamp),
      endDate: BigInt(endTimestamp),
      treeDepths: {
        tallyProcessingStateTreeDepth: treeDepths.intStateTreeDepth,
        voteOptionTreeDepth: treeDepths.voteOptionTreeDepth,
        stateTreeDepth: treeDepths.messageTreeDepth,
      },
      messageBatchSize: Number(messageBatchSize),
      coordinatorPublicKey: coordinatorPublicKey,
      mode: 0,
      policy: contractConfigs.FreeForAllPolicy,
      initialVoiceCreditProxy:
        contractConfigs.ConstantInitialVoiceCreditProxyFactory.address,
      relayers: [],
      voteOptions: BigInt(optionsCount),
    };

    console.log("DeployPoll args:", deployPollArgs);
    console.log("Contract address:", contractConfigs.MACI.address);

    writeContract(
      {
        address: contractConfigs.MACI.address,
        abi: contractConfigs.MACI.abi,
        functionName: "deployPoll",
        args: [deployPollArgs],
      },
      {
        onSuccess: (hash) => {
          console.log("Transaction sent successfully! Hash:", hash);
          refetchPolls();
          
          // Gọi callback khi thành công
          if (onSuccess && nextPollId) {
            const newPollId = Number(nextPollId);
            const pollAddress = getPollAddress(newPollId);
            if (pollAddress) {
              onSuccess(newPollId, pollAddress);
            }
          }
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          console.error("Error details:", error.message);
        },
      }
    );
  };

  const getPollAddress = (pollId: number): string | null => {
    if (pollContracts && Number(nextPollId) === pollId + 1) {
      return (pollContracts as { poll: string }).poll;
    }
    return null;
  };

  // Sign up user với stateIndex
  const {
    writeContract: writeSignUp,
    data: signUpHash,
    isPending: isSigningUp,
    error: signUpError,
  } = useWriteContract();

  const { isLoading: isConfirmingSignUp, isSuccess: isSignUpSuccess } =
    useWaitForTransactionReceipt({
      hash: signUpHash,
    });

  // Theo dõi event SignUp để lấy stateIndex
  const { data: stateIndex, refetch: refetchStateIndex } = useReadContract({
    ...contractConfigs.MACI,
    functionName: "totalSignups",
    query: {
      enabled: isSignUpSuccess,
    },
  });

  const signUpUser = (
    pubKey: { x: bigint; y: bigint },
    signUpGatekeeperData: `0x${string}`,
    onSuccess?: (stateIndex: number) => void
  ) => {
    console.log("Calling signUp...");

    writeSignUp(
      {
        address: contractConfigs.MACI.address,
        abi: contractConfigs.MACI.abi,
        functionName: "signUp",
        args: [
          pubKey,
          signUpGatekeeperData,
        ],
      },
      {
        onSuccess: (hash) => {
          console.log("SignUp transaction sent! Hash:", hash);
          
          // Sau khi transaction thành công, refetch để lấy stateIndex mới nhất
          setTimeout(() => {
            refetchSignUps().then(() => {
              if (onSuccess && signUpCount !== undefined) {
                // stateIndex = totalSignups trước khi signUp + 1
                const newStateIndex = Number(signUpCount) + 1;
                console.log("SignUp successful! State Index:", newStateIndex);
                onSuccess(newStateIndex);
              }
            });
          }, 2000); // Đợi 2s để blockchain cập nhật
        },
        onError: (error) => {
          console.error("SignUp failed:", error);
        },
      }
    );
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
    stateIndex: stateIndex ? Number(stateIndex) : null,

    getPollAddress,

    // Refetch functions
    refetchSignUps: refetchSignUps as () => void,
    refetchPolls: refetchPolls as () => void,
  };
}