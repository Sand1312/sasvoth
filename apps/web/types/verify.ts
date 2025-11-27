
export interface G1Point {
  x: bigint;
  y: bigint;
}

export interface G2Point {
  x: [bigint, bigint];
  y: [bigint, bigint];
}

export interface VerifyVoteParams {
  pollId: bigint;
  voterIndex: bigint;
  proof: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
  publicInputs: [bigint, bigint, bigint];
}