"use client";
import { Button } from "@sasvoth/ui/button";
import React, { use, useEffect, useState } from "react";
import { useIPFS } from "@/hooks/useIPFS";
import { useMaci } from "@/hooks/useMACI"
import { useJoinPoll } from "@/hooks/useJoinPoll";
import { useVote } from "@/hooks/useVote";
import { useClaimContract } from "@/hooks/useClaimContract";
import {useToken} from "@/hooks/useToken";
type Props = {
  params: { id: string }; // id = CID
};

type VoteData = {
  pollId: string;
  ideaId: string;
  title: string;
  description: string;
  creator: string;
  approvedAt: string;
};

function BuyTicketsModal({
  open,
  onClose,
  onNext,
}: {
  open: boolean;
  onClose: () => void;
  onNext: (credits: string) => void;
}) {
  const [credits, setCredits] = useState("");
  const claim = useClaimContract();
  const token = useToken();


  if (!open) return null;

  const calculateVoteCost = (votes: number): number => {
  return votes * votes;
};
  const handleBuy = async () => {
    if (!credits) return;
    try {
      const cost = calculateVoteCost(Number(credits));
      if (Number(token.balance) < cost) {
        alert(`Bạn cần có ít nhất ${cost} ${token.symbol} để mua ${credits} voice credits.`);
        return;
      }

      await token.approve(claim.contractAddress, cost.toString());
      // Đợi approve xong, sau đó mới gọi mua voice credits
      setTimeout(async () => {
        try {
          await claim.buyVoiceCredits(cost.toString());
          alert("Bought voice credits successfully!");
          setCredits("");
          // Chuyển sang bước tiếp theo
          onNext(credits);
        } catch (e) {
          console.error(e);
          alert("Failed to buy credits");
        }
      }, 8000); 

    } catch (e) {
      console.error(e);
      alert("Failed to buy credits");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md flex flex-col gap-4 relative">
        {/* Số dư token ở góc phải trên cùng */}
        <div className="absolute right-6 top-6 text-xs text-blue-800 font-semibold bg-blue-50 border border-blue-200 rounded px-3 py-1">
          Số dư: {token.balance} {token.symbol}
        </div>
        <h3 className="text-xl font-bold text-black">Buy Voice Credits</h3>
        <p>You need voice credits to vote.Voting is calculated based on Quadratic Payments .</p>
        <input
          className="border-2 border-black rounded-lg px-4 py-2 text-black outline-none focus:bg-gray-50"
          placeholder="Enter amount"
          type="number"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          autoFocus
        />
        {credits  && (
          <div className="mt-2 text-sm text-blue-700">
            Số tiền cần: <b>{(Number(credits) * Number(credits))} HD</b>
            <div className="text-xs text-gray-500 mt-1">
      Công thức: {credits}² = {Number(credits) * Number(credits)} HD
    </div>
          </div>
          
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-black hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={handleBuy}
            disabled={claim.isBuyingCredits}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {claim.isBuyingCredits ? "Buying..." : "Buy"}
          </button>
          <button
            onClick={() => onNext(credits)}
            className="px-6 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Next Step
          </button>
        </div>
      </div>
    </div>
  );
}

function VoteModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (val: string) => void;
}) {
  const [val, setVal] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md flex flex-col gap-4">
        <h3 className="text-xl font-bold text-black">Enter a secret code to cast your vote.</h3>
        <p>"Please remember this password to receive your reward."</p>
        <input
          className="border-2 border-black rounded-lg px-4 py-2 text-black outline-none focus:bg-gray-50"
          placeholder="Enter password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-black hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(val);
              setVal("");
              onClose();
            }}
            className="px-6 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

const screenshots = [
  "/screenshots/1.jpg",
  "/screenshots/2.jpg",
  "/screenshots/3.jpg",
  "/screenshots/4.jpg",
  "/screenshots/5.jpg",
  "/screenshots/6.jpg",
  "/screenshots/7.jpg",
  "/screenshots/8.jpg",
];

function ScreenshotGallery() {
  const [mainIndex, setMainIndex] = useState(0);

  const topThumbs = screenshots.slice(0, 4);
  const bottomGrid = screenshots.slice(4);

  return (
    <div className="w-full flex flex-col items-center bg-white text-black mt-8 py-6 rounded-xl border border-black">
      {/* Top Thumbnails */}
      <div className="flex gap-4 mb-4">
        {topThumbs.map((src, idx) => (
          <button
            key={src}
            onClick={() => setMainIndex(idx)}
            className={`overflow-hidden rounded-lg border-2 transition-all duration-150 ${mainIndex === idx
              ? "border-black"
              : "border-transparent hover:border-black"
              }`}
            style={{ width: 72, height: 48 }}
            aria-label={`Show screenshot ${idx + 1}`}
          >
            <img
              src={src}
              alt={`Screenshot ${idx + 1}`}
              className="object-cover w-full h-full grayscale transition-transform duration-150 hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* Main Preview */}
      <div className="w-full max-w-2xl aspect-video mb-6 rounded-2xl border-4 border-black bg-white flex items-center justify-center overflow-hidden">
        <img
          src={screenshots[mainIndex]}
          alt={`Main screenshot ${mainIndex + 1}`}
          className="object-cover w-full h-full grayscale"
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {bottomGrid.map((src, idx) => (
          <div
            key={src}
            className="bg-white rounded-xl overflow-hidden border-2 border-black flex items-center justify-center aspect-video"
          >
            <img
              src={src}
              alt={`Extra screenshot ${idx + 5}`}
              className="object-cover w-full h-full grayscale transition-transform duration-150 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VotePage({ params }: Props) {
  const { id } = params;

  const { submitVote } = useMaci();
  const { joinPoll, createVoteCommitment, check } = useJoinPoll();
  const { castVote } = useVote();
  const [data, setData] = useState<VoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [voteAmount, setVoteAmount] = useState<number>(0);

  const { fetchMetadata } = useIPFS();

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMetadata(id);
        if (!data) {
          throw new Error("Failed to load vote data");
        }
        if (!cancelled) {
          setData(data as VoteData);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Failed to load IPFS data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="p-4">
        <p className="text-black">Loading vote data from IPFS…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="p-4">
        <p className="text-red-600">
          Failed to load vote data from IPFS: {error ?? "Unknown error"}
        </p>
      </main>
    );
  }

  async function handleVote(privKey: string) {
    const voted = await check("6926b204727a41b3c53aafa1", "6926cc063d59305182bfdb58");
    if (voted.hasVoted) {
      alert("Bạn đã vote rồi không thể vote lại");
      return;
    }
    const stateIndex = localStorage.getItem(`maci_stateIndex`);
    const pubKeyX = localStorage.getItem(`maci_pubKeyX`);
    const pubKeyY = localStorage.getItem(`maci_pubKeyY`);
    const voterId = "6926b204727a41b3c53aafa222";
    if (!privKey) {
      alert("Bạn cần nhập đủ stateIndex, pubKeyX, pubKeyY.");
      return;
    }
    // await submitVote("6", 1, 100, Number(stateIndex), String(pubKeyX), String(pubKeyY));

    const voteCommitment = await createVoteCommitment("1", "102", "8", privKey);
    await joinPoll({
      voterId,
      pollId: "6926cc063d59305182bfdb58",
      voteCommitment,
      pollIdOnchain: 8,
    });

    await castVote({
      pollId: "6926cc063d59305182bfdb58",
      selectedOption: 2,
      voiceCredits: voteAmount,
    });


    alert(`Đã gửi vote với\nVote Commitment: ${voteCommitment}`);
  }

  const approvedAt = new Date(data.approvedAt);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Vote #{data.pollId}</h1>
      <div className="min-h-screen w-full flex flex-col md:flex-row gap-8 rounded-lg">
        {/* Left side */}
        <section className="md:w-2/3 w-full flex flex-col items-center justify-start p-6 overflow-y-auto max-h-[90vh]">
          <div className="w-full aspect-video border border-black rounded-xl flex items-center justify-center mb-6">
            <span className="text-black text-lg">Trailer / Screenshot</span>
          </div>
          <div className="flex items-center gap-2 w-full justify-center">
            <Button
              variant="ghost"
              className="rounded-full p-2 text-black hover:bg-gray-100"
              aria-label="Previous"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M15 19l-7-7 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="w-20 h-14 border border-black rounded-lg flex items-center justify-center text-black text-xs font-semibold"
                >
                  Img {n}
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="rounded-full p-2 text-black hover:bg-gray-100"
              aria-label="Next"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M9 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
          <div className="h-4" />
          <ScreenshotGallery />
        </section>
        {/* Right side */}
        <section className="md:w-1/3 w-full flex flex-col gap-6 p-6 border border-black rounded-xl">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">{data.title}</h2>
            <div className="flex gap-8 border-b border-black mb-4">
              <button className="pb-2 text-black font-semibold border-b-2 border-black">
                Overview
              </button>
              <button className="pb-2 text-black hover:underline transition-colors">
                Achievements
              </button>
            </div>
          </div>
          <div className="w-32 h-32 border border-black rounded-lg flex items-center justify-center mb-4">
            <span className="text-black text-sm">Logo</span>
          </div>
          <div className="text-black text-sm mb-2">
            <p className="mb-2">{data.description}</p>
            <p className="text-xs">
              Creator: <span className="font-mono">{data.creator}</span>
            </p>
            <p className="text-xs">
              Approved at:{""}
              {approvedAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p className="text-xs">Idea ID: {data.ideaId}</p>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="border border-black rounded-md px-3 py-1 text-black font-bold text-lg">
              18+
            </div>
            <span className="text-black text-sm">
              Extreme Violence, Strong Language
            </span>
          </div>
          <div className="text-black text-xs uppercase tracking-wider mb-1">
            Base Game
          </div>
          <div className="text-2xl font-bold text-black mb-4">₫209,000</div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setShowBuyModal(true)}
              className="border border-black text-black font-bold text-lg py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Vote
            </Button>
            <Button className="border border-black text-black font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Add To Pin
            </Button>
          </div>
        </section>
      </div>

      <VoteModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleVote}
      />

      <BuyTicketsModal
        open={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onNext={(amount) => {
          setVoteAmount(Number(amount));
          setShowBuyModal(false);
          setShowModal(true);
        }}
      />
    </main>
  );
}
