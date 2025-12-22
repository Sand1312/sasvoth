import { useAccount, useReadContract, useWriteContract } from "wagmi";
import {
  TOKEN_ABI,
  TOKEN_CONTRACT_ADDRESS,
  CLAIM_CONTRACT_ADDRESS,
} from "@sasvoth/contracts";
import { parseEther, formatEther } from "viem";

interface UseTokenReturn {
  name: string | undefined;
  symbol: string | undefined;
  balance: string;
  rawBalance: bigint | undefined;
  contractBalance: string;
  rawContractBalance: bigint | undefined;
  allowance: string;
  approve: (spender: string, amount: string) => Promise<`0x${string}`>;
  transfer: (to: string, amount: string) => Promise<`0x${string}`>;
  isApproving: boolean;
  isTransferring: boolean;
  refetchBalance: (() => void) | undefined;
  refetchContractBalance: (() => void) | undefined;
  refetchAllowance: (() => void) | undefined;
  tokenAddress: string;
}

export const useToken = (): UseTokenReturn => {
  const { address } = useAccount();

  // Đọc thông tin token (wagmi v2)
  const { data: name } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: "name",
  });

  const { data: symbol } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: "symbol",
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Read contract balance
  const { data: contractBalance, refetch: refetchContractBalance } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: [CLAIM_CONTRACT_ADDRESS as `0x${string}`],
  });

  // Kiểm tra allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: "allowance",
    args:
      address && CLAIM_CONTRACT_ADDRESS
        ? [address, CLAIM_CONTRACT_ADDRESS as `0x${string}`]
        : undefined,
  });

  // Approve token (wagmi v2)
  const { writeContractAsync: approveAsync, isPending: isApproving } =
    useWriteContract();

  const handleApprove = async (spender: string, amount: string) => {
    if (!address) {
      console.error("❌ Wallet not connected");
      throw new Error("Wallet not connected");
    }

    try {
      console.log("--- 🚀 Approving token ---");
      console.log("   Spender:", spender);
      console.log("   Amount:", amount);

      const hash = await approveAsync({
        address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: "approve",
        args: [spender as `0x${string}`, parseEther(amount)],
      });

      console.log("✅ Approve thành công! Hash:", hash);
      return hash;
    } catch (error: any) {
      console.error("--- ❌ LỖI APPROVE ---");
      console.error("Error:", error?.message || error);
      throw error;
    }
  };

  // Transfer token (wagmi v2)
  const { writeContractAsync: transferAsync, isPending: isTransferring } =
    useWriteContract();

  const handleTransfer = async (to: string, amount: string) => {
    if (!address) {
      console.error("❌ Wallet not connected");
      throw new Error("Wallet not connected");
    }

    if (!amount || Number(amount) <= 0) {
      console.error("❌ Amount must be greater than 0");
      throw new Error("Amount must be greater than 0");
    }

    try {
      console.log("--- 🚀 Transferring token ---");
      console.log("   To:", to);
      console.log("   Amount:", amount);

      const hash = await transferAsync({
        address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: "transfer",
        args: [to as `0x${string}`, parseEther(amount)],
      });

      console.log("✅ Transfer thành công! Hash:", hash);
      return hash;
    } catch (error: any) {
      console.error("--- ❌ LỖI TRANSFER ---");
      console.error("Error:", error?.message || error);
      throw error;
    }
  };

  // Format balances
  const displayBalance = balance ? formatEther(balance as bigint) : "0";
  const displayContractBalance = contractBalance ? formatEther(contractBalance as bigint) : "0";
  const displayAllowance = allowance ? formatEther(allowance as bigint) : "0";

  return {
    name: name as string | undefined,
    symbol: symbol as string | undefined,
    balance: displayBalance,
    rawBalance: balance as bigint | undefined,
    contractBalance: displayContractBalance,
    rawContractBalance: contractBalance as bigint | undefined,
    allowance: displayAllowance,
    approve: handleApprove,
    transfer: handleTransfer,
    isApproving,
    isTransferring,
    refetchBalance,
    refetchContractBalance,
    refetchAllowance,
    tokenAddress: TOKEN_CONTRACT_ADDRESS,
  };
};
