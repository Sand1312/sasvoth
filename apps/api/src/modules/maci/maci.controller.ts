// src/maci/maci.controller.ts
import { Controller, Post, Get, Param ,Body } from '@nestjs/common';
import { MaciService } from './maci.service';

@Controller('maci')
export class MaciController {
  constructor(private readonly maciService: MaciService) {}

    @Post('deploy-poll')
  async deployPoll(@Body() body: { startDate: number; endDate: number; voteOptions?: number }) {
    return this.maciService.deployPoll(body);
  }

  @Post('merge/:pollId')
  async mergePoll(@Param('pollId') pollId: string) {
    return this.maciService.mergePoll(pollId);
  }

  @Post('merge-direct/:pollId')
  async mergeStateDirect(@Param('pollId') pollId: string) {
    return this.maciService.mergeStateDirect(pollId);
  }

  @Post('generate-proofs/:pollId')
  async generateProofs(@Param('pollId') pollId: string) {
    return this.maciService.generateProofs(pollId);
  }

  @Post('submit-proofs/:pollId')
  async submitProofs(@Param('pollId') pollId: string) {
    return this.maciService.submitProofs(pollId);
  }

  @Get('poll-contracts/:pollId')
  async getPollContracts(@Param('pollId') pollId: string) {
    return this.maciService.getPollContracts(pollId);
  }
  
}
