import { Controller, Get, Req, Res, Post } from '@nestjs/common';
import { Request } from 'express';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JoinPollService } from './join-poll.service';
import { calculateVoteCommitment } from '../../utils/voteCommitment';
import { poll } from 'ethers/lib/utils';

class CastVoteDto {
  @ApiProperty()
  voterId: string;

  @ApiProperty()
  pollId: string;

  @ApiProperty()
  selectedOption: string;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp: Date;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  voteCommitment: string;
}

@ApiTags('join-poll')
@ApiBearerAuth()
@Controller('join-poll')
export class JoinPollController {
  constructor(private readonly joinPollService: JoinPollService) {}

  @Get('get')
  @ApiOperation({ summary: 'Retrieve votes by user or poll' })
  @ApiQuery({ name: 'pollId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiResponse({ status: 200, description: 'Votes retrieved' })
  async getVotes(@Req() req: Request, @Res() res: Response) {
    const { pollId, voterId } = req.query;
    try {
      const votes = await this.joinPollService.get(
        voterId as string,
        pollId as string,
      );
      return res.status(200).json({ votes });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching votes', error });
    }
  }

  @Get('check')
  async checkVote(@Req() req: Request, @Res() res: Response) {
    const { voterId, pollId } = req.query;
    try {
      const vote = await this.joinPollService.get(
        voterId as string,
        pollId as string,
      );
      if (vote) {
        return res.status(200).json({ hasVoted: true });
      } else {
        return res.status(200).json({ hasVoted: false });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error checking vote', error });
    }
  }

  @Post('join')
  @ApiOperation({ summary: 'Cast a vote' })
  @ApiBody({ type: CastVoteDto })
  @ApiResponse({ status: 201, description: 'Vote cast' })
  async castVote(@Req() req: Request, @Res() res: Response) {
    const voteData = req.body;
    try {
      const newVote = await this.joinPollService.create(voteData);
      return res.status(201).json(newVote);
    } catch (error) {
      return res.status(500).json({ message: 'Error casting vote', error });
    }
  }

  @Post('createVoteCommitment')
  async createVoteCommitment(@Req() req: Request, @Res() res: Response) {
    const { vote, voiceCredits, pollIdOnchain, privateKey } = req.body;
    try {
      const voteCommitment = await calculateVoteCommitment(
        vote,
        voiceCredits,
        '1',
        pollIdOnchain,
        privateKey,
      );
      return res.status(201).json(voteCommitment);
    } catch (error) {
      console.error('Error in controller:', error);
      return res.status(500).json({
        error: error.message,
        receivedValues: { vote, voiceCredits, pollIdOnchain, privateKey },
      });
    }
  }
}
