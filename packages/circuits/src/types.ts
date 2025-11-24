export interface VoteCircuitInput {
  privateKey: string;
  vote: string;
  voiceCredits: string;
  nonce: string;
  pollId: string;
  pubkeyX: string;
  pubkeyY: string;
  voiceCreditBalance: string;
  
  // Public inputs (will be in publicSignals)
  voterIndex: string;
  voteCommitment: string;
  outcome: string;
}

export interface ProofData {
  proof: {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: string;
  };
  publicSignals: string[];
}