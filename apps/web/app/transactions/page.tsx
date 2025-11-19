"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@sasvoth/ui/button";
import { useAccount } from "wagmi";
import { useClaimContract, useToken } from "../../hooks";

type Notification = {
  id: number;
  message: string;
  date: string;
};

const mockNotifications: Notification[] = [
  { id: 1, message: "Balance updated: +$120", date: "2024-06-10" },
  { id: 2, message: "Balance updated: -$75", date: "2024-06-09" },
  { id: 3, message: "Balance updated: +$200", date: "2024-06-08" },
  { id: 4, message: "Balance updated: -$50", date: "2024-06-07" },
];

export default function TransactionsPage() {
  const { address, isConnected } = useAccount();
  const token = useToken();
  const claim = useClaimContract();

  const [isClient, setIsClient] = useState(false);
  const [showDeposit, setShowDeposit] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number | "">("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");

  const [showBuyCredits, setShowBuyCredits] = useState(true);
  const [creditsAmount, setCreditsAmount] = useState<number | "">("");
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveOnly, setShowApproveOnly] = useState(false);
  const [approveAmount, setApproveAmount] = useState<number | "">("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const needsApproval = useMemo(() => {
    if (!creditsAmount || !claim.creditRate || !token.allowance) return true;

    const requiredAmount = Number(creditsAmount) * Number(claim.creditRate);
    return Number(token.allowance) < requiredAmount;
  }, [creditsAmount, claim.creditRate, token.allowance]);

  const requiredAmount = useMemo(() => {
    if (!creditsAmount || !claim.creditRate) return 0;
    return Number(creditsAmount) * Number(claim.creditRate);
  }, [creditsAmount, claim.creditRate]);

  const isDepositDisabled = Boolean(
    claim.isBuying || !depositAmount || Number(depositAmount) < 0.001
  );

  const isWithdrawDisabled = Boolean(
    claim.isSelling ||
      !withdrawAmount ||
      Number(withdrawAmount) > Number(token.balance) ||
      Number(withdrawAmount) <= 0
  );

  const isBuyCreditsDisabled = Boolean(
    isProcessing ||
      claim.isBuyingCredits ||
      token.isApproving ||
      !creditsAmount ||
      requiredAmount <= 0 ||
      requiredAmount > Number(token.balance)
  );

  const isApproveDisabled = Boolean(
    token.isApproving || !approveAmount || Number(approveAmount) <= 0
  );

  const handleBuyToken = () => {
    if (typeof depositAmount === "number" && depositAmount > 0) {
      const ethAmountString = depositAmount.toString();
      claim.buyHD(ethAmountString);
      setDepositAmount("");
      alert(`Đang mua token với ${depositAmount} ETH...`);
    } else {
      alert("Vui lòng nhập số ETH hợp lệ");
    }
  };

  const handleWithdraw = () => {
    if (typeof withdrawAmount === "number" && withdrawAmount > 0) {
      const tokenAmountString = withdrawAmount.toString();
      claim.sellHD(tokenAmountString);
      setWithdrawAmount("");

      if (claim.rate) {
        const ethReceived = Number(withdrawAmount) / Number(claim.rate);
        alert(
          `Đang bán ${withdrawAmount} token để rút ${ethReceived.toFixed(6)} ETH...`
        );
      } else {
        alert(`Đang bán ${withdrawAmount} token để rút ETH...`);
      }
    } else {
      alert("Vui lòng nhập số token hợp lệ");
    }
  };

  const handleApproveOnly = () => {
    if (!approveAmount || approveAmount <= 0) {
      alert("Vui lòng nhập số lượng token cần approve");
      return;
    }

    token.approve(claim.contractAddress, approveAmount.toString());
    alert(`Đang approve ${approveAmount} token...`);
  };

  const handleBuyVoiceCredits = () => {
    if (!creditsAmount || !claim.creditRate) return;

    setIsProcessing(true);
    setPurchasedCredits(Number(creditsAmount));

    if (needsApproval) {
      token.approve(claim.contractAddress, requiredAmount.toString());

      setTimeout(() => {
        token.refetchAllowance?.();
        claim.buyVoiceCredits(creditsAmount.toString());
        setTimeout(() => {
          setCreditsAmount("");
          setShowBuyCredits(false);
          setIsProcessing(false);
          claim.refetchVoiceCredits?.();
        }, 3000);
      }, 8000);
    } else {
      claim.buyVoiceCredits(creditsAmount.toString());
      setTimeout(() => {
        setCreditsAmount("");
        setShowBuyCredits(false);
        setIsProcessing(false);
        claim.refetchVoiceCredits?.();
      }, 3000);
    }
  };

  const handleBuyDirect = () => {
    if (!creditsAmount) return;

    claim.buyVoiceCredits(creditsAmount.toString());

    setTimeout(() => {
      setCreditsAmount("");
      setShowBuyCredits(false);
      setIsProcessing(false);
      claim.refetchVoiceCredits?.();
    }, 3000);
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
          <section className="space-y-6">
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

            {isConnected && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
                <div className="mb-2 text-base font-semibold text-blue-900">
                  Ví Web3
                </div>
                <p>
                  Địa chỉ: {address?.slice(0, 8)}...{address?.slice(-6)}
                </p>
                <p>
                  Số dư {token.symbol}: {token.balance}
                </p>
                <p className="font-bold text-purple-700">
                  Voice Credits:{" "}
                  {claim.voiceCredits ? claim.voiceCredits.toString() : "0"}
                </p>
                {token.name && <p>Token: {token.name}</p>}
                <p className="text-xs text-blue-700">
                  Allowance: {token.allowance ? token.allowance.toString() : "0"}{" "}
                  {token.symbol}
                </p>

                <div className="mt-4 border-t border-blue-200 pt-3">
                  <Button
                    className="mb-2 w-full bg-orange-500 text-xs hover:bg-orange-600"
                    onClick={() => setShowApproveOnly((prev) => !prev)}
                  >
                    {showApproveOnly ? "Ẩn Approve" : "Approve Token"}
                  </Button>
                  {showApproveOnly && (
                    <div className="rounded border border-orange-200 bg-orange-50 p-3">
                      <label className="mb-1 block text-xs font-medium text-orange-800">
                        Số token muốn approve:
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="1000"
                        value={approveAmount}
                        onChange={(e) =>
                          setApproveAmount(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        className="mb-2 w-full rounded border border-orange-200 px-2 py-1 text-xs focus:outline-none"
                      />
                      <Button
                        onClick={handleApproveOnly}
                        disabled={isApproveDisabled}
                        className="w-full bg-orange-600 text-xs hover:bg-orange-700"
                      >
                        {token.isApproving
                          ? "Đang approve..."
                          : `Approve ${approveAmount || 0} ${token.symbol}`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Voice Credits
                </h2>
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setShowBuyCredits((prev) => !prev)}
                >
                  {showBuyCredits ? "Hide" : "Show"}
                </Button>
              </div>

              {showBuyCredits && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Số Voice Credits muốn mua:
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="10"
                      value={creditsAmount}
                      onChange={(e) =>
                        setCreditsAmount(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full rounded-lg border border-purple-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {claim.creditRate && creditsAmount && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
                      <p>
                        <strong>Tỷ giá hiện tại:</strong>
                      </p>
                      <p>
                        1 Voice Credit ={" "}
                        {Number(claim.creditRate).toLocaleString()}{" "}
                        {token.symbol}
                      </p>
                      <p className="mt-2 font-bold text-lg">
                        Tổng cần thanh toán: {requiredAmount.toLocaleString()}{" "}
                        {token.symbol}
                      </p>
                      {token.balance && (
                        <p
                          className={`mt-2 text-sm ${
                            requiredAmount > Number(token.balance)
                              ? "text-red-600 font-bold"
                              : "text-green-600"
                          }`}
                        >
                          Số dư khả dụng: {token.balance} {token.symbol}
                        </p>
                      )}
                      <p
                        className={`text-sm ${
                          needsApproval ? "text-orange-600" : "text-green-600"
                        }`}
                      >
                        Allowance:{" "}
                        {token.allowance ? token.allowance.toString() : "0"} /{" "}
                        {requiredAmount} {token.symbol}
                        {needsApproval && " (Cần approve thêm)"}
                      </p>
                    </div>
                  )}

                  {!isConnected ? (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-sm text-yellow-800">
                      Vui lòng kết nối ví để mua Voice Credits
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {needsApproval ? (
                        <Button
                          onClick={handleBuyVoiceCredits}
                          disabled={isBuyCreditsDisabled}
                          className="w-full bg-purple-600 py-3 text-white hover:bg-purple-700"
                        >
                          {isProcessing ||
                          claim.isBuyingCredits ||
                          token.isApproving
                            ? "Đang xử lý..."
                            : `Approve & Mua ${creditsAmount} Credits`}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleBuyDirect}
                          disabled={isBuyCreditsDisabled}
                          className="w-full bg-green-600 py-3 text-white hover:bg-green-700"
                        >
                          {claim.isBuyingCredits
                            ? "Đang xử lý..."
                            : `Mua ${creditsAmount} Credits`}
                        </Button>
                      )}

                      {isProcessing && (
                        <div className="text-center text-sm text-green-600">
                          {token.isApproving
                            ? "Đang approve token..."
                            : claim.isBuyingCredits
                              ? "Đang mua Voice Credits..."
                              : "Đã mua thành công!"}
                          {purchasedCredits > 0 && (
                            <p className="mt-2 text-lg font-bold text-purple-600">
                              Đã mua: {purchasedCredits} Voice Credits
                            </p>
                          )}
                        </div>
                      )}

                      {creditsAmount &&
                        requiredAmount > Number(token.balance) && (
                          <p className="text-center text-sm font-medium text-red-500">
                            Số dư không đủ để mua {creditsAmount} Voice Credits
                          </p>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {mockNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="text-sm font-semibold text-gray-900">
                    {notif.message.replace(/^Balance updated: /, "")}
                  </div>
                  <div className="text-xs text-gray-500">{notif.date}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
