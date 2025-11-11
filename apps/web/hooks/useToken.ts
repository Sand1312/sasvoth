import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { TOKEN_ABI, TOKEN_CONTRACT_ADDRESS, CLAIM_CONTRACT_ADDRESS } from '@sasvoth/contracts';
import { parseEther, formatEther } from 'viem';

interface UseTokenReturn {
  name: string | undefined;
  symbol: string | undefined;
  balance: string;
  rawBalance: bigint | undefined;
  allowance: string;
  approve: (spender: string, amount: string) => void;
  isApproving: boolean;
  refetchBalance: (() => void) | undefined;
  refetchAllowance: (() => void) | undefined;
  tokenAddress: string;
}

export const useToken = (): UseTokenReturn => {
  const { address } = useAccount();

  // Đọc thông tin token
  const { data: name } = useContractRead({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'name',
  });

  const { data: symbol } = useContractRead({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'symbol',
  });

  const { data: balance, refetch: refetchBalance } = useContractRead({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Kiểm tra allowance
  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'allowance',
    args: address && CLAIM_CONTRACT_ADDRESS ? [address, CLAIM_CONTRACT_ADDRESS] : undefined,
  });

  // Approve token
  const { writeContract: approve, isPending: isApproving } = useContractWrite();

  const handleApprove = (spender: string, amount: string): void => {
    approve({
      address: TOKEN_CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'approve',
      args: [spender, parseEther(amount)],
    });
  };

  // Format balances
  const displayBalance = balance ? formatEther(balance as bigint) : "0";
  const displayAllowance = allowance ? formatEther(allowance as bigint) : "0";

  return {
    name: name as string | undefined,
    symbol: symbol as string | undefined,
    balance: displayBalance,
    rawBalance: balance as bigint | undefined,
    allowance: displayAllowance,
    approve: handleApprove,
    isApproving,
    refetchBalance,
    refetchAllowance,
    tokenAddress: TOKEN_CONTRACT_ADDRESS
  };
};