const snarkjs = require('snarkjs');
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { VoteCircuitInput, ProofData } from './types';

export class VoteProofGenerator {
  private wasmPath: string;
  private zkeyPath: string;
  private vkeyPath: string;

  constructor(baseDir?: string) {
    const root = baseDir ?? path.join(__dirname, '..');
    this.wasmPath = path.join(root, 'voteProof_js', 'voteProof.wasm');
    this.zkeyPath = path.join(root, 'voteProof_0001.zkey');
    this.vkeyPath = path.join(root, 'verification_key.json');

    // Diagnostic logs to help debug missing assets at runtime
    try {
      console.log('[VoteProofGenerator] root:', root);
      console.log('[VoteProofGenerator] wasmPath:', this.wasmPath);
      console.log('[VoteProofGenerator] zkeyPath:', this.zkeyPath);
      console.log('[VoteProofGenerator] vkeyPath:', this.vkeyPath);

      // Check existence; if missing, try a few fallbacks to help common monorepo layouts
      const candidates = [
        this.wasmPath,
        path.join(process.cwd(), 'packages', 'circuits', 'dist', 'voteProof_js', 'voteProof.wasm'),
        path.join(process.cwd(), 'packages', 'circuits', 'voteProof_js', 'voteProof.wasm'),
        path.join(__dirname, '..', 'voteProof_js', 'voteProof.wasm'),
      ];

      const wasmFound = candidates.find(p => existsSync(p));
      if (wasmFound && wasmFound !== this.wasmPath) {
        console.warn('[VoteProofGenerator] wasm not found at initial path, falling back to:', wasmFound);
        this.wasmPath = wasmFound;
      }

      const zkeyCandidates = [
        this.zkeyPath,
        path.join(process.cwd(), 'packages', 'circuits', 'dist', 'voteProof_0001.zkey'),
        path.join(process.cwd(), 'packages', 'circuits', 'voteProof_0001.zkey'),
        path.join(__dirname, '..', 'voteProof_0001.zkey'),
      ];
      const zkeyFound = zkeyCandidates.find(p => existsSync(p));
      if (zkeyFound && zkeyFound !== this.zkeyPath) {
        console.warn('[VoteProofGenerator] zkey not found at initial path, falling back to:', zkeyFound);
        this.zkeyPath = zkeyFound;
      }

      const vkeyCandidates = [
        this.vkeyPath,
        path.join(process.cwd(), 'packages', 'circuits', 'dist', 'verification_key.json'),
        path.join(process.cwd(), 'packages', 'circuits', 'verification_key.json'),
        path.join(__dirname, '..', 'verification_key.json'),
      ];
      const vkeyFound = vkeyCandidates.find(p => existsSync(p));
      if (vkeyFound && vkeyFound !== this.vkeyPath) {
        console.warn('[VoteProofGenerator] vkey not found at initial path, falling back to:', vkeyFound);
        this.vkeyPath = vkeyFound;
      }

      // Final existence check
      if (!existsSync(this.wasmPath) || !existsSync(this.zkeyPath) || !existsSync(this.vkeyPath)) {
        console.error('[VoteProofGenerator] One or more proof assets are missing:');
        console.error('  wasm exists:', existsSync(this.wasmPath), this.wasmPath);
        console.error('  zkey exists:', existsSync(this.zkeyPath), this.zkeyPath);
        console.error('  vkey exists:', existsSync(this.vkeyPath), this.vkeyPath);
      }
    } catch (err) {
      console.warn('[VoteProofGenerator] diagnostic check failed:', err);
    }
  }

  async generateVoteProof(input: VoteCircuitInput): Promise<ProofData> {
    try {
      console.log('Starting proof generation...');

      // Diagnostic: log input (stringify safely)
      try {
        console.log('[VoteProofGenerator] input:', JSON.stringify(input));
      } catch (e) {
        console.log('[VoteProofGenerator] input (could not stringify)', input);
      }

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
      // Print full error stack for circom_runtime internals
      console.error("Proof generation failed:", error && (error.stack || error));
      // Rethrow with original error message and stack preserved
      const err = new Error(`Proof generation failed: ${error && error.message ? error.message : String(error)}`);
      // attach original stack if present
      if (error && error.stack) {
        // @ts-ignore
        err.stack += '\nCaused by: ' + error.stack;
      }
      throw err;
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