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
import { VotesService } from './votes.service';
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

@ApiTags('Votes')
@ApiBearerAuth()
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get()
  async getVotes(@Req() req: Request, @Res() res: Response) {
    const pollId = req.query.pollId as string;
    const votes = await this.votesService.get(pollId);
    return res.status(200).json({ votes });
  }

  @Post()
  @ApiOperation({ summary: 'Cast a vote in a poll' })
  @ApiBody({ type: CastVoteDto })
  @ApiResponse({ status: 201, description: 'Vote cast successfully' })
  async castVote(@Req() req: Request, @Res() res: Response) {
    const  voteData  = req.body;
    try {
      await this.votesService.create(voteData);
      return res.status(201).json({ message: 'Vote cast successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error casting vote', error });
    }
  }
}
