import { Controller, Post, Get, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { MaciService } from './maci.service';
import { MaciDeploymentsService } from './maci-deployments.service';
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

class SignupDto {
  @ApiProperty()
  pubKey: { x: string; y: string };

  @ApiProperty({ required: false })
  maciAddress?: string;
}

class MaciSignupDto {
  @ApiProperty({ description: "MACI Public Key string (macipk...)" })
  maciPubKey: string;

  @ApiProperty({ required: false })
  maciAddress?: string;

  @ApiProperty({ required: false })
  sgData?: string;
}

class MaciSignupEip712Dto {
  @ApiProperty({ description: "MACI Public Key X coordinate" })
  pubKeyX: string;

  @ApiProperty({ description: "MACI Public Key Y coordinate" })
  pubKeyY: string;

  @ApiProperty({ description: "EIP-712 signature" })
  signature: string;

  @ApiProperty({ description: "User nonce for anti-replay" })
  nonce: number;

  @ApiProperty({ description: "Signature deadline timestamp" })
  deadline: number;

  @ApiProperty({ required: false })
  maciAddress?: string;
}

class JoinPollDto {
  @ApiProperty({ description: "User MACI Private Key" })
  maciPrivateKey: string;

  @ApiProperty({ required: false })
  maciAddress?: string;

  @ApiProperty({ required: false })
  startBlock?: number;
}

class VoteDto {
  @ApiProperty()
  voteOptionIndex: number;

  @ApiProperty()
  voteWeight: number;

  @ApiProperty()
  nonce: number;

  @ApiProperty()
  userStateIndex: string;

  @ApiProperty()
  userMaciPrivateKey: string;

  @ApiProperty()
  userMaciPublicKey: string;

  @ApiProperty({ required: false })
  maciAddress?: string;
}

/**
 * MACI Controller - RESTful Resource-Oriented
 *
 * Resource: /maci/polls (MACI polls on-chain)
 * Sub-resource: /maci/polls/:id/contracts
 * Sub-resource: /maci/polls/:id/merge
 * Sub-resource: /maci/polls/:id/proofs
 *
 * POST   /maci/signup                   - Signup to MACI (legacy)
 * POST   /maci/signup-eip712            - Signup with EIP-712 signature
 * GET    /maci/nonce/:address           - Get nonce for EIP-712 signing
 * GET    /maci/deployments/latest       - Get latest MACI deployment
 * GET    /maci/deployments/:address     - Get MACI deployment by address
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
  constructor(
    private readonly maciService: MaciService,
    private readonly maciDeploymentsService: MaciDeploymentsService,
  ) { }

  // ========================================
  // MACI Deployment Endpoints
  // ========================================

  /**
   * Get all MACI deployments
   * GET /maci/deployments
   * 
   * Returns cached stats from DB (updated by DeploymentStatsSyncJob every 5 mins)
   */
  @Get('deployments')
  @ApiOperation({ summary: 'Get all MACI deployments for subscriptions' })
  @ApiResponse({ status: 200, description: 'Deployments retrieved' })
  async getDeployments() {
    const deployments = await this.maciDeploymentsService.getValid();
    
    // Return cached stats from DB (no live RPC calls)
    return deployments.map(d => ({
      id: d._id?.toString() || d.maciAddress,
      maciAddress: d.maciAddress,
      name: d.name,
      logo: d.logo,
      chain: d.chain,
      members: d.members || 0,
      pollCount: d.pollCount || 0,
    }));
  }

  /**
   * Get latest MACI deployment
   * GET /maci/deployments/latest
   */
  @Get('deployments/latest')
  @ApiOperation({ summary: 'Get latest MACI deployment info' })
  @ApiResponse({ status: 200, description: 'Latest deployment retrieved' })
  async getLatestDeployment() {
    const deployment = await this.maciDeploymentsService.getLatest();
    if (!deployment) {
      throw new NotFoundException('No MACI deployments found');
    }
    return {
      maciAddress: deployment.maciAddress,
      name: deployment.name,
      logo: deployment.logo,
      startBlock: deployment.startBlock,
      subgraphUrl: deployment.subgraphUrl,
      chain: deployment.chain,
    };
  }

  /**
   * Get MACI deployment by address
   * GET /maci/deployments/:address
   */
  @Get('deployments/:address')
  @ApiOperation({ summary: 'Get MACI deployment by address' })
  @ApiParam({ name: 'address', type: String })
  @ApiResponse({ status: 200, description: 'Deployment info retrieved' })
  async getDeploymentByAddress(@Param('address') address: string) {
    const deployment = await this.maciDeploymentsService.getByAddress(address);
    if (!deployment) {
      throw new NotFoundException(`MACI deployment not found: ${address}`);
    }
    return {
      maciAddress: deployment.maciAddress,
      startBlock: deployment.startBlock,
      subgraphUrl: deployment.subgraphUrl,
      chain: deployment.chain,
    };
  }

  // ========================================
  // RESTful Endpoints (New)
  // ========================================

  /**
   * Get MACI configuration including dynamic subgraph URL
   * GET /maci/config
   */
  @Get('config')
  @ApiOperation({ summary: 'Get MACI configuration (subgraph URL, start block, etc.)' })
  @ApiResponse({ status: 200, description: 'Config retrieved successfully' })
  async getConfig() {
    return this.maciService.getConfig();
  }


  /**
   * Signup to MACI (Relayer - Legacy)
   * POST /maci/signup
   */
  @Post('signup')
  @ApiOperation({ summary: 'Signup to MACI (Relayed - Legacy)' })
  @ApiBody({ type: MaciSignupDto })
  @ApiResponse({ status: 201, description: 'Signed up successfully' })
  async signup(@Body() body: MaciSignupDto) {
    return this.maciService.signup(body.maciPubKey, body.maciAddress, body.sgData);
  }

  /**
   * Signup to MACI with EIP-712 signature (Secure)
   * POST /maci/signup-eip712
   * 
   * Backend verifies user eligibility in Users collection before relaying
   */
  @Post('signup-eip712')
  @ApiOperation({ summary: 'Signup to MACI with EIP-712 signature (Secure)' })
  @ApiBody({ type: MaciSignupEip712Dto })
  @ApiResponse({ status: 201, description: 'Signed up successfully' })
  @ApiResponse({ status: 403, description: 'User not eligible' })
  async signupWithSignature(@Body() body: MaciSignupEip712Dto) {
    return this.maciService.signupWithSignature(
      body.pubKeyX,
      body.pubKeyY,
      body.signature,
      body.nonce,
      body.deadline,
      body.maciAddress
    );
  }

  /**
   * Get nonce for a user (for EIP-712 signing)
   * GET /maci/nonce/:address
   */
  @Get('nonce/:address')
  @ApiOperation({ summary: 'Get nonce for EIP-712 signing' })
  @ApiParam({ name: 'address', type: String })
  @ApiResponse({ status: 200, description: 'Nonce retrieved' })
  async getNonce(@Param('address') address: string) {
    return this.maciService.getNonce(address);
  }

  /**
   * Join Poll (Relayed)
   * POST /maci/polls/:id/join
   */
  @Post('polls/:id/join')
  @ApiOperation({ summary: 'Join Poll (Relayed)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: JoinPollDto })
  @ApiResponse({ status: 201, description: 'Joined poll successfully' })
  async joinPoll(@Param('id') id: string, @Body() body: JoinPollDto) {
    return this.maciService.joinPoll(id, body.maciPrivateKey, body.maciAddress, body.startBlock);
  }

  /**
   * Vote (Relayed)
   * POST /maci/polls/:id/vote
   */
  @Post('polls/:id/vote')
  @ApiOperation({ summary: 'Vote (Relayed)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: VoteDto })
  @ApiResponse({ status: 201, description: 'Vote submitted successfully' })
  async vote(@Param('id') id: string, @Body() body: VoteDto) {
    return this.maciService.vote(
      id,
      body.voteOptionIndex,
      body.voteWeight,
      body.nonce,
      body.userStateIndex,
      body.userMaciPrivateKey,
      body.userMaciPublicKey,
      body.maciAddress
    );
  }


  /**
   * Deploy MACI Contract
   * POST /maci/deploy
   */
  @Post('deploy')
  @ApiOperation({ summary: 'Deploy new MACI Contract' })
  @ApiResponse({ status: 201, description: 'MACI contract deployed' })
  async deployMaci(@Body() body: any) {
    return this.maciService.deployMaci(body);
  }

  /**
   * Deploy a new MACI poll
   * POST /maci/polls
   */
  @Post('polls')
  @ApiOperation({ summary: 'Deploy a new MACI poll' })
  @ApiBody({ type: DeployPollDto })
  @ApiResponse({ status: 201, description: 'Poll deployed successfully' })
  async createPoll(@Body() body: any) {
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
  async getContracts(@Param('id') id: string, @Query('maciAddress') maciAddress?: string) {
    return this.maciService.getPollContracts(id, maciAddress);
  }

  /**
   * Merge poll state
   * POST /maci/polls/:id/merge
   */
  @Post('polls/:id/merge')
  @ApiOperation({ summary: 'Merge poll state' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Poll merged successfully' })
  async merge(@Param('id') id: string, @Body() body: { maciAddress?: string }) {
    return this.maciService.mergePoll(id, body?.maciAddress);
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
  async generateProofs(@Param('id') id: string, @Body() body: { maciAddress?: string; startBlock?: number }) {
    return this.maciService.generateProofs(id, body?.maciAddress, body?.startBlock);
  }

  /**
   * Submit proofs
   * POST /maci/polls/:id/proofs/submit
   */
  @Post('polls/:id/proofs/submit')
  @ApiOperation({ summary: 'Submit proofs' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Proofs submitted successfully' })
  async submitProofs(@Param('id') id: string, @Body() body: { maciAddress?: string }) {
    return this.maciService.submitProofs(id, body?.maciAddress);
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
    return this.merge(pollId, {});
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
    return this.generateProofs(pollId, {});
  }

  /** @deprecated Use POST /maci/polls/:id/proofs/submit instead */
  @Post('submit-proofs/:pollId')
  @ApiOperation({ summary: '[Deprecated] Submit proofs' })
  async submitProofsLegacy(@Param('pollId') pollId: string) {
    return this.submitProofs(pollId, {});
  }

  /** @deprecated Use GET /maci/polls/:id/contracts instead */
  @Get('poll-contracts/:pollId')
  @ApiOperation({ summary: '[Deprecated] Get poll contracts' })
  async getPollContracts(@Param('pollId') pollId: string) {
    return this.getContracts(pollId);
  }
}
