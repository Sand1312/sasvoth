// src/maci/maci.controller.ts
import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { MaciService } from './maci.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

class DeployPollDto {
  @ApiProperty()
  startDate: number;

  @ApiProperty()
  endDate: number;

  @ApiProperty({ required: false })
  voteOptions?: number;
}

/**
 * MACI Controller - RESTful Resource-Oriented
 *
 * Resource: /maci/polls (MACI polls on-chain)
 * Sub-resource: /maci/polls/:id/contracts
 * Sub-resource: /maci/polls/:id/merge
 * Sub-resource: /maci/polls/:id/proofs
 *
 * POST   /maci/polls                    - Deploy a new poll
 * GET    /maci/polls/:id/contracts      - Get poll contracts
 * POST   /maci/polls/:id/merge          - Merge poll state
 * POST   /maci/polls/:id/merge/direct   - Direct merge state
 * POST   /maci/polls/:id/proofs         - Generate proofs
 * POST   /maci/polls/:id/proofs/submit  - Submit proofs
 */
@ApiTags('MACI')
@ApiBearerAuth()
@Controller('maci')
export class MaciController {
  constructor(private readonly maciService: MaciService) {}

  // ========================================
  // RESTful Endpoints (New)
  // ========================================

  /**
   * Deploy a new MACI poll
   * POST /maci/polls
   */
  @Post('polls')
  @ApiOperation({ summary: 'Deploy a new MACI poll' })
  @ApiBody({ type: DeployPollDto })
  @ApiResponse({ status: 201, description: 'Poll deployed successfully' })
  async createPoll(@Body() body: DeployPollDto) {
    return this.maciService.deployPoll(body);
  }

  /**
   * Get poll contracts
   * GET /maci/polls/:id/contracts
   */
  @Get('polls/:id/contracts')
  @ApiOperation({ summary: 'Get poll contracts' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Contracts retrieved successfully' })
  async getContracts(@Param('id') id: string) {
    return this.maciService.getPollContracts(id);
  }

  /**
   * Merge poll state
   * POST /maci/polls/:id/merge
   */
  @Post('polls/:id/merge')
  @ApiOperation({ summary: 'Merge poll state' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Poll merged successfully' })
  async merge(@Param('id') id: string) {
    return this.maciService.mergePoll(id);
  }

  /**
   * Direct merge state
   * POST /maci/polls/:id/merge/direct
   */
  @Post('polls/:id/merge/direct')
  @ApiOperation({ summary: 'Direct merge state' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Direct merge completed' })
  async mergeDirect(@Param('id') id: string) {
    return this.maciService.mergeStateDirect(id);
  }

  /**
   * Generate proofs
   * POST /maci/polls/:id/proofs
   */
  @Post('polls/:id/proofs')
  @ApiOperation({ summary: 'Generate proofs' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Proofs generated successfully' })
  async generateProofs(@Param('id') id: string) {
    return this.maciService.generateProofs(id);
  }

  /**
   * Submit proofs
   * POST /maci/polls/:id/proofs/submit
   */
  @Post('polls/:id/proofs/submit')
  @ApiOperation({ summary: 'Submit proofs' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Proofs submitted successfully' })
  async submitProofs(@Param('id') id: string) {
    return this.maciService.submitProofs(id);
  }

  // ========================================
  // Legacy Endpoints (Backward Compatibility)
  // ========================================

  /** @deprecated Use POST /maci/polls instead */
  @Post('deploy-poll')
  @ApiOperation({ summary: '[Deprecated] Deploy poll' })
  async deployPoll(@Body() body: DeployPollDto) {
    return this.createPoll(body);
  }

  /** @deprecated Use POST /maci/polls/:id/merge instead */
  @Post('merge/:pollId')
  @ApiOperation({ summary: '[Deprecated] Merge poll' })
  async mergePoll(@Param('pollId') pollId: string) {
    return this.merge(pollId);
  }

  /** @deprecated Use POST /maci/polls/:id/merge/direct instead */
  @Post('merge-direct/:pollId')
  @ApiOperation({ summary: '[Deprecated] Direct merge' })
  async mergeStateDirect(@Param('pollId') pollId: string) {
    return this.mergeDirect(pollId);
  }

  /** @deprecated Use POST /maci/polls/:id/proofs instead */
  @Post('generate-proofs/:pollId')
  @ApiOperation({ summary: '[Deprecated] Generate proofs' })
  async generateProofsLegacy(@Param('pollId') pollId: string) {
    return this.generateProofs(pollId);
  }

  /** @deprecated Use POST /maci/polls/:id/proofs/submit instead */
  @Post('submit-proofs/:pollId')
  @ApiOperation({ summary: '[Deprecated] Submit proofs' })
  async submitProofsLegacy(@Param('pollId') pollId: string) {
    return this.submitProofs(pollId);
  }

  /** @deprecated Use GET /maci/polls/:id/contracts instead */
  @Get('poll-contracts/:pollId')
  @ApiOperation({ summary: '[Deprecated] Get poll contracts' })
  async getPollContracts(@Param('pollId') pollId: string) {
    return this.getContracts(pollId);
  }
}
