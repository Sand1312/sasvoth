import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Post,
  NotFoundException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { Response } from "express";
import { VotesService } from "./votes.service";
@Controller('votes')
export class VotesController {
    constructor(private readonly votesService:VotesService) { };

    @Get("get")
    async getVotes(@Req() req: Request, @Res() res: Response) {
        const { pollId, userId } = req.query;
        try {
            const votes = await this.votesService.get(userId as string, pollId as string);
            return res.status(200).json({ votes });
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching votes', error });
        }
    }   

    @Post("vote")
    async castVote(@Req() req: Request, @Res() res: Response) {
        const voteData = req.body;
        try {
            const newVote = await this.votesService.create(voteData);
            return res.status(201).json(newVote);
        } catch (error) {
            return res.status(500).json({ message: 'Error casting vote', error });
        }
    }

}