"use client";

import { Button } from "@sasvoth/ui/button";
import React, { useState, useEffect, useMemo } from "react";
import { useToken, useClaimContract, usePolls } from "../../hooks";
import { useAccount } from "wagmi";
// Types cho Poll
type Poll = {
  _id: string;
  title: string;
  description: string;
  category: string;
  onChainPollId: number;
  status:
    | "draft"
    | "active"
    | "ended"
    | "cancelled"
    | "processing"
    | "tallying";
  startTime: string;
  endTime: string;
  options: {
    id: string;
    label: string;
    description?: string;
    imageUrl?: string;
  }[];
  createdBy: {
    _id: string;
    username: string;
  };
};

type Move = {
  id: number;
  to: string;
  amount: number;
};

type Notification = {
  id: number;
  message: string;
  date: string;
};

const mockMoves: Move[] = [
  { id: 1, to: "Alice", amount: 120 },
  { id: 2, to: "Bob", amount: 75 },
  { id: 3, to: "Charlie", amount: 200 },
  { id: 4, to: "Diana", amount: 50 },
];

const mockNotifications: Notification[] = [
  { id: 1, message: "Balance updated: +$120", date: "2024-06-10" },
  { id: 2, message: "Balance updated: -$75", date: "2024-06-09" },
  { id: 3, message: "Balance updated: +$200", date: "2024-06-08" },
  { id: 4, message: "Balance updated: -$50", date: "2024-06-07" },
];

// API functions

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [isClient, setIsClient] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  // --- Polls state ---
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [pollError, setPollError] = useState<string>("");

  // --- Deposit/Mua Token state ---
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number | "">("");

  // --- Rút tiền/Bán Token state ---
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");

  // --- Mua Voice Credits state ---
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState<number | "">("");
  const [purchasedCredits, setPurchasedCredits] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveOnly, setShowApproveOnly] = useState(false);
  const [approveAmount, setApproveAmount] = useState<number | "">("");
  const { getPollsByType } = usePolls();
  // Web3 hooks
  const token = useToken();
  const claim = useClaimContract();

  useEffect(() => {
    setIsClient(true);
    loadPolls();
  }, []);

  // Load polls từ API
  const loadPolls = async () => {
    try {
      setLoadingPolls(true);
      const data = await getPollsByType();
      setActivePolls(data);
      setPolls(data); // Hiển thị active polls mặc định
    } catch (error) {
      setPollError("Failed to load polls");
      console.error("Error loading polls:", error);
    } finally {
      setLoadingPolls(false);
    }
  };

  // Theo dõi sự thay đổi của voice credits
  useEffect(() => {
    if (claim.voiceCredits && isConnected) {
      console.log("Voice credits updated:", claim.voiceCredits);
    }
  }, [claim.voiceCredits, isConnected]);

  // Logic approve cho Voice Credits
  const needsApproval = useMemo(() => {
    if (!creditsAmount || !claim.creditRate || !token.allowance) return true;

    const requiredAmount = Number(creditsAmount) * Number(claim.creditRate);
    return Number(token.allowance) < requiredAmount;
  }, [creditsAmount, claim.creditRate, token.allowance]);

  // Tính số token cần approve
  const requiredAmount = useMemo(() => {
    if (!creditsAmount || !claim.creditRate) return 0;
    return Number(creditsAmount) * Number(claim.creditRate);
  }, [creditsAmount, claim.creditRate]);

  // Hàm approve riêng
  const handleApproveOnly = () => {
    if (!approveAmount || approveAmount <= 0) {
      alert("Vui lòng nhập số lượng token cần approve");
      return;
    }

    token.approve(claim.contractAddress, approveAmount.toString());
    alert(`Đang approve ${approveAmount} token...`);
  };

  // Hàm duy nhất xử lý cả approve và buy
  const handleBuyVoiceCredits = () => {
    if (!creditsAmount || !claim.creditRate) return;

    setIsProcessing(true);
    setPurchasedCredits(Number(creditsAmount));

    if (needsApproval) {
      console.log("🔐 Thực hiện approve trước...");
      // Thực hiện approve
      token.approve(claim.contractAddress, requiredAmount.toString());

      // ĐỢI 8 GIÂY RỒI TỰ ĐỘNG BUY
      setTimeout(() => {
        console.log(" Approve xong, thực hiện buy...");
        // Refetch allowance để kiểm tra
        token.refetchAllowance?.();

        // Thực hiện buy
        const creditsString = creditsAmount.toString();
        claim.buyVoiceCredits(creditsString);

        // Reset form sau 3 giây
        setTimeout(() => {
          setCreditsAmount("");
          setShowBuyCredits(false);
          setIsProcessing(false);
          // Refetch voice credits sau khi mua
          claim.refetchVoiceCredits?.();
        }, 3000);
      }, 8000); // ĐỢI 8 GIÂY
    } else {
      // Nếu đã approve rồi thì mua luôn
      const creditsString = creditsAmount.toString();
      claim.buyVoiceCredits(creditsString);

      // Reset form sau 3 giây
      setTimeout(() => {
        setCreditsAmount("");
        setShowBuyCredits(false);
        setIsProcessing(false);
        // Refetch voice credits sau khi mua
        claim.refetchVoiceCredits?.();
      }, 3000);
    }
  };

  // Hàm mua trực tiếp (khi đã approve đủ)
  const handleBuyDirect = () => {
    if (!creditsAmount) return;

    const creditsString = creditsAmount.toString();
    claim.buyVoiceCredits(creditsString);

    setTimeout(() => {
      setCreditsAmount("");
      setShowBuyCredits(false);
      // Refetch voice credits sau khi mua
      claim.refetchVoiceCredits?.();
    }, 3000);
  };

  const toggleHidden = (id: number) => {
    setHiddenIds((prev) =>
      prev.includes(id) ? prev.filter((hid) => hid !== id) : [...prev, id]
    );
  };

  // Hàm mua token với ETH
  const handleBuyToken = () => {
    if (typeof depositAmount === "number" && depositAmount > 0) {
      const ethAmountString = depositAmount.toString();
      claim.buyHD(ethAmountString);
      setDepositAmount("");
      setShowDeposit(false);
      alert(`Đang mua token với ${depositAmount} ETH...`);
    } else {
      alert("Vui lòng nhập số ETH hợp lệ");
    }
  };

  // Hàm rút tiền (bán token lấy ETH)
  const handleWithdraw = () => {
    if (typeof withdrawAmount === "number" && withdrawAmount > 0) {
      const tokenAmountString = withdrawAmount.toString();
      claim.sellHD(tokenAmountString);
      setWithdrawAmount("");
      setShowWithdraw(false);

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

  const movesWithDate = mockMoves.map((move, idx) => ({
    ...move,
    date: mockNotifications[idx]?.date ?? "2024-06-01",
  }));

  const sortedMoves = [...movesWithDate].sort((a, b) => {
    if (sortBy === "amount") {
      return b.amount - a.amount;
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  // Biến cho disabled states
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

  // Loading state cho SSR
  if (!isClient) {
    return (
      <div className="flex gap-8 mt-8 items-start justify-center px-6 py-6">
        {/* LEFT: Your Vote Skeleton */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white border rounded-lg shadow px-5 py-4 h-32 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3 mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2 mx-auto"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Balance Skeleton */}
        <div className="flex-1 flex flex-col items-end pr-8">
          <div className="w-full max-w-[340px] space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg px-5 py-4 h-16 animate-pulse"
              ></div>
            ))}
            <div className="bg-gray-200 rounded-lg px-5 py-4 h-20 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-8 mt-8 items-start justify-center px-6 py-6">
        {/* LEFT: Your Vote */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Vote</h2>
            <div className="flex gap-2">
              <button
                className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 transition"
                onClick={() =>
                  setSortBy((prev) => (prev === "date" ? "amount" : "date"))
                }
              >
                Sort by {sortBy === "date" ? "Amount" : "Date"}
              </button>
              <button
                className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 transition"
                onClick={() => {
                  if (hiddenIds.length === mockMoves.length) {
                    setHiddenIds([]);
                  } else {
                    setHiddenIds(mockMoves.map((move) => move.id));
                  }
                }}
              >
                {hiddenIds.length === mockMoves.length
                  ? "Show All"
                  : "Hide All"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {sortedMoves.map((move) => (
              <div
                key={move.id}
                className="bg-white border rounded-lg shadow px-5 py-4 flex flex-col items-center justify-center"
              >
                <div className="text-base font-semibold mb-2">
                  {hiddenIds.includes(move.id) ? "****" : move.to}
                </div>
                <div className="text-lg font-bold">
                  {hiddenIds.includes(move.id) ? "****" : `$${move.amount}`}
                </div>
                <div className="text-xs text-slate-400 mb-1">{move.date}</div>
                <button
                  className="mt-2 text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition"
                  onClick={() => toggleHidden(move.id)}
                >
                  {hiddenIds.includes(move.id) ? "Show" : "Hide"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Balance + Deposit + Withdraw */}
        <div className="flex-1 flex flex-col items-end pr-8">
          <div className="w-full max-w-[340px] flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Balance Notification</h2>
              <div className="flex gap-2">
                <Button
                  className="text-sm"
                  onClick={() => setShowWithdraw((prev) => !prev)}
                >
                  Withdraw
                </Button>
                <Button
                  className="text-sm"
                  onClick={() => setShowDeposit((prev) => !prev)}
                >
                  Deposit
                </Button>
              </div>
            </div>

            {/* Deposit Form - Dùng để mua token */}
            {showDeposit && (
              <div className="bg-white border rounded-lg p-4 shadow flex flex-col gap-2">
                <h3 className="font-semibold text-lg mb-2">Mua HD Token</h3>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="border px-3 py-2 rounded text-sm focus:outline-none w-full"
                  />
                </div>

                {/* Thông tin tỷ giá */}
                {claim.rate && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                    <div className="text-sm text-blue-800">
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
                  </div>
                )}

                {/* Thông báo kết nối ví */}
                {!isConnected ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <p className="text-sm text-yellow-800">
                      Vui lòng kết nối ví để mua token
                    </p>
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

            {/* Withdraw Form - Dùng để bán token lấy ETH */}
            {showWithdraw && (
              <div className="bg-white border rounded-lg p-4 shadow flex flex-col gap-2">
                <h3 className="font-semibold text-lg mb-2">
                  Rút Tiền (Bán Token)
                </h3>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="border px-3 py-2 rounded text-sm focus:outline-none w-full"
                  />
                </div>

                {/* Thông tin tỷ giá và số ETH sẽ nhận */}
                {claim.rate && withdrawAmount && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                    <div className="text-sm text-green-800">
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
                  </div>
                )}

                {/* Thông báo kết nối ví và số dư */}
                {!isConnected ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <p className="text-sm text-yellow-800">
                      Vui lòng kết nối ví để rút tiền
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <p className="text-sm text-gray-700">
                        <strong>Số dư khả dụng:</strong> {token.balance}{" "}
                        {token.symbol}
                      </p>
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
                        <p className="text-red-500 text-sm text-center">
                          Số dư không đủ
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* Web3 Wallet Info với Voice Credits */}
            {isConnected && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="font-semibold text-blue-800 mb-2">Ví Web3</div>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    Địa chỉ: {address?.slice(0, 8)}...{address?.slice(-6)}
                  </p>
                  <p>
                    Số dư {token.symbol}: {token.balance}
                  </p>
                  {/* HIỂN THỊ VOICE CREDITS */}
                  <p className="font-bold text-purple-700">
                    Voice Credits:{" "}
                    {claim.voiceCredits ? claim.voiceCredits.toString() : "0"}
                  </p>
                  {token.name && <p>Token: {token.name}</p>}
                  {/* THÔNG TIN ALLOWANCE */}
                  <p className="text-xs text-gray-600">
                    Allowance:{" "}
                    {token.allowance ? token.allowance.toString() : "0"}{" "}
                    {token.symbol}
                  </p>
                </div>

                {/* NÚT APPROVE RIÊNG */}
                <div className="mt-3 pt-3 border-t border-blue-300">
                  <Button
                    className="w-full text-xs bg-orange-500 hover:bg-orange-600 mb-2"
                    onClick={() => setShowApproveOnly((prev) => !prev)}
                  >
                    {showApproveOnly ? "Ẩn Approve" : "Approve Token"}
                  </Button>

                  {showApproveOnly && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <label className="block text-xs font-medium text-orange-800 mb-1">
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
                        className="border border-orange-300 px-2 py-1 rounded text-xs focus:outline-none w-full mb-2"
                      />
                      <Button
                        onClick={handleApproveOnly}
                        disabled={isApproveDisabled}
                        className="w-full text-xs bg-orange-600 hover:bg-orange-700"
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

            {/* Notifications */}
            {mockNotifications.slice(0, 3).map((notif) => (
              <div
                key={notif.id}
                className="bg-slate-50 rounded-lg px-5 py-4 shadow flex flex-col items-start"
              >
                <div className="font-semibold text-sm mb-1">
                  {notif.message.replace(/^Balance updated: /, "")}
                </div>
                <div className="text-xs text-slate-400">{notif.date}</div>
              </div>
            ))}

            {/* Token Balance Display với Voice Credits */}
            {isConnected && (
              <div className="bg-white border rounded-lg shadow px-5 py-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">
                    Token Balance:
                  </span>
                  <span className="font-bold text-lg text-blue-600">
                    {token.balance} {token.symbol}
                  </span>
                </div>
                {/* HIỂN THỊ VOICE CREDITS */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-semibold text-purple-700">
                    Voice Credits:
                  </span>
                  <span className="font-bold text-lg text-purple-600">
                    {claim.voiceCredits ? claim.voiceCredits.toString() : "0"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Votes Section với Polls từ API */}
      <div className="flex justify-center py-10 px-4">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-black p-8 flex flex-col items-center">
          <div className="flex justify-between items-center w-full mb-8">
            <h2 className="text-2xl font-bold text-black tracking-tight">
              Active Votes
            </h2>
            <div className="flex gap-2">
              {/* NÚT REFRESH VOICE CREDITS */}
              <Button
                className="text-sm bg-green-600 hover:bg-green-700"
                onClick={() => claim.refetchVoiceCredits?.()}
              >
                Refresh Credits
              </Button>
              <Button
                className="text-sm bg-purple-600 hover:bg-purple-700"
                onClick={() => setShowBuyCredits((prev) => !prev)}
              >
                Buy Voice Credits
              </Button>
              {/* NÚT RELOAD POLLS */}
              <Button
                className="text-sm bg-blue-600 hover:bg-blue-700"
                onClick={loadPolls}
                disabled={loadingPolls}
              >
                {loadingPolls ? "Loading..." : "Refresh Polls"}
              </Button>
            </div>
          </div>

          {/* Buy Voice Credits Form */}
          {showBuyCredits && (
            <div className="w-full max-w-md bg-white border-2 border-purple-200 rounded-lg p-6 shadow-lg mb-8">
              <h3 className="font-semibold text-xl mb-4 text-purple-800 text-center">
                Mua Voice Credits
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="border border-purple-300 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                />
              </div>

              {claim.creditRate && creditsAmount && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-purple-800">
                    <p>
                      <strong>Tỷ giá hiện tại:</strong>
                    </p>
                    <p>
                      1 Voice Credit ={" "}
                      {Number(claim.creditRate).toLocaleString()} {token.symbol}
                    </p>
                    <p className="mt-2 font-bold text-lg">
                      Tổng cần thanh toán: {requiredAmount.toLocaleString()}{" "}
                      {token.symbol}
                    </p>
                    {token.balance && (
                      <p
                        className={`text-sm mt-2 ${
                          requiredAmount > Number(token.balance)
                            ? "text-red-600 font-bold"
                            : "text-green-600"
                        }`}
                      >
                        Số dư khả dụng: {token.balance} {token.symbol}
                      </p>
                    )}
                    {/* THÔNG TIN ALLOWANCE */}
                    <p
                      className={`text-sm mt-1 ${
                        needsApproval ? "text-orange-600" : "text-green-600"
                      }`}
                    >
                      Allowance:{" "}
                      {token.allowance ? token.allowance.toString() : "0"} /{" "}
                      {requiredAmount} {token.symbol}
                      {needsApproval && " (Cần approve thêm)"}
                    </p>
                  </div>
                </div>
              )}

              {/* Thông báo kết nối ví */}
              {!isConnected ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 text-center">
                    Vui lòng kết nối ví để mua Voice Credits
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* NÚT CHO TRƯỜNG HỢP CHƯA APPROVE */}
                  {needsApproval ? (
                    <Button
                      onClick={handleBuyVoiceCredits}
                      disabled={isBuyCreditsDisabled}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                    >
                      {isProcessing ||
                      claim.isBuyingCredits ||
                      token.isApproving
                        ? "Đang xử lý..."
                        : `Approve & Mua ${creditsAmount} Credits`}
                    </Button>
                  ) : (
                    /* NÚT CHO TRƯỜNG HỢP ĐÃ APPROVE */
                    <Button
                      onClick={handleBuyDirect}
                      disabled={isBuyCreditsDisabled}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    >
                      {claim.isBuyingCredits
                        ? "Đang xử lý..."
                        : `Mua ${creditsAmount} Credits`}
                    </Button>
                  )}

                  {/* HIỂN THỊ TRẠNG THÁI */}
                  {isProcessing && (
                    <div className="text-center">
                      <p className="text-green-600 text-sm font-medium">
                        {token.isApproving
                          ? "Đang approve token..."
                          : claim.isBuyingCredits
                            ? "Đang mua Voice Credits..."
                            : "Đã mua thành công!"}
                      </p>
                      {purchasedCredits > 0 && (
                        <p className="text-purple-600 font-bold text-lg mt-2">
                          Đã mua: {purchasedCredits} Voice Credits
                        </p>
                      )}
                    </div>
                  )}

                  {creditsAmount && requiredAmount > Number(token.balance) && (
                    <p className="text-red-500 text-sm text-center font-medium">
                      Số dư không đủ để mua {creditsAmount} Voice Credits
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Polls Loading State */}
          {loadingPolls && (
            <div className="w-full flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải polls...</p>
              </div>
            </div>
          )}

          {/* Polls Error State */}
          {pollError && !loadingPolls && (
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="text-red-800 text-center">
                <p className="font-semibold">Lỗi khi tải polls</p>
                <p className="text-sm mt-2">{pollError}</p>
                <Button
                  onClick={loadPolls}
                  className="mt-4 bg-red-600 hover:bg-red-700"
                >
                  Thử lại
                </Button>
              </div>
            </div>
          )}

          {/* Polls Grid */}
          {!loadingPolls && !pollError && (
            <div className="flex flex-wrap gap-8 w-full justify-center">
              {activePolls.length === 0 ? (
                <div className="w-full text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Không có poll nào đang active
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Hãy tạo poll mới hoặc thử lại sau
                  </p>
                </div>
              ) : (
                activePolls.map((poll, idx) => (
                  <div
                    key={poll._id}
                    className="w-64 bg-white rounded-xl shadow-md transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl border border-black flex flex-col cursor-pointer"
                    onClick={() => {
                      window.location.href = `/votes/${poll.onChainPollId}`;
                    }}
                    tabIndex={0}
                    role="button"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        window.location.href = `/votes/${poll.onChainPollId}`;
                      }
                    }}
                  >
                    <div className="px-4 py-3 border-b border-black">
                      <h3 className="text-center font-semibold text-lg text-black">
                        {poll.title}
                      </h3>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-2 flex-grow">
                      <p className="text-black text-sm line-clamp-2">
                        {poll.description || "No description"}
                      </p>
                      <div className="text-xs text-gray-500 mt-auto">
                        <p>Options: {poll.options.length}</p>
                        <p>Status: {poll.status}</p>
                        <p>
                          Ends: {new Date(poll.endTime).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/votes/${poll.onChainPollId}`;
                        }}
                      >
                        {poll.status === "active" ? "Vote Now" : "View Poll"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
