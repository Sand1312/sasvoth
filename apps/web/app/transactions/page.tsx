"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@sasvoth/ui/button";
import { useAccount } from "wagmi";
import { useClaimContract, useToken, useUser, useAuth } from "../../hooks";
import { useFeedback } from "@/contexts/FeedbackContext";

type DepositHistory = {
  amount: number;
  timestamp: string;
 
};

export default function TransactionsPage() {
  const { address, isConnected } = useAccount();
  const { user } = useAuth();
  const token = useToken();
  const claim = useClaimContract();
  const { deposit, getHistoryDeposit } = useUser();

  const [isClient, setIsClient] = useState(false);
  const { showSuccess, showError } = useFeedback();

  // Deposit / withdraw
  const [showDeposit, setShowDeposit] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number | "">("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");

  const [history, setHistory] = useState<DepositHistory[]>([]);
  const [reloadHistory, setReloadHistory] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const fetchHistory = async () => {
      if (!user?._id) return;
      try {
        const userId = user._id;
        const data = await getHistoryDeposit(userId);
        if (Array.isArray(data)) {
          
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch deposit history:", error);
      }
    };
    fetchHistory();
  }, [reloadHistory, user]);

  const isDepositDisabled = Boolean(
    claim.isBuying || !depositAmount || Number(depositAmount) < 0.001
  );

  const isWithdrawDisabled = Boolean(
    claim.isSelling ||
    !withdrawAmount ||
    Number(withdrawAmount) > Number(token.balance) ||
    Number(withdrawAmount) <= 0
  );




  const handleBuyToken = async () => {
    if (typeof depositAmount === "number" && depositAmount > 0) {
      const ethAmountString = depositAmount.toString();
      const txHash = await claim.buyHD(ethAmountString);
      if (!txHash) return;
      console.log("Buy HD result:", txHash);
      const userId = user?._id;
      if (!userId) {
        showError("Authentication Required", "Vui lòng đăng nhập lại");
        return;
      }

      const amountToken = Number(depositAmount) * Number(claim.rate);
      await deposit(userId, amountToken, txHash);
      setDepositAmount("");
      showSuccess("Deposit Successful", `Đang mua token với ${depositAmount} ETH...`);
      setReloadHistory(prev => prev + 1);
    } else {
      showError("Invalid Input", "Vui lòng nhập số ETH hợp lệ");
    }
  };

  const handleWithdraw = async() => {
    if (typeof withdrawAmount === "number" && withdrawAmount > 0) {
      const tokenAmountString = withdrawAmount.toString();
      await token.approve(claim.contractAddress, tokenAmountString);

      setTimeout(async () => {
      const txHash = await claim.sellHD(tokenAmountString);
      if (!txHash) return;
      setWithdrawAmount("");
      const userId = user?._id;
      if (!userId) {
        showError("Authentication Required", "Vui lòng đăng nhập lại");
        return;
      }
      const amountToken = Number(withdrawAmount) - Number(withdrawAmount) *2;
        await deposit(userId, amountToken, txHash);

      
        setReloadHistory(prev => prev + 1);

      }, 8000);
       
        // alert(
        //   `Đang bán ${withdrawAmount} token để rút ${ethReceived.toFixed(6)} ETH...`
        // );
     
    } else {
      showError("Invalid Input", "Vui lòng nhập số token hợp lệ");
    }
  };




  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-2xl bg-white shadow animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="rounded-3xl border border-black bg-white px-6 py-8 text-black shadow">
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            Wallet center
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Transactions</h1>
          <p className="mt-2 text-sm text-black/70">
            Deposit ETH for HD tokens, withdraw, or manage voice credits all in
            one place.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT COLUMN: Deposit & Withdraw */}
          <section className="space-y-6">
            {/* HD Deposit */}
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">HD Deposit</h2>
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setShowDeposit((prev) => !prev)}
                >
                  {showDeposit ? "Hide" : "Show"}
                </Button>
              </div>
              {showDeposit && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Số ETH muốn dùng để mua token:
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="0.001"
                      value={depositAmount}
                      onChange={(e) =>
                        setDepositAmount(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full rounded border px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  {claim.rate && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                      <p>
                        <strong>Tỷ giá hiện tại:</strong>
                      </p>
                      <p>
                        1 ETH = {Number(claim.rate).toLocaleString()}{" "}
                        {token.symbol}
                      </p>
                      {depositAmount && (
                        <p className="mt-1 font-bold">
                          Bạn sẽ nhận được:{" "}
                          {(
                            Number(depositAmount) * Number(claim.rate)
                          ).toLocaleString()}{" "}
                          {token.symbol}
                        </p>
                      )}
                    </div>
                  )}
                  {!isConnected ? (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                      Vui lòng kết nối ví để mua token
                    </div>
                  ) : (
                    <Button
                      onClick={handleBuyToken}
                      disabled={isDepositDisabled}
                      className="w-full"
                    >
                      {claim.isBuying
                        ? "Đang xử lý..."
                        : `Mua Token với ${depositAmount || 0} ETH`}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Withdraw */}
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Withdraw</h2>
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setShowWithdraw((prev) => !prev)}
                >
                  {showWithdraw ? "Hide" : "Show"}
                </Button>
              </div>
              {showWithdraw && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Số token muốn bán để rút ETH:
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="100"
                      value={withdrawAmount}
                      onChange={(e) =>
                        setWithdrawAmount(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full rounded border px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  {claim.rate && withdrawAmount && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                      <p>
                        <strong>Tỷ giá hiện tại:</strong>
                      </p>
                      <p>
                        1 ETH = {Number(claim.rate).toLocaleString()}{" "}
                        {token.symbol}
                      </p>
                      <p>
                        1 {token.symbol} = {(1 / Number(claim.rate)).toFixed(8)}{" "}
                        ETH
                      </p>
                      <p className="mt-2 font-bold text-lg">
                        Bán {withdrawAmount} {token.symbol} ={" "}
                        {(Number(withdrawAmount) / Number(claim.rate)).toFixed(
                          6
                        )}{" "}
                        ETH
                      </p>
                    </div>
                  )}
                  {!isConnected ? (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                      Vui lòng kết nối ví để rút tiền
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                        <strong>Số dư khả dụng:</strong> {token.balance}{" "}
                        {token.symbol}
                      </div>
                      <Button
                        onClick={handleWithdraw}
                        disabled={isWithdrawDisabled}
                        className="w-full"
                      >
                        {claim.isSelling
                          ? "Đang xử lý..."
                          : `Rút ${withdrawAmount || 0} ${token.symbol}`}
                      </Button>
                      {withdrawAmount &&
                        Number(withdrawAmount) > Number(token.balance) && (
                          <p className="text-center text-sm text-red-500">
                            Số dư không đủ
                          </p>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: Wallet Info & History */}
          <section className="space-y-6">
            {/* Wallet Info (Moved Here) */}
            {isConnected && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
                <div className="mb-2 text-base font-semibold text-blue-900">
                  Ví Web3
                </div>
                <p>
                  Địa chỉ: {address?.slice(0, 8)}...{address?.slice(-6)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                   <p className="font-bold text-lg">
                      Số dư: {token.balance} {token.symbol}
                   </p>
                </div>
                {token.name && <p className="text-xs mt-1 text-blue-600">Token: {token.name}</p>}
              </div>
            )}

            {/* History */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {history.length === 0 ? (
                    <p className="text-sm text-gray-500">No transactions found.</p>
                  ) : (
                    [...history].reverse().map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-black/5 bg-white px-4 py-3 shadow-sm flex justify-between items-center"
                      >
                          <div className="text-sm font-semibold text-gray-900">
                           {item.amount > 0 ? "+" : ""}{item.amount} HD
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
                          </div>
                      </div>
                    ))
                  )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
