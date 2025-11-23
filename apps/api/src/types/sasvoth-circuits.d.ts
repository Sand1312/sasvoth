declare module '@sasvoth/circuits' {
  // Minimal declarations to satisfy TypeScript when importing the workspace package.
  export class VoteProofGenerator {
    constructor(baseDir?: string);
    generateVoteProof(input: any): Promise<any>;
    verifyProof(proof: any, publicSignals: string[]): Promise<boolean>;
  }
  export type VoteCircuitInput = any;
  export type ProofData = any;
}
