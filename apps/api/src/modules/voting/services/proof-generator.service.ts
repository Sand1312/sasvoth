import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as path from 'path'

export interface VoteProofInput {
  privateKey: string
  vote: string
  voiceCredits: string
  nonce: string
  pollId: string
  pubkeyX: string
  pubkeyY: string
  voiceCreditBalance: string
  voterIndex: string
  voteCommitment: string
  outcome: string
  stateLeaf: string
}

export interface GeneratedProof {
  proof: any
  publicSignals: string[]
}

@Injectable()
export class ProofGeneratorService {
  private readonly logger = new Logger(ProofGeneratorService.name)
  private circuitsDir = path.join(process.cwd(), 'packages', 'circuits', 'build')
  private wasmFile = path.join(this.circuitsDir, 'VoteProof_js', 'VoteProof.wasm')
  private zkeyFile = path.join(this.circuitsDir, 'VoteProof_0000.zkey')
  private vkeyFile = path.join(this.circuitsDir, 'verification_key.json')
  private useMockProver = true // Set to false once circuit is compiled

  constructor(private configService: ConfigService) {
    // Check if circuit files exist
    if (!fs.existsSync(this.wasmFile)) {
      this.logger.warn(
        `Circuit WASM not found at ${this.wasmFile}. Using mock prover for development.`
      )
      this.useMockProver = true
    } else {
      this.useMockProver = false
      this.logger.log('Using real circuit prover')
    }
  }

  async generateVoteProof(input: VoteProofInput): Promise<GeneratedProof> {
    try {
      if (this.useMockProver) {
        return this.generateMockProof(input)
      }

      // Production: Use real snarkjs
      const snarkjs = await import('snarkjs')
      const witness = await this.buildWitness(input)
      const { proof, publicSignals } = await snarkjs.groth16.prove(this.zkeyFile, witness)

      return { proof, publicSignals }
    } catch (error) {
      this.logger.error(`Proof generation failed: ${error.message}`)
      throw new Error(`Proof generation failed: ${error.message}`)
    }
  }

  private generateMockProof(input: VoteProofInput): GeneratedProof {
    // Development mock - generates consistent proof structure
    const inputHash = Buffer.from(JSON.stringify(input))
      .toString('hex')
      .slice(0, 64)

    return {
      proof: {
        pi_a: [
          `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
          `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
          '0x1',
        ],
        pi_b: [
          [
            `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
            `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
          ],
          [
            `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
            `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
          ],
          ['0x1', '0x0'],
        ],
        pi_c: [
          `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
          `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
          '0x1',
        ],
      },
      publicSignals: [inputHash, inputHash, inputHash, inputHash],
    }
  }

  private async buildWitness(input: VoteProofInput): Promise<any> {
    // Load and run circuit WASM
    const snarkjs = await import('snarkjs')

    // Simulate witness calculation
    return {
      privateKey: BigInt(input.privateKey),
      vote: BigInt(input.vote),
      voiceCredits: BigInt(input.voiceCredits),
      nonce: BigInt(input.nonce),
      pollId: BigInt(input.pollId),
      pubkeyX: BigInt(input.pubkeyX),
      pubkeyY: BigInt(input.pubkeyY),
      voiceCreditBalance: BigInt(input.voiceCreditBalance),
      voterIndex: BigInt(input.voterIndex),
      voteCommitment: BigInt(input.voteCommitment),
      outcome: BigInt(input.outcome),
      stateLeaf: BigInt(input.stateLeaf),
    }
  }

  async verifyProof(proof: any, publicSignals: string[]): Promise<boolean> {
    try {
      if (this.useMockProver) {
        return this.verifyMockProof(proof, publicSignals)
      }

      if (!fs.existsSync(this.vkeyFile)) {
        this.logger.warn('Verification key not found, skipping on-chain verification')
        return false
      }

      const snarkjs = await import('snarkjs')
      const vKey = JSON.parse(fs.readFileSync(this.vkeyFile, 'utf8'))
      return await snarkjs.groth16.verify(vKey, publicSignals, proof)
    } catch (error) {
      this.logger.error(`Proof verification failed: ${error.message}`)
      return false
    }
  }

  private verifyMockProof(proof: any, publicSignals: string[]): boolean {
    // Mock verification - just check structure
    return (
      proof &&
      proof.pi_a &&
      Array.isArray(proof.pi_a) &&
      proof.pi_b &&
      Array.isArray(proof.pi_b) &&
      proof.pi_c &&
      Array.isArray(proof.pi_c) &&
      Array.isArray(publicSignals) &&
      publicSignals.length === 4
    )
  }

  /**
   * Get verification key for smart contract
   */
  async getVerificationKey(): Promise<any> {
    try {
      if (this.useMockProver) {
        // Return mock verification key structure
        return this.getMockVerificationKey()
      }

      const vkeyPath = path.join(this.circuitsDir, 'verification_key.json')
      if (!fs.existsSync(vkeyPath)) {
        throw new Error('Verification key not found')
      }

      return JSON.parse(fs.readFileSync(vkeyPath, 'utf8'))
    } catch (error) {
      this.logger.error(`Failed to get verification key: ${error.message}`)
      throw error
    }
  }

  /**
   * Get public inputs template
   */
  getPublicInputsTemplate(): any {
    return {
      voterIndex: '0',
      voteCommitment: '0',
      outcome: '0',
      stateLeaf: '0',
    }
  }

  /**
   * Get private inputs template
   */
  getPrivateInputsTemplate(): any {
    return {
      privateKey: '0',
      vote: '0',
      voiceCredits: '0',
      nonce: '0',
      pollId: '0',
      pubkeyX: '0',
      pubkeyY: '0',
      voiceCreditBalance: '0',
    }
  }

  /**
   * Get complete circuit information
   */
  async getCircuitInfo(): Promise<any> {
    return {
      circuitName: 'VoteProof',
      isCompiled: !this.useMockProver,
      publicInputs: this.getPublicInputsTemplate(),
      privateInputs: this.getPrivateInputsTemplate(),
      verificationKey: await this.getVerificationKey(),
      description: 'Zero-knowledge proof for MACI voting system',
      constraints: [
        'Verify state leaf is valid (hashes correctly)',
        'Verify vote commitment is valid',
        'Verify user vote matches winning outcome',
      ],
    }
  }

  /**
   * Get mock verification key for development
   */
  private getMockVerificationKey(): any {
    return {
      protocol: 'groth16',
      curve: 'bn128',
      nPublic: 4,
      vk_alpha_1: [
        '0x...mock...',
        '0x...mock...',
        '0x1',
      ],
      vk_beta_2: [
        ['0x...mock...', '0x...mock...'],
        ['0x...mock...', '0x...mock...'],
        ['0x1', '0x0'],
      ],
      vk_gamma_2: [
        ['0x...mock...', '0x...mock...'],
        ['0x...mock...', '0x...mock...'],
        ['0x1', '0x0'],
      ],
      vk_delta_2: [
        ['0x...mock...', '0x...mock...'],
        ['0x...mock...', '0x...mock...'],
        ['0x1', '0x0'],
      ],
      vk_alphabeta_12: [[['0x...mock...'], ['0x...mock...']]],
      IC: [
        ['0x...mock...', '0x...mock...'],
        ['0x...mock...', '0x...mock...'],
      ],
    }
  }
}
