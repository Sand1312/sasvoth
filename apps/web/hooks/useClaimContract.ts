import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CLAIMING_ABI, CLAIM_CONTRACT_ADDRESS } from '@sasvoth/contracts';
import { parseEther } from 'viem';

interface UseClaimContractReturn {
  allowToClaim: boolean | undefined;
  rate: bigint | undefined;
  buyHD: (ethAmount: string) => Promise<`0x${string}` | undefined>;
  sellHD: (amount: string) => Promise<`0x${string}` | undefined>;
  buyVoiceCredits: (credits: string) => Promise<`0x${string}` | undefined>;
  claimReward: (_idClaim: string, rewardAmount: string, _v: number, _r: string, _s: string) => Promise<`0x${string}` | undefined>;
  withdrawETH: () => Promise<`0x${string}` | undefined>;
  withdrawToken: () => Promise<`0x${string}` | undefined>;
  isBuying: boolean;
  isSelling: boolean;
  isBuyingCredits: boolean;
  isClaiming: boolean;
  isWithdrawingETH: boolean;
  isWithdrawingToken: boolean;
  refetchAllowToClaim: (() => void) | undefined;
  refetchRate: (() => void) | undefined;
  contractAddress: string;
}

export const useClaimContract = (): UseClaimContractReturn => {
  const { address } = useAccount();

  // Read contract info (wagmi v2)
  const { data: allowToClaim, refetch: refetchAllowToClaim } = useReadContract({
    address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
    abi: CLAIMING_ABI,
    functionName: 'allowToClaim',
  });

  const { data: rate, refetch: refetchRate } = useReadContract({
    address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
    abi: CLAIMING_ABI,
    functionName: 'rate',
  });

  // Buy HD token with ETH (wagmi v2)
  const { writeContractAsync: buyHDAsync, isPending: isBuying, error: buyError } = useWriteContract();

  const handleBuyHD = async (ethAmount: string): Promise<`0x${string}` | undefined> => {
    if (!ethAmount || Number(ethAmount) <= 0) {
      console.error("❌ ETH amount must be greater than 0");
      return;
    }

    if (!address) {
      console.error("❌ Wallet not connected");
      return;
    }

    try {
      console.log("--- 🚀 Bắt đầu giao dịch Buy HD ---");
      console.log("   Wallet:", address);
      console.log("   Contract:", CLAIM_CONTRACT_ADDRESS);
      console.log("   ETH gửi:", ethAmount);
      console.log("   Wei value:", parseEther(ethAmount).toString());

      const hash = await buyHDAsync({
        address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
        abi: CLAIMING_ABI,
        functionName: 'buy_HD',
        value: parseEther(ethAmount),
      });

      console.log("✅ Giao dịch được gửi! Hash:", hash);
      return hash;

    } catch (error: any) {
      console.error("--- ❌ LỖI CHI TIẾT ---");
      console.error("Error name:", error?.name);
      console.error("Error message:", error?.message);

      // Log detailed error info
      if (error.cause) {
        console.error("Cause:", error.cause);
      }
      if (error.shortMessage) {
        console.error("Short message:", error.shortMessage);
      }
      if (error.details) {
        console.error("Details:", error.details);
      }
      if (error.metaMessages) {
        console.error("Meta messages:", error.metaMessages);
      }

      // Common error scenarios
      if (error.message?.includes("User rejected") || error.message?.includes("User denied")) {
        console.error("🚫 Người dùng từ chối giao dịch");
        alert("Bạn đã từ chối giao dịch!");
      } else if (error.message?.includes("insufficient funds")) {
        console.error("💸 Không đủ ETH để thực hiện giao dịch");
        alert("Không đủ ETH! Vui lòng nạp thêm.");
      } else if (error.message?.includes("Failed to fetch") || error.message?.includes("fetch failed")) {
        console.error("🌐 LỖI KẾT NỐI RPC!");
        console.error("   Nguyên nhân có thể:");
        console.error("   - RPC endpoint không hoạt động");
        console.error("   - Rate limit từ RPC provider");
        console.error("   - Vấn đề mạng internet");
        console.error("   - CORS policy");
        alert("❌ Lỗi kết nối RPC!\n\nVui lòng:\n1. Kiểm tra kết nối internet\n2. Reload trang (F5)\n3. Đổi RPC trong MetaMask\n4. Thử lại sau vài phút");
      } else if (error.message?.includes("execution reverted")) {
        console.error("⚠️ Contract revert - có thể do:");
        console.error("   - Contract đang pause");
        console.error("   - Logic contract không cho phép");
        console.error("   - Thiếu allowance hoặc permission");
        alert("Contract từ chối giao dịch! Check console để biết chi tiết.");
      }

      console.error("Full Error Object:", error);
      throw error;
    }
  };

  // Sell HD token for ETH (wagmi v2)
  const { writeContractAsync: sellHDAsync, isPending: isSelling } = useWriteContract();

  const handleSellHD = async (amount: string): Promise<`0x${string}` | undefined> => {
    if (!amount || Number(amount) <= 0) {
      console.error("❌ Token amount must be greater than 0");
      return;
    }

    if (!address) {
      console.error("❌ Wallet not connected");
      return;
    }

    try {
      console.log("--- 🚀 Bắt đầu giao dịch Sell HD ---");
      console.log("   Wallet:", address);
      console.log("   Token amount:", amount);

      const tokenAmount = parseEther(amount);
      const hash = await sellHDAsync({
        address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
        abi: CLAIMING_ABI,
        functionName: 'sell_HD',
        args: [tokenAmount],
      });

      console.log("✅ Giao dịch được gửi! Hash:", hash);
      return hash;
    } catch (error: any) {
      console.error("--- ❌ LỖI SELL HD ---");
      console.error("Error:", error?.message || error);
      throw error;
    }
  };

  // Buy Voice Credits (wagmi v2)
  const { writeContractAsync: buyVoiceCreditsAsync, isPending: isBuyingCredits } = useWriteContract();

  const handleBuyVoiceCredits = async (credits: string): Promise<`0x${string}` | undefined> => {
    if (!credits || Number(credits) <= 0) {
      console.error("❌ Credits amount must be greater than 0");
      return;
    }

    if (!address) {
      console.error("❌ Wallet not connected");
      return;
    }

    try {
      console.log("--- 🚀 Bắt đầu mua Voice Credits ---");
      const amount = parseEther(credits);
      const hash = await buyVoiceCreditsAsync({
        address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
        abi: CLAIMING_ABI,
        functionName: 'buyVoiceCredits',
        args: [amount],
      });

      console.log("✅ Mua Voice Credits thành công! Hash:", hash);
      return hash;
    } catch (error: any) {
      console.error("--- ❌ LỖI MUA VOICE CREDITS ---");
      console.error("Error:", error?.message || error);
      throw error;
    }
  };

  // Claim Reward (wagmi v2)
  const { writeContractAsync: claimRewardAsync, isPending: isClaiming } = useWriteContract();

  const handleClaimReward = async (_idClaim: string, rewardAmount: string, _v: number, _r: string, _s: string): Promise<`0x${string}` | undefined> => {
    if (!rewardAmount || Number(rewardAmount) <= 0) {
      console.error("❌ Reward amount must be greater than 0");
      return;
    }

    if (!address) {
      console.error("❌ Wallet not connected");
      return;
    }

    try {
      // Debug logging
      console.log("=== CLAIM REWARD DEBUG ===");
      console.log("Contract:", CLAIM_CONTRACT_ADDRESS);
      console.log("Caller (msg.sender):", address.toLowerCase());
      console.log("_idClaim:", _idClaim);
      console.log("rewardAmount (wei):", rewardAmount);
      console.log("rewardAmount (BigInt):", BigInt(rewardAmount).toString());
      console.log("_v:", _v);
      console.log("_r:", _r);
      console.log("_s:", _s);

      // Reconstruct expected message for debugging
      const expectedMessage = `${address.toLowerCase()}_${rewardAmount}_${_idClaim}`;
      console.log("Expected message format:", expectedMessage);
      console.log("==========================");

      const hash = await claimRewardAsync({
        address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
        abi: CLAIMING_ABI,
        functionName: 'ClaimReward',
        args: [_idClaim, BigInt(rewardAmount), _v, _r as `0x${string}`, _s as `0x${string}`],
      });

      console.log("✅ Claim Reward thành công! Hash:", hash);
      return hash;
    } catch (error: any) {
      console.error("--- ❌ LỖI CLAIM REWARD ---");
      console.error("Error:", error?.message || error);

      // Parse revert reason if available
      if (error.message?.includes("Sorry, wrong hashed")) {
        console.error("⚠️ Signature verification failed! Check:");
        console.error("   1. Owner address matches signer");
        console.error("   2. Message format matches contract");
        console.error("   3. rewardAmount is exactly the same as when signed");
      } else if (error.message?.includes("hash has been claimed")) {
        console.error("⚠️ This idClaim has already been used!");
      } else if (error.message?.includes("not enough tokens")) {
        console.error("⚠️ Contract doesn't have enough tokens!");
      } else if (error.message?.includes("Not allowed to claim")) {
        console.error("⚠️ Claiming is currently disabled on contract!");
      }

      console.error("Full error:", error);
      throw error;
    }
  };

  // Withdraw ETH (Admin only)
  const { writeContractAsync: withdrawETHAsync, isPending: isWithdrawingETH } = useWriteContract();

  const handleWithdrawETH = async (): Promise<`0x${string}` | undefined> => {
    if (!address) {
      console.error("❌ Wallet not connected");
      return;
    }

    try {
      console.log("--- 🚀 Bắt đầu Withdraw ETH ---");
      const hash = await withdrawETHAsync({
        address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
        abi: CLAIMING_ABI,
        functionName: 'withdrawETH',
      });

      console.log("✅ Withdraw ETH thành công! Hash:", hash);
      return hash;
    } catch (error: any) {
      console.error("--- ❌ LỖI WITHDRAW ETH ---");
      console.error("Error:", error?.message || error);
      throw error;
    }
  };

  // Withdraw Token (Admin only)
  const { writeContractAsync: withdrawTokenAsync, isPending: isWithdrawingToken } = useWriteContract();

  const handleWithdrawToken = async (): Promise<`0x${string}` | undefined> => {
    if (!address) {
      console.error("❌ Wallet not connected");
      return;
    }

    try {
      console.log("--- 🚀 Bắt đầu Withdraw Token ---");
      const hash = await withdrawTokenAsync({
        address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
        abi: CLAIMING_ABI,
        functionName: 'withdrawToken',
      });

      console.log("✅ Withdraw Token thành công! Hash:", hash);
      return hash;
    } catch (error: any) {
      console.error("--- ❌ LỖI WITHDRAW TOKEN ---");
      console.error("Error:", error?.message || error);
      throw error;
    }
  };

  return {
    allowToClaim: allowToClaim as boolean | undefined,
    rate: rate as bigint | undefined,
    buyHD: handleBuyHD,
    sellHD: handleSellHD,
    buyVoiceCredits: handleBuyVoiceCredits,
    claimReward: handleClaimReward,
    withdrawETH: handleWithdrawETH,
    withdrawToken: handleWithdrawToken,
    isBuying,
    isSelling,
    isBuyingCredits,
    isClaiming,
    isWithdrawingETH,
    isWithdrawingToken,
    refetchAllowToClaim,
    refetchRate,
    contractAddress: CLAIM_CONTRACT_ADDRESS
  };
};
