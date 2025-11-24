import {
  Controller,
  Get,
  Req,
  Res,
  Post,
} from "@nestjs/common";
import { Request } from "express";
import { Response } from "express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { VotesService } from "./votes.service";
import {calculateVoteCommitment} from "../../utils/voteCommitment"
import { poll } from "ethers/lib/utils";
@Controller('votes')
export class VotesController {
    constructor(private readonly votesService:VotesService) { };

    @Get("get")
    @ApiOperation({ summary: 'Retrieve votes by user or poll' })
    @ApiQuery({ name: 'pollId', required: false })
    @ApiQuery({ name: 'userId', required: false })
    @ApiResponse({ status: 200, description: 'Votes retrieved' })
    async getVotes(@Req() req: Request, @Res() res: Response) {
        const { pollId, voterId } = req.query;
        try {
            const votes = await this.votesService.get(voterId as string, pollId as string);
            return res.status(200).json({ votes });
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching votes', error });
        }
    }

    @Post("vote")
    @ApiOperation({ summary: 'Cast a vote' })
    @ApiBody({ type: CastVoteDto })
    @ApiResponse({ status: 201, description: 'Vote cast' })
    async castVote(@Req() req: Request, @Res() res: Response) {
        const voteData = req.body;
        try {
            const newVote = await this.votesService.create(voteData);
            return res.status(201).json(newVote);
        } catch (error) {
            return res.status(500).json({ message: 'Error casting vote', error });
        }
    }

    @Post("createVoteCommitment")
    async createVoteCommitment(@Req() req:Request,@Res() res:Response){
        const {vote,voiceCredits,pollIdOnchain,privateKey} = req.body;
        try{
            const voteCommitment = await calculateVoteCommitment(vote,voiceCredits,"1",pollIdOnchain,privateKey)
            return res.status(201).json(voteCommitment);

        } catch(error){
             console.error('Error in controller:', error);
        return res.status(500).json({ 
            error: error.message,
            receivedValues: { vote, voiceCredits, pollIdOnchain, privateKey }
        });
        }
    }

}
