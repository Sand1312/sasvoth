import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { CLAIMING_ABI, CLAIM_CONTRACT_ADDRESS } from '@maci-protocol/contracts';
import { parseEther } from 'viem';

interface UseClaimContractReturn {
  allowToClaim: boolean | undefined;
  rate: bigint | undefined;
  creditRate: bigint | undefined;
  voiceCredits: bigint | undefined; 
  buyHD: (ethAmount: string) => void; 
  sellHD: (amount: string) => void; 
  buyVoiceCredits: (credits: string) => void; 
  isBuying: boolean;
  isSelling: boolean;
  isBuyingCredits: boolean;
  refetchAllowToClaim: (() => void) | undefined;
  refetchRate: (() => void) | undefined;
  refetchVoiceCredits: (() => void) | undefined;
  contractAddress: string;
}

export const useClaimContract = (): UseClaimContractReturn => {
  const { address } = useAccount();

  // Đọc thông tin contract
  const { data: allowToClaim, refetch: refetchAllowToClaim } = useContractRead({
    address: CLAIM_CONTRACT_ADDRESS,
    abi: CLAIMING_ABI,
    functionName: 'allowToClaim',
  });

  const { data: rate, refetch: refetchRate } = useContractRead({
    address: CLAIM_CONTRACT_ADDRESS,
    abi: CLAIMING_ABI,
    functionName: 'rate',
  });

  const { data: creditRate } = useContractRead({
    address: CLAIM_CONTRACT_ADDRESS,
    abi: CLAIMING_ABI,
    functionName: 'creditRate',
  });

  // THÊM: Đọc voice credits của user
  const { data: voiceCredits, refetch: refetchVoiceCredits } = useContractRead({
    address: CLAIM_CONTRACT_ADDRESS,
    abi: CLAIMING_ABI,
    functionName: 'voiceCredits',
    args: address ? [address] : undefined,
    
  });

  // Mua HD token bằng ETH
  const { writeContract: buyHD, isPending: isBuying } = useContractWrite();

  const handleBuyHD = (ethAmount: string): void => { 
    if (!ethAmount || Number(ethAmount) <= 0) {
      console.error("Số ETH phải lớn hơn 0");
      return;
    }
    buyHD({
      address: CLAIM_CONTRACT_ADDRESS,
      abi: CLAIMING_ABI,
      functionName: 'buy_HD',
      value: parseEther(ethAmount), 
    });
  };

  // Bán HD token lấy ETH
  const { writeContract: sellHD, isPending: isSelling } = useContractWrite();

  const handleSellHD = (amount: string): void => { 
    if (!amount || Number(amount) <= 0) {
      console.error("Số token phải lớn hơn 0");
      return;
    }
    
    const tokenAmount = parseEther(amount);
    sellHD({
      address: CLAIM_CONTRACT_ADDRESS,
      abi: CLAIMING_ABI,
      functionName: 'sell_HD',
      args: [tokenAmount],
    });
  };

  // Mua Voice Credits
  const { writeContract: buyVoiceCredits, isPending: isBuyingCredits } = useContractWrite();

  const handleBuyVoiceCredits = (credits: string): void => { 
    if (!credits || Number(credits) <= 0) {
      console.error("Số credits phải lớn hơn 0");
      return;
    }
    
    const creditsAmount = BigInt(credits);  
    buyVoiceCredits({
      address: CLAIM_CONTRACT_ADDRESS,
      abi: CLAIMING_ABI,
      functionName: 'buyVoiceCredits',
      args: [creditsAmount],  
    });
  };

  return {
    allowToClaim: allowToClaim as boolean | undefined,
    rate: rate as bigint | undefined,
    creditRate: creditRate as bigint | undefined,
    voiceCredits: voiceCredits as bigint | undefined, 
    buyHD: handleBuyHD,
    sellHD: handleSellHD,
    buyVoiceCredits: handleBuyVoiceCredits,
    isBuying,
    isSelling,
    isBuyingCredits,
    refetchAllowToClaim,
    refetchRate,
    refetchVoiceCredits, 
    contractAddress: CLAIM_CONTRACT_ADDRESS
  };
};
