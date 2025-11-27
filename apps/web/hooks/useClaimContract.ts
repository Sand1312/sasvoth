import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { CLAIMING_ABI, CLAIM_CONTRACT_ADDRESS } from '@sasvoth/contracts';
import { parseEther } from 'viem';

interface UseClaimContractReturn {
  allowToClaim: boolean | undefined;
  rate: bigint | undefined;
  buyHD: (ethAmount: string) => void;
  sellHD: (amount: string) => void;
  buyVoiceCredits: (credits: string) => void;
  claimReward: (_idClaim: string, rewardAmount: string, _v: number, _r: string, _s: string) => void;
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
  const { writeContract: buyHD, isPending: isBuying } = useContractWrite();

  const handleBuyHD = (ethAmount: string): void => {
    if (!ethAmount || Number(ethAmount) <= 0) {
      console.error("ETH amount must be greater than 0");
      return;
    }
    buyHD({
      address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
      abi: CLAIMING_ABI,
      functionName: 'buy_HD',
      value: parseEther(ethAmount),
    });
  };

  // Sell HD token for ETH
  const { writeContract: sellHD, isPending: isSelling } = useContractWrite();

  const handleSellHD = (amount: string): void => {
    if (!amount || Number(amount) <= 0) {
      console.error("Token amount must be greater than 0");
      return;
    }

    const tokenAmount = parseEther(amount);
    sellHD({
      address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
      abi: CLAIMING_ABI,
      functionName: 'sell_HD',
      args: [tokenAmount],
    });
  };

  // Buy Voice Credits
  const { writeContract: buyVoiceCredits, isPending: isBuyingCredits } = useContractWrite();

  const handleBuyVoiceCredits = (credits: string): void => {
    if (!credits || Number(credits) <= 0) {
      console.error("Credits amount must be greater than 0");
      return;
    }

    const amount = parseEther(credits);
    buyVoiceCredits({
      address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
      abi: CLAIMING_ABI,
      functionName: 'buyVoiceCredits',
      args: [amount],
    });
  };

  // Claim Reward
  const { writeContract: claimReward, isPending: isClaiming } = useContractWrite();

  const handleClaimReward = (_idClaim: string, rewardAmount: string, _v: number, _r: string, _s: string): void => {
    if (!rewardAmount || Number(rewardAmount) <= 0) {
      console.error("Reward amount must be greater than 0");
      return;
    }

    claimReward({
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
