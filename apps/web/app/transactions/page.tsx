"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@sasvoth/ui/button";
import { useAccount } from "wagmi";
import { useClaimContract, useToken, useUser } from "../../hooks";
import { useGenProofVerify } from "../../hooks/genProofVerify";
import { useResults } from "../../hooks";
import { useJoinPoll } from "../../hooks";
import { useVerifyVote } from "../../hooks";
import { useRewards } from "../../hooks";

type DepositHistory = {
  amount: number;
  timestamp: string;
 
};

export default function TransactionsPage() {
  const { address, isConnected } = useAccount();
  const token = useToken();
  const claim = useClaimContract();
  const { deposit, getHistoryDeposit } = useUser();

  const [isClient, setIsClient] = useState(false);

  // Deposit / withdraw
  const [showDeposit, setShowDeposit] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number | "">("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");

  // Vote form
  const [showVoteForm, setShowVoteForm] = useState(true);
  const [privateKey, setPrivateKey] = useState("");
  const [voteOptionId, setVoteOptionId] = useState<number | "">("");
  const [voiceCredit, setVoiceCredit] = useState<number | "">("");
  const [pollId, setPollId] = useState<number | "">("");
  const [isVoting, setIsVoting] = useState(false);
  const [history, setHistory] = useState<DepositHistory[]>([]);
  const [reloadHistory, setReloadHistory] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const fetchHistory = async () => {
      try {
        const userId = "69268cf4f62b0d28cb5f614f";
        const data = await getHistoryDeposit(userId);
        if (Array.isArray(data)) {
          
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch deposit history:", error);
      }
    };
    fetchHistory();
  }, [reloadHistory]);

  const isDepositDisabled = Boolean(
    claim.isBuying || !depositAmount || Number(depositAmount) < 0.001
  );

  const isWithdrawDisabled = Boolean(
    claim.isSelling ||
    !withdrawAmount ||
    Number(withdrawAmount) > Number(token.balance) ||
    Number(withdrawAmount) <= 0
  );


  const isVoteDisabled = Boolean(
    !isConnected ||
    !privateKey ||
    !voteOptionId ||
    !voiceCredit ||
    !pollId ||
    isVoting
  );

  const handleBuyToken = async () => {
    if (typeof depositAmount === "number" && depositAmount > 0) {
      const ethAmountString = depositAmount.toString();
      const result = await claim.buyHD(ethAmountString);
      console.log("Buy HD result:", result);
      const userId = "69268cf4f62b0d28cb5f614f";

      const amountToken = Number(depositAmount) * Number(claim.rate);
      const txHash = "0xMockTxHash1234567890abcdef";
      await deposit(userId, amountToken, txHash);
      setDepositAmount("");
      alert(`Đang mua token với ${depositAmount} ETH...`);
      setReloadHistory(prev => prev + 1);
    } else {
      alert("Vui lòng nhập số ETH hợp lệ");
    }
  };

  const handleWithdraw = async() => {
    if (typeof withdrawAmount === "number" && withdrawAmount > 0) {
      const tokenAmountString = withdrawAmount.toString();
      await token.approve(claim.contractAddress, tokenAmountString);

      setTimeout(async () => {
      await claim.sellHD(tokenAmountString);
      setWithdrawAmount("");
      const userId = "69268cf4f62b0d28cb5f614f";
      const txHash = "0xMockWithdrawTxHashabcdef1234567890";
      const amountToken = Number(withdrawAmount) - Number(withdrawAmount) *2;
        await deposit(userId, amountToken, txHash);

      
        setReloadHistory(prev => prev + 1);

      }, 8000);
       
        // alert(
        //   `Đang bán ${withdrawAmount} token để rút ${ethReceived.toFixed(6)} ETH...`
        // );
     
    } else {
      alert("Vui lòng nhập số token hợp lệ");
    }
  };


  const { generateVoteProof, verifyProof, loading: proofLoading, status: proofStatus } = useGenProofVerify();
  const { getResults } = useResults();
  const { get } = useJoinPoll();
  const { verifyVote } = useVerifyVote();
  const { getReward, saveReward } = useRewards();


  const handleSubmitVote = async () => {
    const poll = "6926cc063d59305182bfdb58"; //id poll từ backend
    const voterId = "6926b204727a41b3c53aafa1";//user._id
    const result = await getResults(poll);
    const votes = await get({ pollId: poll, voterId });
    const voterIndex = 1; //user.voterIndex
    console.log("Fetched results:", result.outCome);
    console.log("Fetched votes:", votes.voteCommitment);
    if (isVoteDisabled) return;

    setIsVoting(true);
    const input = {
      privateKey: BigInt(privateKey),
      vote: BigInt(voteOptionId),
      voiceCredits: BigInt(voiceCredit),
      nonce: BigInt(1),
      pollId: BigInt(pollId),
      pubkeyX: BigInt("0x6926cc063d59305182bfdb58"),// user.pubkeyX,
      pubkeyY: BigInt("0x6926cc063d59305182bfdb58"),// user.pubkeyY,
      voiceCreditBalance: BigInt(voiceCredit),

      // Public inputs (will be in publicSignals)
      voterIndex: BigInt(voterIndex),// user.voterIndex,
      voteCommitment: BigInt(votes.voteCommitment),
      outcome: BigInt(result.outCome),

    }

    const proofData = await generateVoteProof(input);

    const isValid = await verifyProof(proofData.proof, proofData.publicSignals);
    console.log("Proof validity:", proofData);
    if (isValid) {
      const proof = convertProofToSolidityFormat(proofData.proof);
      await verifyVote(BigInt(pollId), BigInt(voterIndex), proof, proofData.publicSignals);

      await saveReward(voterId, poll, (Number(voiceCredit) * 1000));
    }

    // fake delay cho đẹp UI
    setTimeout(() => {
      alert(
        `Đã submit vote:\n- Poll #${pollId}\n- Option: ${voteOptionId}\n- Voice credits: ${voiceCredit}`
      );
      setIsVoting(false);
    }, 1200);
  };

  function convertProofToSolidityFormat(proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  }): [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] {
    const proofArray: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [

      BigInt(proof.pi_a[0]!),
      BigInt(proof.pi_a[1]!),

      BigInt(proof.pi_b[0]![0]!),
      BigInt(proof.pi_b[0]![1]!),
      BigInt(proof.pi_b[1]![0]!),
      BigInt(proof.pi_b[1]![1]!),

      BigInt(proof.pi_c[0]!),
      BigInt(proof.pi_c[1]!)
    ];

    return proofArray;
  }

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
          {/* LEFT COLUMN */}
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

            {/* Wallet info */}
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

                {token.name && <p>Token: {token.name}</p>}
                <p className="text-xs text-blue-700">
                  Allowance:{" "}
                  {token.allowance ? token.allowance.toString() : "0"}{" "}
                  {token.symbol}
                </p>
              </div>
            )}
          </section>
          {/* VOTE FORM */}
          <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Vote Form</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Demo form để submit vote bằng voice credits.
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => setShowVoteForm((prev) => !prev)}
              >
                {showVoteForm ? "Hide" : "Show"}
              </Button>
            </div>

            {showVoteForm && (
              <div className="space-y-4">
                <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-[11px] text-red-700">
                  ⚠️ <strong>Cảnh báo bảo mật:</strong> Đây chỉ là form demo.
                  Trong thực tế, không nên nhập private key trực tiếp vào
                  website.
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Private Key
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập private key..."
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Vote Option ID
                    </label>
                    <input
                      type="number"
                      placeholder="1"
                      value={voteOptionId}
                      onChange={(e) =>
                        setVoteOptionId(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Voice Credit
                    </label>
                    <input
                      type="number"
                      placeholder="10"
                      value={voiceCredit}
                      onChange={(e) =>
                        setVoiceCredit(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Poll ID
                    </label>
                    <input
                      type="number"
                      placeholder="7"
                      value={pollId}
                      onChange={(e) =>
                        setPollId(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {voteOptionId && voiceCredit && pollId && (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800">
                    <p className="font-semibold">Tóm tắt vote:</p>
                    <p className="mt-1">
                      • Poll: <strong>#{pollId}</strong>
                    </p>
                    <p>
                      • Option: <strong>{voteOptionId}</strong>
                    </p>
                    <p>
                      • Voice credits: <strong>{voiceCredit}</strong>
                    </p>
                  </div>
                )}

                {!isConnected && (
                  <p className="text-xs text-red-500">
                    Vui lòng kết nối ví trước khi vote.
                  </p>
                )}

                <Button
                  onClick={handleSubmitVote}
                  disabled={isVoteDisabled}
                  className="w-full bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVoting
                    ? "Đang submit vote..."
                    : "Submit Vote với Voice Credits"}
                </Button>
              </div>
            )}
          </div>

          {/* History */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions found.</p>
            ) : (
              [...history].reverse().map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-semibold text-gray-900">
                     {item.amount} HD
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                 
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
