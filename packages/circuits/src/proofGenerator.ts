const snarkjs = require('snarkjs');
import { readFileSync } from 'fs';
import path from 'path';
import { VoteCircuitInput, ProofData } from './types';

export class VoteProofGenerator {
  private wasmPath: string;
  private zkeyPath: string;
  private vkeyPath: string;

  constructor() {
    this.wasmPath = path.join(__dirname, '..', 'voteProof_js', 'voteProof.wasm');
    this.zkeyPath = path.join(__dirname, '..', 'voteProof_0001.zkey');
    this.vkeyPath = path.join(__dirname, '..', 'verification_key.json');
  }

  async generateVoteProof(input: VoteCircuitInput): Promise<ProofData> {
    try {
      console.log('Starting proof generation...');

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        {
          privateKey: input.privateKey,// -> hash  privKEY claimer 
          vote: input.vote,
          voiceCredits: input.voiceCredits,
          nonce: input.nonce,
          pollId: input.pollId,
          pubkeyX: input.pubkeyX,
          pubkeyY: input.pubkeyY,
          voiceCreditBalance: input.voiceCreditBalance,// thừa sẽ bỏ
          voterIndex: input.voterIndex,
          voteCommitment: input.voteCommitment,
          outcome: input.outcome
        },
        this.wasmPath,
        this.zkeyPath
      );

      console.log(' Proof generated successfully');
      
      return {
        proof: proof,
        publicSignals: publicSignals
      };
    } catch (error:any) {
      console.error("Proof generation failed:", error);
      throw new Error(`Proof generation failed: ${error.message}`);
    }
  }

  async verifyProof(proof: any, publicSignals: string[]): Promise<boolean> {
    try {
      const vkey = JSON.parse(readFileSync(this.vkeyPath, 'utf8'));
      const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
      
      console.log('Proof verification:', isValid ? 'VALID' : 'INVALID');
      return isValid;
    } catch (error) {
      console.error("Proof verification failed:", error);
      return false;
    }
  }
}