import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { CLAIMING_ABI, CLAIM_CONTRACT_ADDRESS } from '@sasvoth/contracts';
import { parseEther } from 'viem';

interface UseClaimContractReturn {
  allowToClaim: boolean | undefined;
  rate: bigint | undefined;
  buyHD: (ethAmount: string) => Promise<`0x${string}` | undefined>;
  sellHD: (amount: string) => Promise<`0x${string}` | undefined>;
  buyVoiceCredits: (credits: string) => Promise<`0x${string}` | undefined>;
  claimReward: (_idClaim: string, rewardAmount: string, _v: number, _r: string, _s: string) => Promise<`0x${string}` | undefined>;
  isBuying: boolean;
  isSelling: boolean;
  isBuyingCredits: boolean;
  isClaiming: boolean;
  refetchAllowToClaim: (() => void) | undefined;
  refetchRate: (() => void) | undefined;
  contractAddress: string;
}

export const useClaimContract = (): UseClaimContractReturn => {
  const { address } = useAccount();

  // Read contract info
  const { data: allowToClaim, refetch: refetchAllowToClaim } = useContractRead({
    address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
    abi: CLAIMING_ABI,
    functionName: 'allowToClaim',
  });

  const { data: rate, refetch: refetchRate } = useContractRead({
    address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
    abi: CLAIMING_ABI,
    functionName: 'rate',
  });

  // Buy HD token with ETH
  const { writeContractAsync: buyHDAsync, isPending: isBuying } = useContractWrite();

  const handleBuyHD = async (ethAmount: string): Promise<`0x${string}` | undefined> => {
    if (!ethAmount || Number(ethAmount) <= 0) {
      console.error("ETH amount must be greater than 0");
      return;
    }
    return await buyHDAsync({
      address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
      abi: CLAIMING_ABI,
      functionName: 'buy_HD',
      value: parseEther(ethAmount),
    });
  };

  // Sell HD token for ETH
  const { writeContractAsync: sellHDAsync, isPending: isSelling } = useContractWrite();

  const handleSellHD = async (amount: string): Promise<`0x${string}` | undefined> => {
    if (!amount || Number(amount) <= 0) {
      console.error("Token amount must be greater than 0");
      return;
    }

    const tokenAmount = parseEther(amount);
    return await sellHDAsync({
      address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
      abi: CLAIMING_ABI,
      functionName: 'sell_HD',
      args: [tokenAmount],
    });
  };

  // Buy Voice Credits
  const { writeContractAsync: buyVoiceCreditsAsync, isPending: isBuyingCredits } = useContractWrite();

  const handleBuyVoiceCredits = async (credits: string): Promise<`0x${string}` | undefined> => {
    if (!credits || Number(credits) <= 0) {
      console.error("Credits amount must be greater than 0");
      return;
    }

    const amount = parseEther(credits);
    return await buyVoiceCreditsAsync({
      address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
      abi: CLAIMING_ABI,
      functionName: 'buyVoiceCredits',
      args: [amount],
    });
  };

  // Claim Reward
  const { writeContractAsync: claimRewardAsync, isPending: isClaiming } = useContractWrite();

  const handleClaimReward = async (_idClaim: string, rewardAmount: string, _v: number, _r: string, _s: string): Promise<`0x${string}` | undefined> => {
    if (!rewardAmount || Number(rewardAmount) <= 0) {
      console.error("Reward amount must be greater than 0");
      return;
    }

    return await claimRewardAsync({
      address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
      abi: CLAIMING_ABI,
      functionName: 'ClaimReward',
      args: [_idClaim, BigInt(rewardAmount), _v, _r as `0x${string}`, _s as `0x${string}`],
    });
  };

  return {
    allowToClaim: allowToClaim as boolean | undefined,
    rate: rate as bigint | undefined,
    buyHD: handleBuyHD,
    sellHD: handleSellHD,
    buyVoiceCredits: handleBuyVoiceCredits,
    claimReward: handleClaimReward,
    isBuying,
    isSelling,
    isBuyingCredits,
    isClaiming,
    refetchAllowToClaim,
    refetchRate,
    contractAddress: CLAIM_CONTRACT_ADDRESS
  };
};
