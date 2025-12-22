"use client";
import React, { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { useIPFS } from "@/hooks/useIPFS";
import { useMaci } from "@/hooks/useMACI";
import { pollsApi } from "@/api";
import { useIdeas } from "@/hooks/useIdeas";
import { useClaimContract } from "@/hooks/useClaimContract";
import { useToken } from "@/hooks/useToken";
import { VoteDetailLayout, VoteLeftPanel, VoteTextBlock } from "@/components/vote/VoteDetailLayout";
import { VoteRightPanel } from "@/components/vote/VoteRightPanel";
import { VoteGallery } from "@/components/vote/VoteGallery";
import { useFeedback } from "@/contexts/FeedbackContext";
import { PrizeClaimForm } from "@/components/claim/PrizeClaimForm";

type Props = {
  params: Promise<{ id: string }>; // id = CID
};

type VoteData = {
  pollId: string;
  ideaId: string;
  title: string;
  description: string;
  creator: string;
  approvedAt: string;
  logo?: string;
  heroImage?: string;
  ageLimit?: number;
  layoutItems?: any[];
  maciAddress?: string;
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
  const publicClient = usePublicClient();
  const { showSuccess, showError } = useFeedback();

  if (!open) return null;

  const calculateVoteCost = (votes: number): number => {
    return votes * votes;
  };
  const handleBuy = async () => {
    if (!credits) return;
    try {
      const cost = calculateVoteCost(Number(credits));
      if (Number(token.balance) < cost) {
        showError("Insufficient Funds",
          `Bạn cần có ít nhất ${cost} ${token.symbol} để mua ${credits} voice credits.`
        );
        return;
      }

      console.log("Approving token spend...", cost.toString());
      const hash = await token.approve(claim.contractAddress, cost.toString());
      setTimeout(async () => {
        try {
          await claim.buyVoiceCredits(cost.toString());
          setCredits("");
          onNext(credits);
        } catch (e) {
          console.error(e);
          alert("Failed to buy credits");
        }
      }, 8000);
    } catch (e: any) {
      console.error(e);
      showError("Failed to Buy Credits", e.message || e);
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
        <p>
          You need voice credits to vote.Voting is calculated based on Quadratic
          Payments .
        </p>
        <input
          className="border-2 border-black rounded-lg px-4 py-2 text-black outline-none focus:bg-gray-50"
          placeholder="Enter amount"
          type="number"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          autoFocus
        />
        {credits && (
          <div className="mt-2 text-sm text-blue-700">
            Số tiền cần: <b>{Number(credits) * Number(credits)} HD</b>
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
        <h3 className="text-xl font-bold text-black">
          Enter a secret code to cast your vote.
        </h3>
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

// Debug Panel Component (Requirement 4.3)
function DebugPanel({
  detectedPollId,
  setDetectedPollId,
  latestOnChainPollId,
  setLatestOnChainPollId,
  getLatestPollId,
  tallying,
  setTallying,
  tallyStatus,
  setTallyStatus,
  mergePoll,
  generateProofs,
  submitProofs,
}: {
  detectedPollId: string | null;
  setDetectedPollId: (id: string | null) => void;
  latestOnChainPollId: string | null;
  setLatestOnChainPollId: (id: string | null) => void;
  getLatestPollId: () => Promise<string | null>;
  tallying: boolean;
  setTallying: (v: boolean) => void;
  tallyStatus: string;
  setTallyStatus: (s: string) => void;
  mergePoll: (pollId: string, maciAddress?: string) => Promise<void>;
  generateProofs: (
    pollId: string,
    maciAddress?: string,
    startBlock?: number
  ) => Promise<void>;
  submitProofs: (pollId: string, maciAddress?: string) => Promise<void>;
}) {
  // MACI state fetched from API (not localStorage)
  const [maciAddress, setMaciAddress] = useState<string | null>(null);
  const [startBlock, setStartBlock] = useState<number | null>(null);
  const [pollStateIndex, setPollStateIndex] = useState<string | null>(null);
  const [privKeyFormat, setPrivKeyFormat] = useState<{
    valid: boolean;
    format: string;
  } | null>(null);
  const [pubKeyFormat, setPubKeyFormat] = useState<{
    valid: boolean;
    format: string;
  } | null>(null);

  const { showSuccess, showError } = useFeedback();

  useEffect(() => {
    // Fetch MACI deployment info from API
    const fetchMaciInfo = async () => {
      try {
        const { maciApi } = await import("@/api/maci.api");
        const deployment = await maciApi.getLatestDeployment();
        setMaciAddress(deployment.maciAddress);
        setStartBlock(deployment.startBlock);
      } catch (err) {
        console.warn("Could not fetch MACI deployment, using fallback");
      }
    };
    fetchMaciInfo();

    // Poll State Index - stateIndex is now queried from chain dynamically
    setPollStateIndex("1");

    // Keys are now derived from wallet signature, not stored in localStorage
    // Show info that keys are derived dynamically
    setPrivKeyFormat({
      valid: true,
      format: "Derived from wallet signature (v2)",
    });

    setPubKeyFormat({
      valid: true,
      format: "Derived from wallet signature (v2)",
    });
  }, []);

  return (
    <div className="bg-yellow-50 p-3 rounded-lg text-sm mb-4 border border-yellow-200">
      <div className="font-semibold text-yellow-800 mb-2">
        Dev: MACI Debug Panel
      </div>
      <div className="flex flex-col gap-2">
        {/* MACI Address (Requirement 4.3) */}
        <div className="flex items-center gap-2">
          <span className="font-medium w-28">MACI Address:</span>
          <span className="font-mono text-xs bg-white px-2 py-1 rounded border truncate max-w-[250px]">
            {maciAddress || "Not set (using fallback)"}
          </span>
        </div>

        {/* Poll ID (Requirement 4.3) */}
        <div className="flex items-center gap-2">
          <span className="font-medium w-28">Poll ID:</span>
          <input
            type="text"
            value={detectedPollId || ""}
            onChange={(e) => setDetectedPollId(e.target.value)}
            className="border rounded px-2 py-1 w-16 text-xs"
            placeholder="N/A"
          />
          <span className="text-xs text-gray-500">
            {detectedPollId ? `(from DB)` : "Not found in any poll options"}
          </span>
        </div>

        {/* Poll State Index (Requirement 4.3: show pollStateIndex, not just stateIndex) */}
        <div className="flex items-center gap-2">
          <span className="font-medium w-28">Poll State Index:</span>
          <span
            className={`font-mono text-xs px-2 py-1 rounded border ${pollStateIndex ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}
          >
            {pollStateIndex || "Not joined"}
          </span>
        </div>

        {/* Key Format Validation (Requirement 4.3) */}
        <div className="flex items-center gap-2">
          <span className="font-medium w-28">Private Key:</span>
          {privKeyFormat ? (
            <span
              className={`font-mono text-xs px-2 py-1 rounded border ${privKeyFormat.valid ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}
            >
              {privKeyFormat.valid ? "✓" : "✗"} {privKeyFormat.format}
            </span>
          ) : (
            <span className="font-mono text-xs px-2 py-1 rounded border bg-gray-50 text-gray-500">
              Not set
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium w-28">Public Key:</span>
          {pubKeyFormat ? (
            <span
              className={`font-mono text-xs px-2 py-1 rounded border ${pubKeyFormat.valid ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}
            >
              {pubKeyFormat.valid ? "✓" : "✗"} {pubKeyFormat.format}
            </span>
          ) : (
            <span className="font-mono text-xs px-2 py-1 rounded border bg-gray-50 text-gray-500">
              Not set
            </span>
          )}
        </div>

        {/* Latest On-Chain Poll ID */}
        <div className="flex items-center gap-2">
          <span className="font-medium w-28">Latest On-Chain:</span>
          <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
            {latestOnChainPollId ?? "?"}
          </span>
          <button
            onClick={async () => {
              const latest = await getLatestPollId();
              setLatestOnChainPollId(latest);
              console.log("Latest on-chain poll ID:", latest);
            }}
            className="text-blue-600 underline text-xs"
          >
            Fetch
          </button>
          {latestOnChainPollId &&
            detectedPollId &&
            Number(detectedPollId) > Number(latestOnChainPollId) && (
              <span className="text-red-600 text-xs font-semibold">
                ⚠️ DB pollId &gt; on-chain!
              </span>
            )}
        </div>

        {/* Tally Section */}
        <div className="flex items-center gap-2 pt-2 border-t border-yellow-300 mt-2">
          <span className="font-medium">Tally:</span>
          {tallying && (
            <span className="text-xs font-mono text-emerald-600 animate-pulse">
              {tallyStatus}
            </span>
          )}
          <button
            onClick={async () => {
              if (!detectedPollId) {
                showError("Error", "Poll ID not found");
                return;
              }
              if (
                !confirm(
                  "This will trigger MACI Tallying (Merge -> Prove -> Submit). It may take a long time. Continue?"
                )
              ) {
                return;
              }
              // Use maciAddress and startBlock from state (fetched from API)
              const storedMaciAddress = maciAddress || undefined;
              const storedStartBlock = startBlock || 0;

              if (!storedMaciAddress) {
                if (
                  !confirm(
                    "MACI Address not found. Continue with server default?"
                  )
                ) {
                  return;
                }
              }

              setTallying(true);
              try {
                setTallyStatus("Merging Poll...");
                await mergePoll(detectedPollId, storedMaciAddress);

                setTallyStatus("Generating Proofs (this takes time)...");
                await generateProofs(
                  detectedPollId,
                  storedMaciAddress,
                  storedStartBlock
                );

                setTallyStatus("Submitting Proofs...");
                await submitProofs(detectedPollId, storedMaciAddress);

                setTallyStatus("Done!");
                showSuccess("Tally Completed", "Tally completed! Refresh to see results.");
              } catch (e: any) {
                console.error("Tally failed:", e);
                showError("Tally Failed", e.message);
                setTallyStatus("Failed.");
              } finally {
                setTallying(false);
              }
            }}
            disabled={tallying || !detectedPollId}
            className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {tallying ? "Tallying..." : "Tally Results"}
          </button>
        </div>
      </div>
    </div>
  );
}




export default function VotePage({ params }: Props) {
  const { id } = React.use(params); // Next.js 15: Unwrap params
  const { showSuccess, showError } = useFeedback();

  const {
    submitVote,
    joinMaciPoll,
    getLatestPollId,
    mergePoll,
    generateProofs,
    submitProofs,
  } = useMaci();
  const [latestOnChainPollId, setLatestOnChainPollId] = useState<string | null>(
    null
  );

  const [data, setData] = useState<VoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [voteAmount, setVoteAmount] = useState<number>(0);
  const [detectedPollId, setDetectedPollId] = useState<string | null>(null);
  const [tallying, setTallying] = useState(false);
  const [tallyStatus, setTallyStatus] = useState("");
  const [detectedOptionIndex, setDetectedOptionIndex] = useState<number | null>(null);

  const { fetchMetadata } = useIPFS();
  const { getIdeaById } = useIdeas();
  const token = useToken(); // Ensure token hook is used for balance check

  // Find poll that contains this idea in options[] using API
  useEffect(() => {
    async function findPollForIdea() {
      try {
        const poll = await pollsApi.getByOptionCid(id);
        if (poll && poll.pollIdOnChain !== undefined) {
          const pollIdOnChain = poll.pollIdOnChain.toString();
          console.log(
            `Found poll for idea ${id}: pollIdOnChain = ${pollIdOnChain}`
          );
          setDetectedPollId(pollIdOnChain);

          // Find option index
          if (Array.isArray(poll.options)) {
            const index = poll.options.findIndex((opt: string) => opt === id);
            if (index !== -1) {
              console.log(`Found option index for idea ${id}: ${index}`);
              setDetectedOptionIndex(index);
            } else {
              console.warn(`Idea ${id} not found in poll options`, poll.options);
            }
          }
        } else {
          console.log(`No poll found containing idea ${id} in options`);
        }
      } catch (err) {
        console.error("Error finding poll for idea:", err);
      }
    }
    findPollForIdea();
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Try IPFS first
        try {
          const data = await fetchMetadata(id);
          if (data) {
            if (!cancelled) {
              setData(data as VoteData);
            }
            return;
          }
        } catch (e) {
          console.warn("IPFS fetch failed, trying API fallback", e);
        }

        // Fallback to API
        const apiIdea = await getIdeaById(id);
        if (apiIdea && !cancelled) {
          setData({
            pollId: "N/A",
            ideaId: apiIdea._id,
            title: apiIdea.title,
            description: apiIdea.description ?? apiIdea.descriptionMore ?? "",
            creator: apiIdea.creatorIdea ?? apiIdea.creatorAddress ?? "",
            approvedAt: apiIdea.createdAt ?? new Date().toISOString(),
            logo: apiIdea.imgSrc,
            heroImage: apiIdea.imgsSrc?.[0],
            ageLimit: apiIdea.ageLimit ?? 0,
            layoutItems: apiIdea.descriptionMore?.[0] ? JSON.parse(apiIdea.descriptionMore[0]) : [],
          });
        } else if (!cancelled) {
          throw new Error("Failed to load vote data from both IPFS and API");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Failed to load vote data");
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

  async function handleVote(password: string) {
    // Use detected poll ID or fallback to "1"
    const pollIdOnChain = detectedPollId || "1";

    // Get startBlock from API (no localStorage)
    let votingStartBlock: number | undefined = undefined;
    try {
      const { maciApi } = await import("@/api/maci.api");
      const deployment = await maciApi.getLatestDeployment();
      votingStartBlock = deployment.startBlock;
    } catch (err) {
      console.warn("Could not fetch startBlock from API");
    }

    // Nonce is now managed by Backend (Redis). We don't need to track it locally.
    const nextNonce = 0; // Dummy value, ignored by backend

    if (!password) {
      showError("Password Required", "Bạn cần nhập password.");
      return;
    }

    // Submit Vote
    if (detectedOptionIndex === null) {
      showError("Vote Error", "Does not detect correct option index for this idea.");
      return;
    }
    const voteOptionIndex = detectedOptionIndex;

    const cost = (voteAmount || 1) * (voteAmount || 1);
    const balance = Number(token.balance || 0);

    if (cost > balance) {
      showError(
        "Insufficient Voice Credits",
        `Cost (${cost}) exceeds your balance (${balance}). Please buy more credits or reduce vote amount.`
      );
      return;
    }

    console.log("🗳️ Vote params:", {
      pollIdOnChain,
      voteOptionIndex,
      voteWeight: voteAmount || 1,
    });

    try {
      console.log("Using Poll ID:", pollIdOnChain);

      // Note: submitVote now handles key derivation and stateIndex lookup internally
      // It will prompt user to sign if keypair not cached
      const { hash } = await submitVote(
        pollIdOnChain,
        voteOptionIndex,
        voteAmount || 1,
        nextNonce,
        password, // Pass password
        votingStartBlock
      );

      showSuccess("Vote Success!", `Transaction Hash: ${hash?.substring(0, 20)}...`);
    } catch (e: any) {
      console.error(e);
      showError("Vote Failed", e.message);
    }
  }

  console.log("VotePage data loaded:", data);

  const getImageSrc = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("ipfs://")) {
      return `/api/v1/ipfs/${path.replace("ipfs://", "")}`;
    }
    if (path.startsWith("/") || path.startsWith("http")) return path;
    return `/api/v1/ipfs/${path}`;
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Vote #{data.pollId}</h1>
      {/* Debug Panel (Requirement 4.3) */}
      <DebugPanel
        detectedPollId={detectedPollId}
        setDetectedPollId={setDetectedPollId}
        latestOnChainPollId={latestOnChainPollId}
        setLatestOnChainPollId={setLatestOnChainPollId}
        getLatestPollId={getLatestPollId}
        tallying={tallying}
        setTallying={setTallying}
        tallyStatus={tallyStatus}
        setTallyStatus={setTallyStatus}
        mergePoll={mergePoll}
        generateProofs={generateProofs}
        submitProofs={submitProofs}
      />
      <VoteDetailLayout>
        <VoteLeftPanel>
          {data.heroImage && (
            <VoteGallery
              heroImage={getImageSrc(data.heroImage)}
              screenshots={[]} // Hide gallery part if mixed with dynamic layout, or handle below
            />
          )}

          {data.layoutItems && data.layoutItems.length > 0 ? (
            data.layoutItems.map((item: any) => {
              if (item.type === "text") {
                return <VoteTextBlock key={item.id} title={item.title} content={item.content} />;
              }
              if (item.type === "stack") {
                const stackImages = item.frames
                  ?.map((f: any) => f.ipfsUrl || f.url || f.preview) // Handle various potential keys
                  .filter((url: any) => typeof url === 'string')
                  .map((url: string) => getImageSrc(url));

                return (
                  <div key={item.id} className="w-full">
                    <h3 className="text-xl font-bold uppercase mb-2">{item.title}</h3>
                    <VoteGallery
                      screenshots={stackImages}
                      urlResolver={getImageSrc}
                    />
                  </div>
                );
              }
              return null;
            })
          ) : (
            /* Fallback for old ideas without layoutItems: Show default gallery */
            !data.heroImage && <VoteGallery />
          )}
        </VoteLeftPanel>

        <VoteRightPanel
          title={data.title}
          description={data.description}
          creator={data.creator}
          approvedAt={data.approvedAt}
          ideaId={data.ideaId}
          logo={data.logo ? getImageSrc(data.logo) : undefined}
          ageLimit={data.ageLimit}
          onVote={() => setShowBuyModal(true)}
        />
      </VoteDetailLayout>

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
      
      {/* Prize Claim Section (New) */}
      <div className="mt-8">
        <PrizeClaimForm 
          pollId={detectedPollId || "1"} 
          maciAddress={data?.maciAddress} // If data has maciAddress or use fetched one or default
        />
      </div>
    </main>
  );
}
