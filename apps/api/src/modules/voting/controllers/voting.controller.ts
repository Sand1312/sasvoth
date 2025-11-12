import { Controller, Post, Get, Body } from '@nestjs/common'
import { ProofGeneratorService, VoteProofInput } from '../services/proof-generator.service'

@Controller('voting')
export class VotingController {
  constructor(private proofGeneratorService: ProofGeneratorService) {}

  /**
   * Get circuit information including verification key and public inputs template
   */
  @Get('circuit-info')
  async getCircuitInfo() {
    try {
      const info = await this.proofGeneratorService.getCircuitInfo()
      return {
        success: true,
        data: info,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Get verification key for smart contract deployment
   */
  @Get('verification-key')
  async getVerificationKey() {
    try {
      const vkey = await this.proofGeneratorService.getVerificationKey()
      return {
        success: true,
        verificationKey: vkey,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Get public inputs template
   */
  @Get('public-inputs-template')
  async getPublicInputsTemplate() {
    try {
      const template = this.proofGeneratorService.getPublicInputsTemplate()
      return {
        success: true,
        template,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Generate zero-knowledge proof for a vote
   */
  @Post('generate-proof')
  async generateProof(@Body() input: VoteProofInput) {
    try {
      const result = await this.proofGeneratorService.generateVoteProof(input)
      return {
        success: true,
        proof: result.proof,
        publicSignals: result.publicSignals,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Verify proof locally before submitting on-chain
   */
  @Post('verify-proof')
  async verifyProof(@Body() { proof, publicSignals }: any) {
    try {
      const verified = await this.proofGeneratorService.verifyProof(proof, publicSignals)
      return {
        success: true,
        verified,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }
}
